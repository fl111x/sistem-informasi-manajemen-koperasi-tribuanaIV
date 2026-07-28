const db = require('../config/db');


  const findAll = async () => {
    const [rows] = await db.execute(`
      SELECT p.*, s.nama_supplier, u.nama_pengguna as admin_pembelian
      FROM Pembelian p
      JOIN Supplier s ON p.id_supplier = s.id_supplier
      JOIN Pengguna u ON p.id_pengguna = u.id_pengguna
      ORDER BY p.waktu_pembelian DESC
    `);
    return rows;
  }

  const findById = async (id) => {
    const [pembelian] = await db.execute(`
      SELECT p.*, s.nama_supplier, u.nama_pengguna as admin_pembelian
      FROM Pembelian p
      JOIN Supplier s ON p.id_supplier = s.id_supplier
      JOIN Pengguna u ON p.id_pengguna = u.id_pengguna
      WHERE p.id_pembelian = ?
    `, [id]);

    if (pembelian.length === 0) return null;

    const [details] = await db.execute(`
      SELECT dp.*, b.barcode, b.satuan_swalayan, b.satuan_grosir 
      FROM Detail_Pembelian dp
      LEFT JOIN Barang b ON dp.id_barang = b.id_barang
      WHERE dp.id_pembelian = ?
    `, [id]);

    return {
      ...pembelian[0],
      items: details
    };
  }

  const createPembelian = async (data) => {
    const { kategori, id_supplier, id_pengguna, items } = data;
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      let total_biaya = 0;

      // Create initial purchase record
      const [pembelianResult] = await connection.execute(
        'INSERT INTO Pembelian (kategori, status, id_supplier, id_pengguna, total_biaya) VALUES (?, ?, ?, ?, ?)',
        [kategori, 'Menunggu', id_supplier, id_pengguna, total_biaya]
      );
      const id_pembelian = pembelianResult.insertId;

      for (const item of items) {
        let { id_barang, jumlah, harga_satuan, barang_baru } = item;
        let snapshot_nama_barang = "";

        // Jika ini adalah input barang baru secara bersamaan (tidak memilih dari list)
        if (!id_barang && barang_baru) {
          const { 
            nama_barang, golongan, barcode, 
            harga_beli, harga_swalayan, harga_grosir, 
            stok_minimal, satuan_swalayan, satuan_grosir 
          } = barang_baru;

          // Insert ke master Barang dengan stok 0 terlebih dahulu
          const [insertBarang] = await connection.execute(
            `INSERT INTO Barang (
              nama_barang, golongan, barcode, 
              harga_beli, harga_swalayan, harga_grosir, 
              stok_swalayan, stok_grosir, stok_minimal, 
              satuan_swalayan, satuan_grosir
            ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)`,
            [
              nama_barang, golongan || null, barcode || null,
              harga_beli || harga_satuan || 0, harga_swalayan || 0, harga_grosir || 0,
              stok_minimal || 10, satuan_swalayan || null, satuan_grosir || null
            ]
          );
          id_barang = insertBarang.insertId;
          snapshot_nama_barang = nama_barang;
        } else {
          // Barang sudah ada
          const [barangRows] = await connection.execute('SELECT nama_barang FROM Barang WHERE id_barang = ?', [id_barang]);
          if (barangRows.length > 0) {
            snapshot_nama_barang = barangRows[0].nama_barang;
          } else {
             throw new Error(`Barang dengan ID ${id_barang} tidak ditemukan`);
          }
        }

        const subtotal = jumlah * harga_satuan;
        total_biaya += subtotal;

        await connection.execute(
          'INSERT INTO Detail_Pembelian (id_pembelian, id_barang, snapshot_nama_barang, jumlah, harga_satuan, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
          [id_pembelian, id_barang, snapshot_nama_barang, jumlah, harga_satuan, subtotal]
        );
      }

      await connection.execute(
        'UPDATE Pembelian SET total_biaya = ? WHERE id_pembelian = ?',
        [total_biaya, id_pembelian]
      );

      await connection.commit();

      return {
        id_pembelian,
        total_biaya
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  const updateStatus = async (id_pembelian, new_status) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [pembelianRows] = await connection.execute('SELECT * FROM Pembelian WHERE id_pembelian = ? FOR UPDATE', [id_pembelian]);
      if (pembelianRows.length === 0) {
        throw new Error("Pembelian tidak ditemukan");
      }

      const pembelian = pembelianRows[0];

      // Jika mencoba mengubah ke status yang sama, abaikan saja
      if (pembelian.status === new_status) {
         await connection.rollback();
         return { message: "Status tidak ada perubahan" };
      }

      // Logika untuk mutasi barang ke stok gudang toko
      if (new_status === 'Dimutasi' && pembelian.status !== 'Dimutasi') {
        const [details] = await connection.execute('SELECT * FROM Detail_Pembelian WHERE id_pembelian = ?', [id_pembelian]);

        for (const item of details) {
          if (item.id_barang) {
            if (pembelian.kategori === 'Swalayan') {
              await connection.execute(
                'UPDATE Barang SET stok_swalayan = stok_swalayan + ? WHERE id_barang = ?',
                [item.jumlah, item.id_barang]
              );
            } else if (pembelian.kategori === 'Grosir') {
              await connection.execute(
                'UPDATE Barang SET stok_grosir = stok_grosir + ? WHERE id_barang = ?',
                [item.jumlah, item.id_barang]
              );
            }
          }
        }
      }

      // Rollback stok jika mutasi dibatalkan (opsional, untuk safety)
      if (pembelian.status === 'Dimutasi' && new_status !== 'Dimutasi') {
         const [details] = await connection.execute('SELECT * FROM Detail_Pembelian WHERE id_pembelian = ?', [id_pembelian]);
         for (const item of details) {
          if (item.id_barang) {
            if (pembelian.kategori === 'Swalayan') {
              await connection.execute(
                'UPDATE Barang SET stok_swalayan = stok_swalayan - ? WHERE id_barang = ?',
                [item.jumlah, item.id_barang]
              );
            } else if (pembelian.kategori === 'Grosir') {
              await connection.execute(
                'UPDATE Barang SET stok_grosir = stok_grosir - ? WHERE id_barang = ?',
                [item.jumlah, item.id_barang]
              );
            }
          }
        }
      }

      await connection.execute('UPDATE Pembelian SET status = ? WHERE id_pembelian = ?', [new_status, id_pembelian]);
      
      await connection.commit();
      return { message: "Status berhasil diupdate" };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

module.exports = {
  findAll,
  findById,
  createPembelian,
  updateStatus
};
