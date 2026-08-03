const db = require('./config/db');

async function seedData() {
  console.log('Mulai membuat data dummy...');
  
  try {
    console.log('Menghapus data lama...');
    await db.execute('SET FOREIGN_KEY_CHECKS = 0');
    await db.execute('TRUNCATE TABLE detail_transaksi');
    await db.execute('TRUNCATE TABLE Transaksi');
    await db.execute('TRUNCATE TABLE Detail_Pembelian');
    await db.execute('TRUNCATE TABLE Pembelian');
    await db.execute('TRUNCATE TABLE Barang');
    await db.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Data lama berhasil dihapus.');

    // 1. DUMMY BARANG
    const realisticItems = [
      { nama: 'Indomie Goreng Special', golongan: 'Sembako', beli: 2500, jualS: 3000, jualG: 2800 },
      { nama: 'Beras Maknyus 5kg', golongan: 'Sembako', beli: 60000, jualS: 65000, jualG: 63000 },
      { nama: 'Minyak Goreng Bimoli 2L', golongan: 'Sembako', beli: 30000, jualS: 34000, jualG: 32000 },
      { nama: 'Gula Pasir Gulaku 1kg', golongan: 'Sembako', beli: 14000, jualS: 16000, jualG: 15000 },
      { nama: 'Susu Bear Brand 189ml', golongan: 'Minuman', beli: 9000, jualS: 10500, jualG: 10000 },
      { nama: 'Sabun Mandi Lifebuoy 110g', golongan: 'Perawatan Diri', beli: 3500, jualS: 4500, jualG: 4000 },
      { nama: 'Shampoo Pantene 170ml', golongan: 'Perawatan Diri', beli: 18000, jualS: 22000, jualG: 20000 },
      { nama: 'Teh Pucuk Harum 350ml', golongan: 'Minuman', beli: 3000, jualS: 4000, jualG: 3500 },
      { nama: 'Kopi Kapal Api Mix 25g', golongan: 'Minuman', beli: 1200, jualS: 1500, jualG: 1300 },
      { nama: 'Telur Ayam Kampung 1kg', golongan: 'Sembako', beli: 25000, jualS: 28000, jualG: 26500 },
      { nama: 'Rinso Anti Noda 770g', golongan: 'Kebutuhan Rumah', beli: 20000, jualS: 24000, jualG: 22000 },
      { nama: 'Pepsodent White 190g', golongan: 'Perawatan Diri', beli: 9500, jualS: 12000, jualG: 11000 },
      { nama: 'Mie Sedap Kuah Soto', golongan: 'Sembako', beli: 2400, jualS: 3000, jualG: 2700 },
      { nama: 'Aqua Botol 600ml', golongan: 'Minuman', beli: 2500, jualS: 3500, jualG: 3000 },
      { nama: 'Taro Snack Net 65g', golongan: 'Makanan Ringan', beli: 4500, jualS: 6000, jualG: 5500 }
    ];
    
    // Create realistic barang
    for (const item of realisticItems) {
      const barcode = `899${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
      const stok_swalayan = Math.floor(Math.random() * 50) + 10;
      const stok_grosir = Math.floor(Math.random() * 30) + 5;
      const stok_minimal = 10;
      
      const query = `
        INSERT INTO Barang (
          nama_barang, golongan, barcode,
          harga_beli, harga_swalayan, harga_grosir,
          stok_swalayan, stok_grosir, stok_minimal,
          satuan_swalayan, satuan_grosir
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await db.execute(query, [
        item.nama, item.golongan, barcode,
        item.beli, item.jualS, item.jualG,
        stok_swalayan, stok_grosir, stok_minimal,
        'Pcs', 'Dus'
      ]);
    }
    console.log(`✅ Berhasil membuat ${realisticItems.length} Barang realistis`);

    // GET ALL BARANG to use in transactions
    const [barangRows] = await db.execute('SELECT * FROM Barang');
    
    // GET ALL PENGGUNA to assign cashiers
    const [penggunaRows] = await db.execute('SELECT id_pengguna FROM Pengguna');
    const penggunaIds = penggunaRows.map(p => p.id_pengguna);
    if (penggunaIds.length === 0) {
        // Fallback user id if empty
        penggunaIds.push(1);
    }
    
    // 2. DUMMY TRANSAKSI
    // Create 20 transactions spread over the last 7 days
    for (let i = 1; i <= 20; i++) {
      const jenis_transaksi = Math.random() > 0.5 ? 'Swalayan' : 'Grosir';
      const kasirId = penggunaIds[Math.floor(Math.random() * penggunaIds.length)];
      
      // Random date within the last 7 days
      const daysAgo = Math.floor(Math.random() * 7);
      const dateObj = new Date();
      dateObj.setDate(dateObj.getDate() - daysAgo);
      dateObj.setHours(Math.floor(Math.random() * 14) + 8); // 8 AM to 10 PM
      dateObj.setMinutes(Math.floor(Math.random() * 60));
      
      const mysqlDate = dateObj.toISOString().slice(0, 19).replace('T', ' ');

      // Pick 1 to 5 random items for this transaction (no duplicates)
      const numItems = Math.floor(Math.random() * 5) + 1;
      let total_bayar = 0;
      const selectedItems = [];
      
      const shuffledBarang = [...barangRows].sort(() => 0.5 - Math.random());
      const selectedBarangForTrx = shuffledBarang.slice(0, numItems);
      
      for (const randomItem of selectedBarangForTrx) {
        const quantity = Math.floor(Math.random() * 3) + 1;
        
        let subtotal = 0;
        let harga_satuan = 0;
        
        if (jenis_transaksi === 'Swalayan') {
          harga_satuan = randomItem.harga_swalayan;
        } else {
          harga_satuan = randomItem.harga_grosir;
        }
        subtotal = harga_satuan * quantity;
        total_bayar += subtotal;
        
        selectedItems.push({
          id_barang: randomItem.id_barang,
          quantity,
          harga_satuan,
          subtotal
        });
      }
      
      const insertTrxQuery = `
        INSERT INTO Transaksi (waktu_transaksi, total_bayar, jenis_transaksi, id_pengguna)
        VALUES (?, ?, ?, ?)
      `;
      const [trxResult] = await db.execute(insertTrxQuery, [mysqlDate, total_bayar, jenis_transaksi, kasirId]);
      const id_transaksi = trxResult.insertId;
      
      // 3. DUMMY DETAIL TRANSAKSI
      for (const item of selectedItems) {
        const insertDetailQuery = `
          INSERT INTO detail_transaksi (id_transaksi, id_barang, quantity_barang, diskon, subtotal)
          VALUES (?, ?, ?, ?, ?)
        `;
        await db.execute(insertDetailQuery, [id_transaksi, item.id_barang, item.quantity, 0, item.subtotal]);
      }
    }
    console.log('✅ Berhasil membuat 20 Transaksi dummy beserta detailnya');

    console.log('Selesai!');
    process.exit(0);
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    process.exit(1);
  }
}

seedData();
