const pool = require('./src/config/db');

async function fixAllRoles() {
  try {
    const rolesToInsert = [
      [4, 'Admin Pembelian', 'Pembuat PO Barang ke Supplier'],
      [5, 'Admin Order', 'Memverifikasi bahwa barang PO sudah dipesan'],
      [6, 'Admin Penjualan', 'Mutasi stok barang dari Gudang ke Toko'],
      [7, 'Admin Gudang', 'Konfirmasi penerimaan fisik barang di Gudang']
    ];
    
    for (const role of rolesToInsert) {
      await pool.execute('INSERT IGNORE INTO role (id_role, nama_role, deskripsi) VALUES (?, ?, ?)', role);
    }
    
    console.log("Missing roles have been restored.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

fixAllRoles();
