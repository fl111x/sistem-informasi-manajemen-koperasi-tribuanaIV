const pool = require('../config/db');

// Helper untuk inisialisasi tabel voucher jika belum ada
const initVoucherTables = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS pengaturan_voucher (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tanggal_distribusi INT DEFAULT 1,
      nominal_voucher DECIMAL(15,2) DEFAULT 100000,
      is_otomatis ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
      terakhir_distribusi DATE NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const [settings] = await connection.query('SELECT * FROM pengaturan_voucher LIMIT 1');
  if (settings.length === 0) {
    await connection.query("INSERT INTO pengaturan_voucher (tanggal_distribusi, nominal_voucher, is_otomatis) VALUES (1, 100000, 'aktif')");
  }

  await connection.query(`
    CREATE TABLE IF NOT EXISTS log_distribusi_voucher (
      id_log INT AUTO_INCREMENT PRIMARY KEY,
      tanggal_distribusi DATETIME DEFAULT CURRENT_TIMESTAMP,
      bulan_tahun VARCHAR(50),
      jumlah_penerima INT DEFAULT 0,
      total_nominal DECIMAL(15,2) DEFAULT 0,
      metode ENUM('Otomatis', 'Manual') DEFAULT 'Manual',
      eksekutor VARCHAR(100) DEFAULT 'Sistem'
    )
  `);
};

// GET /api/voucher/pengaturan
exports.getPengaturanVoucher = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await initVoucherTables(connection);

    const [settings] = await connection.query('SELECT * FROM pengaturan_voucher LIMIT 1');
    const [stats] = await connection.query(`
      SELECT 
        COUNT(*) as total_anggota,
        COALESCE(SUM(saldo_voucher), 0) as total_saldo_voucher
      FROM anggota 
      WHERE is_active = 1
    `);

    res.json({
      pengaturan: settings[0] || { tanggal_distribusi: 1, nominal_voucher: 100000, is_otomatis: 'aktif' },
      statistik: {
        total_anggota: stats[0].total_anggota || 0,
        total_saldo_voucher: parseFloat(stats[0].total_saldo_voucher || 0)
      }
    });
  } catch (error) {
    console.error('Error in getPengaturanVoucher:', error);
    res.status(500).json({ message: 'Gagal mengambil pengaturan voucher' });
  } finally {
    connection.release();
  }
};

// PUT /api/voucher/pengaturan
exports.updatePengaturanVoucher = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await initVoucherTables(connection);

    let { tanggal_distribusi, nominal_voucher, is_otomatis } = req.body;
    tanggal_distribusi = parseInt(tanggal_distribusi) || 1;
    if (tanggal_distribusi < 1) tanggal_distribusi = 1;
    if (tanggal_distribusi > 28) tanggal_distribusi = 28;

    nominal_voucher = parseFloat(nominal_voucher) || 100000;
    is_otomatis = is_otomatis === 'nonaktif' ? 'nonaktif' : 'aktif';

    await connection.query(`
      UPDATE pengaturan_voucher 
      SET tanggal_distribusi = ?, nominal_voucher = ?, is_otomatis = ?
      WHERE id = 1
    `, [tanggal_distribusi, nominal_voucher, is_otomatis]);

    res.json({ message: 'Pengaturan distribusi voucher berhasil diperbarui' });
  } catch (error) {
    console.error('Error in updatePengaturanVoucher:', error);
    res.status(500).json({ message: 'Gagal mengedit pengaturan voucher' });
  } finally {
    connection.release();
  }
};

// GET /api/voucher/riwayat
exports.getRiwayatDistribusi = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await initVoucherTables(connection);
    const [rows] = await connection.query('SELECT * FROM log_distribusi_voucher ORDER BY tanggal_distribusi DESC LIMIT 50');
    res.json({ data: rows });
  } catch (error) {
    console.error('Error in getRiwayatDistribusi:', error);
    res.status(500).json({ message: 'Gagal mengambil riwayat distribusi voucher' });
  } finally {
    connection.release();
  }
};

// POST /api/voucher/distribusi
exports.distribusiVoucher = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await initVoucherTables(connection);
    await connection.beginTransaction();

    const [settings] = await connection.query('SELECT * FROM pengaturan_voucher LIMIT 1');
    const nominal = settings[0] ? parseFloat(settings[0].nominal_voucher) : 100000;

    // Hitung anggota aktif
    const [activeAnggota] = await connection.query('SELECT COUNT(*) as count FROM anggota WHERE is_active = 1');
    const totalPenerima = activeAnggota[0].count || 0;

    if (totalPenerima === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Tidak ada anggota aktif untuk dibagikan voucher.' });
    }

    // Tambah jatah voucher ke saldo_voucher seluruh anggota aktif
    await connection.query(`
      UPDATE anggota 
      SET saldo_voucher = saldo_voucher + ?
      WHERE is_active = 1
    `, [nominal]);

    const now = new Date();
    const namaBulan = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const formattedBulan = namaBulan.charAt(0).toUpperCase() + namaBulan.slice(1);
    const totalNominalDistribusi = totalPenerima * nominal;
    const eksekutorName = req.user?.nama_pengguna || req.user?.username || 'Admin';
    const metode = req.body?.metode || 'Manual';

    // Catat log
    await connection.query(`
      INSERT INTO log_distribusi_voucher (tanggal_distribusi, bulan_tahun, jumlah_penerima, total_nominal, metode, eksekutor)
      VALUES (NOW(), ?, ?, ?, ?, ?)
    `, [formattedBulan, totalPenerima, totalNominalDistribusi, metode, eksekutorName]);

    // Update terakhir_distribusi
    await connection.query(`
      UPDATE pengaturan_voucher SET terakhir_distribusi = CURDATE() WHERE id = 1
    `);

    await connection.commit();
    res.status(200).json({ 
      message: `Voucher bulanan (Rp ${new Intl.NumberFormat('id-ID').format(nominal)}) berhasil didistribusikan ke ${totalPenerima} anggota aktif.`,
      summary: {
        penerima: totalPenerima,
        nominalPerPenerima: nominal,
        totalDistributed: totalNominalDistribusi
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error in distribusiVoucher:', error);
    res.status(500).json({ message: 'Gagal mendistribusikan voucher' });
  } finally {
    connection.release();
  }
};

// Cron / Scheduled helper
exports.cekDistribusiOtomatisHarian = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    await initVoucherTables(connection);

    const [settings] = await connection.query('SELECT * FROM pengaturan_voucher LIMIT 1');
    if (!settings[0] || settings[0].is_otomatis !== 'aktif') return;

    const today = new Date();
    const currentDay = today.getDate();
    const targetDay = settings[0].tanggal_distribusi || 1;

    if (currentDay === targetDay) {
      const lastDist = settings[0].terakhir_distribusi ? new Date(settings[0].terakhir_distribusi) : null;
      const alreadyRunThisMonth = lastDist && lastDist.getMonth() === today.getMonth() && lastDist.getFullYear() === today.getFullYear();

      if (!alreadyRunThisMonth) {
        console.log(`[VOUCHER AUTO-CRON] Melakukan distribusi voucher otomatis tanggal ${currentDay}...`);
        
        await connection.beginTransaction();
        const nominal = parseFloat(settings[0].nominal_voucher || 100000);
        const [activeAnggota] = await connection.query('SELECT COUNT(*) as count FROM anggota WHERE is_active = 1');
        const totalPenerima = activeAnggota[0].count || 0;

        if (totalPenerima > 0) {
          await connection.query('UPDATE anggota SET saldo_voucher = saldo_voucher + ? WHERE is_active = 1', [nominal]);
          const namaBulan = today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
          const formattedBulan = namaBulan.charAt(0).toUpperCase() + namaBulan.slice(1);
          const totalNominalDistribusi = totalPenerima * nominal;

          await connection.query(`
            INSERT INTO log_distribusi_voucher (tanggal_distribusi, bulan_tahun, jumlah_penerima, total_nominal, metode, eksekutor)
            VALUES (NOW(), ?, ?, ?, 'Otomatis', 'Sistem Otomatis')
          `, [formattedBulan, totalPenerima, totalNominalDistribusi]);

          await connection.query('UPDATE pengaturan_voucher SET terakhir_distribusi = CURDATE() WHERE id = 1');
          await connection.commit();
          console.log(`[VOUCHER AUTO-CRON] Distribusi otomatis berhasil untuk ${totalPenerima} anggota.`);
        } else {
          await connection.rollback();
        }
      }
    }
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('[VOUCHER AUTO-CRON] Error checking auto distribution:', err);
  } finally {
    if (connection) connection.release();
  }
};
