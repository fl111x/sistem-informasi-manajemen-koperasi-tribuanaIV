const db = require('../config/db');

const getAllAnggota = async (req, res) => {
  try {
    const [anggota] = await db.execute('SELECT * FROM Anggota WHERE is_active = 1 ORDER BY nama ASC');
    res.json({ data: anggota });
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
    const { nrp, nama, pangkat } = req.body;
    
    if (!nrp || !nama || !pangkat) {
      return res.status(400).json({ message: 'NRP, nama, dan pangkat wajib diisi' });
    }
    
    const [existingRows] = await db.execute('SELECT * FROM Anggota WHERE nrp = ?', [nrp]);
    if (existingRows.length > 0) {
      return res.status(400).json({ message: 'NRP sudah terdaftar' });
    }
    
    await db.execute(
      'INSERT INTO Anggota (nrp, nama, pangkat) VALUES (?, ?, ?)',
      [nrp, nama, pangkat]
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
    const { nama, pangkat, is_active } = req.body;
    
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

module.exports = {
  getAllAnggota,
  getAnggotaByNrp,
  createAnggota,
  updateAnggota,
  deleteAnggota,
  getRiwayatTransaksiAnggota
};
