const db = require('../config/db');

const getAllAnggota = async (req, res) => {
  try {
    const { page, limit, search, jenis_anggota } = req.query;

    if (!page && !limit && !search && !jenis_anggota) {
      const [anggota] = await db.execute('SELECT * FROM Anggota WHERE is_active = 1 ORDER BY nama ASC');
      return res.json({ data: anggota });
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 30;
    const offset = (pageNum - 1) * limitNum;

    let query = 'SELECT * FROM Anggota WHERE is_active = 1';
    let countQuery = 'SELECT COUNT(*) as total FROM Anggota WHERE is_active = 1';
    const queryParams = [];

    if (search) {
      query += ' AND (nama LIKE ? OR nrp LIKE ?)';
      countQuery += ' AND (nama LIKE ? OR nrp LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (jenis_anggota && jenis_anggota !== 'Semua') {
      query += ' AND jenis_anggota = ?';
      countQuery += ' AND jenis_anggota = ?';
      queryParams.push(jenis_anggota);
    }

    query += ' ORDER BY nama ASC LIMIT ? OFFSET ?';
    
    const [countRows] = await db.execute(countQuery, queryParams);
    const totalItems = countRows[0].total;
    const totalPages = Math.ceil(totalItems / limitNum);

    const [anggota] = await db.execute(query, [...queryParams, limitNum.toString(), offset.toString()]);
    
    res.json({
      data: anggota,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching anggota:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const getAnggotaByNrp = async (req, res) => {
  try {
    const { nrp } = req.params;
    const [rows] = await db.execute('SELECT * FROM Anggota WHERE nrp = ?', [nrp]);
    const anggota = rows[0];
    
    if (!anggota) {
      return res.status(404).json({ message: 'Anggota tidak ditemukan' });
    }
    
    res.json({ data: anggota });
  } catch (error) {
    console.error('Error fetching anggota by NRP:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const createAnggota = async (req, res) => {
  try {
    const { nrp, nama, pangkat, jenis_anggota } = req.body;
    
    if (!nrp || !nama || !pangkat) {
      return res.status(400).json({ message: 'NRP, nama, dan pangkat wajib diisi' });
    }
    
    const [existingRows] = await db.execute('SELECT * FROM Anggota WHERE nrp = ?', [nrp]);
    if (existingRows.length > 0) {
      return res.status(400).json({ message: 'NRP sudah terdaftar' });
    }
    
    const finalJenisAnggota = jenis_anggota || 'Militer';
    
    await db.execute(
      'INSERT INTO Anggota (nrp, nama, pangkat, jenis_anggota) VALUES (?, ?, ?, ?)',
      [nrp, nama, pangkat, finalJenisAnggota]
    );
    res.status(201).json({ message: 'Anggota berhasil ditambahkan' });
  } catch (error) {
    console.error('Error creating anggota:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const updateAnggota = async (req, res) => {
  try {
    const { nrp } = req.params;
    const { nama, pangkat, is_active, jenis_anggota, simpanan, saldo_voucher } = req.body;
    
    const [existingRows] = await db.execute('SELECT * FROM Anggota WHERE nrp = ?', [nrp]);
    if (existingRows.length === 0) {
      return res.status(404).json({ message: 'Anggota tidak ditemukan' });
    }
    
    let updateFields = [];
    let params = [];
    
    if (nama !== undefined) {
      updateFields.push('nama = ?');
      params.push(nama);
    }
    if (pangkat !== undefined) {
      updateFields.push('pangkat = ?');
      params.push(pangkat);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      params.push(is_active);
    }
    if (jenis_anggota !== undefined) {
      updateFields.push('jenis_anggota = ?');
      params.push(jenis_anggota);
    }
    if (simpanan !== undefined) {
      updateFields.push('simpanan = ?');
      params.push(simpanan);
    }
    if (saldo_voucher !== undefined) {
      updateFields.push('saldo_voucher = ?');
      params.push(saldo_voucher);
    }
    
    if (updateFields.length === 0) {
      return res.json({ message: 'Tidak ada data yang diubah' });
    }
    
    params.push(nrp);
    const [result] = await db.execute(
      `UPDATE Anggota SET ${updateFields.join(', ')} WHERE nrp = ?`,
      params
    );

    if (result.affectedRows > 0) {
      res.json({ message: 'Data anggota berhasil diupdate' });
    } else {
      res.json({ message: 'Tidak ada data yang diubah' });
    }
  } catch (error) {
    console.error('Error updating anggota:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const deleteAnggota = async (req, res) => {
  try {
    const { nrp } = req.params;
    
    const [existingRows] = await db.execute('SELECT * FROM Anggota WHERE nrp = ?', [nrp]);
    if (existingRows.length === 0) {
      return res.status(404).json({ message: 'Anggota tidak ditemukan' });
    }
    
    await db.execute('UPDATE Anggota SET is_active = 0 WHERE nrp = ?', [nrp]);
    res.json({ message: 'Anggota berhasil dihapus (soft delete)' });
  } catch (error) {
    console.error('Error deleting anggota:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const getRiwayatTransaksiAnggota = async (req, res) => {
  try {
    const { nrp } = req.params;

    const [anggotaRows] = await db.execute('SELECT * FROM Anggota WHERE nrp = ?', [nrp]);
    if (anggotaRows.length === 0) {
      return res.status(404).json({ message: 'Anggota tidak ditemukan' });
    }

    const [transaksi] = await db.execute(`
      SELECT id_transaksi, waktu_transaksi, total_bayar, jenis_transaksi 
      FROM Transaksi 
      WHERE nrp = ? 
      ORDER BY waktu_transaksi DESC
    `, [nrp]);

    const [akumulasi] = await db.execute(`
      SELECT SUM(total_bayar) as total_pembelanjaan
      FROM Transaksi 
      WHERE nrp = ?
    `, [nrp]);

    res.json({
      anggota: anggotaRows[0],
      total_pembelanjaan: akumulasi[0].total_pembelanjaan || 0,
      riwayat_transaksi: transaksi
    });
  } catch (error) {
    console.error('Error fetching riwayat transaksi anggota:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const getRekapVoucherAll = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        a.nrp,
        a.nama,
        a.pangkat,
        a.jenis_anggota,
        CAST(a.saldo_voucher AS DECIMAL(15,2)) as saldo_voucher,
        COALESCE(SUM(t.dibayar_voucher), 0) as total_voucher_terpakai,
        COALESCE(SUM(t.total_bayar), 0) as total_pembelanjaan
      FROM Anggota a
      LEFT JOIN Transaksi t ON a.nrp = t.nrp
      WHERE a.is_active = 1
      GROUP BY a.nrp, a.nama, a.pangkat, a.jenis_anggota, a.saldo_voucher
      ORDER BY a.nama ASC
    `);

    const result = rows.map((item, index) => {
      const sisaSaldo = parseFloat(item.saldo_voucher || 0);
      const terpakai = parseFloat(item.total_voucher_terpakai || 0);
      const totalJatah = sisaSaldo + terpakai;
      const blnTerdaftar = Math.max(1, Math.round(totalJatah / 100000));

      return {
        no: index + 1,
        nrp: item.nrp,
        nama: item.nama,
        pangkat: item.pangkat,
        jenis_anggota: item.jenis_anggota,
        bln_terdaftar: blnTerdaftar,
        total_jatah: totalJatah,
        terpakai: terpakai,
        sisa_saldo: sisaSaldo
      };
    });

    res.json({ data: result });
  } catch (error) {
    console.error('Error fetching rekap voucher all:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const getDetailCetakAnggota = async (req, res) => {
  try {
    const { nrp } = req.params;

    const [anggotaRows] = await db.execute('SELECT * FROM Anggota WHERE nrp = ? AND is_active = 1', [nrp]);
    if (anggotaRows.length === 0) {
      return res.status(404).json({ message: 'Anggota tidak ditemukan' });
    }

    const anggota = anggotaRows[0];

    const [transaksiRows] = await db.execute(`
      SELECT id_transaksi, waktu_transaksi, total_bayar, dibayar_voucher, jenis_transaksi, metode_pembayaran
      FROM Transaksi 
      WHERE nrp = ? 
      ORDER BY waktu_transaksi DESC
    `, [nrp]);

    const [summaryRows] = await db.execute(`
      SELECT COALESCE(SUM(dibayar_voucher), 0) as total_terpakai, COALESCE(SUM(total_bayar), 0) as total_pembelanjaan
      FROM Transaksi
      WHERE nrp = ?
    `, [nrp]);

    const sisaSaldo = parseFloat(anggota.saldo_voucher || 0);
    const totalTerpakai = parseFloat(summaryRows[0].total_terpakai || 0);
    const totalJatah = sisaSaldo + totalTerpakai;
    const blnTerdaftar = Math.max(1, Math.round(totalJatah / 100000));

    res.json({
      anggota: {
        ...anggota,
        saldo_voucher: sisaSaldo
      },
      summary: {
        bln_terdaftar: blnTerdaftar,
        total_jatah: totalJatah,
        total_terpakai: totalTerpakai,
        sisa_saldo: sisaSaldo,
        total_pembelanjaan: parseFloat(summaryRows[0].total_pembelanjaan || 0)
      },
      riwayat_transaksi: transaksiRows
    });
  } catch (error) {
const importAnggotaBatch = async (req, res) => {
  let connection;
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Data anggota untuk diimpor tidak boleh kosong' });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [existingRows] = await connection.execute('SELECT nrp FROM Anggota');
    const existingNrpSet = new Set(existingRows.map(r => String(r.nrp)));

    let insertedCount = 0;
    let updatedCount = 0;

    for (const m of items) {
      const nrp = String(m.nrp || '').trim();
      const nama = String(m.nama || '').trim();
      const pangkat = String(m.pangkat || '-').trim();
      const jenis_anggota = String(m.jenis_anggota || 'Militer').trim();

      if (!nrp || !nama) continue;

      if (existingNrpSet.has(nrp)) {
        await connection.execute(
          'UPDATE Anggota SET nama = ?, pangkat = ?, jenis_anggota = ?, is_active = 1 WHERE nrp = ?',
          [nama, pangkat, jenis_anggota, nrp]
        );
        updatedCount++;
      } else {
        await connection.execute(
          'INSERT INTO Anggota (nrp, nama, pangkat, jenis_anggota, saldo_voucher, is_active) VALUES (?, ?, ?, ?, ?, 1)',
          [nrp, nama, pangkat, jenis_anggota, 100000]
        );
        existingNrpSet.add(nrp);
        insertedCount++;
      }
    }

    await connection.commit();
    res.json({
      message: 'Impor otomatis data nominatif anggota berhasil.',
      summary: {
        totalProcessed: items.length,
        inserted: insertedCount,
        updated: updatedCount
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error batch importing anggota:', error);
    res.status(500).json({ message: 'Gagal mengimpor data anggota ke database' });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  getAllAnggota,
  getAnggotaByNrp,
  createAnggota,
  updateAnggota,
  deleteAnggota,
  getRiwayatTransaksiAnggota,
  getRekapVoucherAll,
  getDetailCetakAnggota,
  importAnggotaBatch
};
