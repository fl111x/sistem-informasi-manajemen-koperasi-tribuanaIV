const db = require('../config/db');

exports.getAllPembelian = async (req, res) => {
  try {
    const [pembelian] = await db.execute(`
      SELECT p.*, u.nama_pengguna as admin_pembelian, s.nama_supplier
      FROM Pembelian p
      JOIN Pengguna u ON p.id_pengguna = u.id_pengguna
      LEFT JOIN Supplier s ON p.id_supplier = s.id_supplier
      ORDER BY p.waktu_pembelian DESC
    `);
    res.status(200).json(pembelian);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan internal server' });
  }
};

exports.getPembelianById = async (req, res) => {
  try {
    const { id } = req.params;
    const [pembelianRows] = await db.execute(`
      SELECT p.*, u.nama_pengguna as admin_pembelian, s.nama_supplier
      FROM Pembelian p
      JOIN Pengguna u ON p.id_pengguna = u.id_pengguna
      LEFT JOIN Supplier s ON p.id_supplier = s.id_supplier
      WHERE p.id_pembelian = ?
    `, [id]);
    
    if (pembelianRows.length === 0) {
      return res.status(404).json({ message: 'Data pembelian tidak ditemukan' });
    }

    const [details] = await db.execute(`
      SELECT dp.*, b.barcode, b.harga_swalayan, b.harga_grosir, b.satuan_swalayan, b.satuan_grosir 
      FROM Detail_Pembelian dp
      LEFT JOIN Barang b ON dp.id_barang = b.id_barang
      WHERE dp.id_pembelian = ?
    `, [id]);

    const result = {
      ...pembelianRows[0],
      items: details
    };

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan internal server' });
  }
};

exports.createPembelian = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { kategori, id_supplier, items, metode_pembayaran, jatuh_tempo } = req.body;
    const id_pengguna = req.user.id_pengguna;

    if (!kategori || !id_supplier || !items || items.length === 0) {
      return res.status(400).json({ message: 'Data tidak lengkap (kategori, id_supplier, items wajib diisi)' });
    }

    await connection.beginTransaction();

    let total_biaya = 0;
    const status_pembayaran = metode_pembayaran === 'Tempo' ? 'Belum Lunas' : 'Lunas';

    const [pembelianResult] = await connection.execute(
      'INSERT INTO Pembelian (kategori, status, id_supplier, id_pengguna, total_biaya, metode_pembayaran, jatuh_tempo, status_pembayaran) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [kategori, 'Belum di Order', id_supplier, id_pengguna, total_biaya, metode_pembayaran || 'Cash', jatuh_tempo || null, status_pembayaran]
    );
    const id_pembelian = pembelianResult.insertId;

    for (const item of items) {
      let { id_barang, jumlah, harga_satuan, barang_baru } = item;
      let snapshot_nama_barang = "";

      if (!id_barang && barang_baru) {
        const { 
          nama_barang, golongan, barcode, 
          harga_beli, harga_swalayan, harga_grosir, 
          stok_minimal, satuan_swalayan, satuan_grosir 
        } = barang_baru;

        const [insertBarang] = await connection.execute(
          `INSERT INTO Barang (
            nama_barang, golongan, barcode, 
            harga_beli, harga_swalayan, harga_grosir, 
            stok_swalayan, stok_grosir, stok_minimal, 
            satuan_swalayan, satuan_grosir, stok_gudang, is_konsinyasi
          ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, 0, 0)`,
          [
            nama_barang, golongan || null, barcode || null,
            harga_beli || harga_satuan || 0, harga_swalayan || 0, harga_grosir || 0,
            stok_minimal || 10, satuan_swalayan || null, satuan_grosir || null
          ]
        );
        id_barang = insertBarang.insertId;
        snapshot_nama_barang = nama_barang;
      } else {
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

    res.status(201).json({ 
       message: 'Pembelian berhasil dibuat', 
       id_pembelian: id_pembelian,
       total_biaya: total_biaya
    });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan saat membuat data pembelian: ' + error.message });
  } finally {
    connection.release();
  }
};

exports.updateStatus = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { status: new_status, catatan_gudang } = req.body;
    const id_pembelian = req.params.id;
    
    if (!['Belum di Order', 'Dipesan', 'Diterima', 'Dimutasi', 'Ditunda', 'Batal'].includes(new_status)) {
       return res.status(400).json({ message: 'Status tidak valid' });
    }

    await connection.beginTransaction();

    const [pembelianRows] = await connection.execute('SELECT * FROM Pembelian WHERE id_pembelian = ? FOR UPDATE', [id_pembelian]);
    if (pembelianRows.length === 0) {
      throw new Error("Pembelian tidak ditemukan");
    }

    const pembelian = pembelianRows[0];

    if (pembelian.status === new_status) {
       await connection.rollback();
       return res.status(200).json({ message: "Status tidak ada perubahan" });
    }

    // Mutasi logic (Gudang)
    if (new_status === 'Diterima' && pembelian.status !== 'Diterima') {
      const [details] = await connection.execute('SELECT * FROM Detail_Pembelian WHERE id_pembelian = ?', [id_pembelian]);

      for (const item of details) {
        if (item.id_barang) {
          await connection.execute(
            'UPDATE Barang SET stok_gudang = stok_gudang + ?, harga_beli = ? WHERE id_barang = ?',
            [item.jumlah, item.harga_satuan, item.id_barang]
          );
        }
      }

      // Catat Jurnal Pembelian
      await connection.execute(
        `INSERT INTO Jurnal_Akuntansi (keterangan, akun_debit, akun_kredit, nominal, id_transaksi_referensi, jenis_referensi) 
         VALUES (?, 'Persediaan Barang Dagang', ?, ?, ?, 'Pembelian')`,
        [
          `Pembelian ID ${id_pembelian}`, 
          pembelian.metode_pembayaran === 'Tempo' ? 'Hutang Dagang' : 'Kas', 
          pembelian.total_biaya, 
          id_pembelian
        ]
      );

      // Buat Hutang_Supplier jika metode_pembayaran = 'Tempo'
      if (pembelian.metode_pembayaran === 'Tempo') {
        await connection.execute(
          `INSERT INTO Hutang_Supplier (id_pembelian, id_supplier, total_hutang, sisa_hutang, tanggal_jatuh_tempo, status_lunas) 
           VALUES (?, ?, ?, ?, ?, 'Belum Lunas')`,
          [id_pembelian, pembelian.id_supplier, pembelian.total_biaya, pembelian.total_biaya, pembelian.jatuh_tempo]
        );
      }
    }

    // Logika mutasi otomatis (Admin Penjualan)
    if (new_status === 'Dimutasi' && pembelian.status !== 'Dimutasi') {
      const [details] = await connection.execute('SELECT * FROM Detail_Pembelian WHERE id_pembelian = ?', [id_pembelian]);
      const kolomTujuan = pembelian.kategori === 'Swalayan' ? 'stok_swalayan' : 'stok_grosir';

      for (const item of details) {
        if (item.id_barang) {
          await connection.execute(
            `UPDATE Barang SET stok_gudang = stok_gudang - ?, ${kolomTujuan} = ${kolomTujuan} + ? WHERE id_barang = ?`,
            [item.jumlah, item.jumlah, item.id_barang]
          );
        }
      }
    }

    // Rollback stok opsional
    if (pembelian.status === 'Diterima' && new_status !== 'Diterima') {
       const [details] = await connection.execute('SELECT * FROM Detail_Pembelian WHERE id_pembelian = ?', [id_pembelian]);
       for (const item of details) {
        if (item.id_barang) {
          await connection.execute(
            'UPDATE Barang SET stok_gudang = stok_gudang - ? WHERE id_barang = ?',
            [item.jumlah, item.id_barang]
          );
        }
      }
      
      // Hapus Jurnal Pembelian jika dibatalkan/direvert
      await connection.execute(
        `DELETE FROM Jurnal_Akuntansi WHERE id_transaksi_referensi = ? AND jenis_referensi = 'Pembelian'`,
        [id_pembelian]
      );
      
      if (pembelian.metode_pembayaran === 'Tempo') {
        await connection.execute(`DELETE FROM Hutang_Supplier WHERE id_pembelian = ?`, [id_pembelian]);
      }
    }

    if (catatan_gudang !== undefined) {
      await connection.execute('UPDATE Pembelian SET catatan_gudang = ? WHERE id_pembelian = ?', [catatan_gudang, id_pembelian]);
    }

    await connection.execute('UPDATE Pembelian SET status = ? WHERE id_pembelian = ?', [new_status, id_pembelian]);
    
    await connection.commit();
    res.status(200).json({ message: "Status berhasil diupdate" });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    if (error.message === "Pembelian tidak ditemukan") {
        return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Terjadi kesalahan saat mengupdate status' });
  } finally {
    connection.release();
  }
};

exports.editPO = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const { items } = req.body;
    
    await connection.beginTransaction();

    let total_biaya = 0;
    
    for (const item of items) {
      const subtotal = item.jumlah * item.harga_satuan;
      total_biaya += subtotal;

      await connection.execute(
        'UPDATE Detail_Pembelian SET jumlah = ?, harga_satuan = ?, subtotal = ? WHERE id_detail = ? AND id_pembelian = ?',
        [item.jumlah, item.harga_satuan, subtotal, item.id_detail, id]
      );
    }

    await connection.execute('UPDATE Pembelian SET total_biaya = ? WHERE id_pembelian = ?', [total_biaya, id]);

    // Update Hutang_Supplier jika ada
    await connection.execute(
      'UPDATE Hutang_Supplier SET total_hutang = ?, sisa_hutang = ? WHERE id_pembelian = ?',
      [total_biaya, total_biaya, id]
    );

    // Update Jurnal Akuntansi nominal
    await connection.execute(
      "UPDATE Jurnal_Akuntansi SET nominal = ? WHERE id_transaksi_referensi = ? AND jenis_referensi = 'Pembelian'",
      [total_biaya, id]
    );

    await connection.commit();
    res.status(200).json({ message: 'PO berhasil diperbarui' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengedit PO' });
  } finally {
    connection.release();
  }
};

exports.mutasiPO = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const { mutasi_items, keterangan_mutasi } = req.body;

    if (!mutasi_items || mutasi_items.length === 0) {
      return res.status(400).json({ message: 'Data mutasi tidak boleh kosong' });
    }

    await connection.beginTransaction();

    const [pembelianRows] = await connection.execute('SELECT * FROM Pembelian WHERE id_pembelian = ? FOR UPDATE', [id]);
    if (pembelianRows.length === 0) throw new Error("Pembelian tidak ditemukan");
    
    const pembelian = pembelianRows[0];
    const kolomTujuan = pembelian.kategori === 'Swalayan' ? 'stok_swalayan' : 'stok_grosir';

    let allMutated = true;

    for (const mItem of mutasi_items) {
      if (mItem.jumlah_mutasi > 0 || mItem.harga_beli !== undefined) {
        // Cek stok_gudang apakah cukup jika ada mutasi
        if (mItem.jumlah_mutasi > 0) {
          const [barang] = await connection.execute('SELECT stok_gudang FROM Barang WHERE id_barang = ?', [mItem.id_barang]);
          if (barang[0].stok_gudang < mItem.jumlah_mutasi) {
             throw new Error(`Stok gudang tidak mencukupi untuk barang ID ${mItem.id_barang}`);
          }
        }

        // Update data master (Harga & Satuan) jika dikirim dari frontend
        if (mItem.harga_beli !== undefined) {
          await connection.execute(
            `UPDATE Barang SET 
              harga_beli = ?, harga_swalayan = ?, harga_grosir = ?, 
              satuan_swalayan = ?, satuan_grosir = ? 
             WHERE id_barang = ?`,
            [
              mItem.harga_beli, mItem.harga_swalayan, mItem.harga_grosir,
              mItem.satuan_swalayan || null, mItem.satuan_grosir || null,
              mItem.id_barang
            ]
          );
        }
        
        if (mItem.jumlah_mutasi > 0) {
          await connection.execute(
            `UPDATE Barang SET stok_gudang = stok_gudang - ?, ${kolomTujuan} = ${kolomTujuan} + ? WHERE id_barang = ?`,
            [mItem.jumlah_mutasi, mItem.jumlah_mutasi, mItem.id_barang]
          );

          await connection.execute(
            'UPDATE Detail_Pembelian SET jumlah_dimutasi = jumlah_dimutasi + ? WHERE id_detail = ?',
            [mItem.jumlah_mutasi, mItem.id_detail]
          );
        }
      }

      // Check if this item is fully mutated now
      const [det] = await connection.execute('SELECT jumlah, jumlah_dimutasi FROM Detail_Pembelian WHERE id_detail = ?', [mItem.id_detail]);
      if (det[0].jumlah > det[0].jumlah_dimutasi) {
        allMutated = false;
      }
    }

    // Gabungkan keterangan_mutasi jika sudah ada sebelumnya
    let newKet = keterangan_mutasi || null;
    if (pembelian.keterangan_mutasi) {
      if (keterangan_mutasi) {
        newKet = pembelian.keterangan_mutasi + "\\n" + keterangan_mutasi;
      } else {
        newKet = pembelian.keterangan_mutasi;
      }
    }

    let nextStatus = pembelian.status;
    if (allMutated) {
      nextStatus = 'Dimutasi';
    }

    await connection.execute(
      'UPDATE Pembelian SET status = ?, keterangan_mutasi = ? WHERE id_pembelian = ?',
      [nextStatus, newKet, id]
    );

    await connection.commit();
    res.status(200).json({ message: 'Mutasi parsial berhasil', status_baru: nextStatus });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    if (error.message.includes("Stok gudang tidak mencukupi")) {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Terjadi kesalahan saat memutasi PO' });
  } finally {
    connection.release();
  }
};
