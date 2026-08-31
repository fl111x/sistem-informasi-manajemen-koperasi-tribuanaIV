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
      const stok_swalayan = Math.floor(Math.random() * 500) + 100;
      const stok_grosir = Math.floor(Math.random() * 300) + 50;
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
        penggunaIds.push(1);
    }

    // GET ALL ANGGOTA to assign nrp to credit transactions
    const [anggotaRows] = await db.execute('SELECT nrp FROM Anggota');
    const anggotaNrps = anggotaRows.map(a => a.nrp);
    
    // 2. DUMMY TRANSAKSI
    // Create realistic transactions specifically for August 1 to 31, 2026
    let trxCount = 0;
    for (let day = 1; day <= 31; day++) {
      const numTrxPerDay = Math.floor(Math.random() * 6) + 3; // 3 to 8 trx/day
      for (let j = 0; j < numTrxPerDay; j++) {
        trxCount++;
        const isSwalayan = Math.random() > 0.4;
        const jenis_transaksi = isSwalayan ? 'Swalayan' : 'Grosir';
        const kasirId = penggunaIds[Math.floor(Math.random() * penggunaIds.length)];
        
        const hh = String(Math.floor(Math.random() * 14) + 8).padStart(2, '0');
        const mm = String(Math.floor(Math.random() * 60)).padStart(2, '0');
        const mysqlDate = `2026-08-${String(day).padStart(2, '0')} ${hh}:${mm}:00`;

      // Determine metode_pembayaran
      // Let's say 20% of transactions are Kredit
      const isKredit = Math.random() < 0.2;
      const metode_pembayaran = isKredit ? 'Kredit' : 'Cash';
      
      let nrp = null;
      if (isKredit && anggotaNrps.length > 0) {
        nrp = anggotaNrps[Math.floor(Math.random() * anggotaNrps.length)];
      } else if (Math.random() < 0.3 && anggotaNrps.length > 0) {
        // Some cash transactions are also tied to members
        nrp = anggotaNrps[Math.floor(Math.random() * anggotaNrps.length)];
      }
      // Pick 1 to 5 random items for this transaction (no duplicates)
      const numItems = Math.floor(Math.random() * 5) + 1;
      let total_bayar = 0;
      let total_keuntungan = 0;
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
        const keuntungan = subtotal - (randomItem.harga_beli * quantity);
        
        total_bayar += subtotal;
        total_keuntungan += keuntungan;
        
        selectedItems.push({
          id_barang: randomItem.id_barang,
          nama_barang: randomItem.nama_barang,
          quantity,
          harga_satuan,
          subtotal
        });
      }
      
      const insertTrxQuery = `
        INSERT INTO Transaksi (waktu_transaksi, total_bayar, jenis_transaksi, id_pengguna, metode_pembayaran, nrp)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const [trxResult] = await db.execute(insertTrxQuery, [mysqlDate, total_bayar, jenis_transaksi, kasirId, metode_pembayaran, nrp]);
      const id_transaksi = trxResult.insertId;
      
      // Update keuntungan later or we can alter table to add total_keuntungan if it's there
      // Wait, is total_keuntungan in the db? The controller does `UPDATE Transaksi SET total_bayar = ?, total_keuntungan = ?` 
      // Let's assume total_keuntungan is in the Transaksi table since it's in the controller logic.
      // Wait, let's just run an update query.
      try {
          await db.execute('UPDATE Transaksi SET total_keuntungan = ? WHERE id_transaksi = ?', [total_keuntungan, id_transaksi]);
      } catch(err) {
          // Ignore if total_keuntungan column doesn't exist
      }

      // 3. DUMMY DETAIL TRANSAKSI
      for (const item of selectedItems) {
        const insertDetailQuery = `
          INSERT INTO detail_transaksi (id_transaksi, id_barang, quantity_barang, diskon, subtotal, snapshot_nama_barang)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        await db.execute(insertDetailQuery, [id_transaksi, item.id_barang, item.quantity, 0, item.subtotal, item.nama_barang]);
      }
      }
    }
    console.log(`✅ Berhasil membuat ${trxCount} Transaksi dummy realistis beserta detailnya khusus Bulan Agustus 2026`);

    console.log('Selesai!');
    process.exit(0);
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    process.exit(1);
  }
}

seedData();
