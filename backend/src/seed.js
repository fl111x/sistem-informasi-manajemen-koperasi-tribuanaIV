const db = require('./config/db');

async function seedData() {
  console.log('Mulai membuat data dummy...');
  
  try {
    // 1. DUMMY BARANG
    const golonganList = ['Sembako', 'Minuman', 'Makanan Ringan', 'Perawatan Diri', 'Kebutuhan Rumah', 'ATK'];
    
    // Create 30 barang
    for (let i = 1; i <= 30; i++) {
      const barcode = `899${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
      const golongan = golonganList[Math.floor(Math.random() * golonganList.length)];
      
      const harga_beli = (Math.floor(Math.random() * 50) + 1) * 500; 
      const harga_swalayan = harga_beli + Math.floor(harga_beli * 0.2); // 20% margin
      const harga_grosir = harga_beli + Math.floor(harga_beli * 0.1); // 10% margin
      
      const stok_swalayan = Math.floor(Math.random() * 100) + 5; // 5 to 104
      const stok_grosir = Math.floor(Math.random() * 50) + 2; // 2 to 51
      
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
        `Barang Dummy ${i}`, golongan, barcode,
        harga_beli, harga_swalayan, harga_grosir,
        stok_swalayan, stok_grosir, stok_minimal,
        'Pcs', 'Dus'
      ]);
    }
    console.log('✅ Berhasil membuat 30 Barang dummy');

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
    // Create 50 transactions spread over the last 7 days
    for (let i = 1; i <= 50; i++) {
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
    console.log('✅ Berhasil membuat 50 Transaksi dummy beserta detailnya');

    console.log('Selesai!');
    process.exit(0);
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    process.exit(1);
  }
}

seedData();
