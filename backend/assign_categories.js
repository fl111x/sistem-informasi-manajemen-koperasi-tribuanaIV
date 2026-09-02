require('dotenv').config();
const mysql = require('mysql2/promise');

function guessCategory(nama) {
  if (!nama) return 'FOOD';
  nama = nama.toUpperCase();
  
  // ABRI
  if (nama.includes('PDH') || nama.includes('PDL') || nama.includes('LORENG') || nama.includes('PANGKAT') || nama.includes('BRIVET') || nama.includes('BARET') || nama.includes('SANGKUR') || nama.includes('SERAGAM')) {
    return 'ABRI';
  }
  // RAJUTAN
  if (nama.includes('KAOS') || nama.includes('SINGLET') || nama.includes('CELANA') || nama.includes('KEMEJA') || nama.includes('STELAN') || nama.includes('HANDUK') || nama.includes('SEPATU') || nama.includes('KAOS KAKI')) {
    return 'RAJUTAN';
  }
  // ATK
  if (nama.includes('BUKU') || nama.includes('PENSIL') || nama.includes('PULPEN') || nama.includes('KERTAS') || nama.includes('MAP') || nama.includes('SPIDOL') || nama.includes('TINTA') || nama.includes('ISOLASI')) {
    return 'ATK';
  }
  // KOSMETIK
  if (nama.includes('SABUN') || nama.includes('SHAMPO') || nama.includes('LULUR') || nama.includes('BEDAK') || nama.includes('PARFUM') || nama.includes('SIKAT') || nama.includes('PASTA GIGI') || nama.includes('PEPSODENT') || nama.includes('CIPTADENT') || nama.includes('CLEAN') || nama.includes('BIORE') || nama.includes('LIFEBUOY') || nama.includes('PANTENE')) {
    return 'KOSMETIK';
  }
  // OBAT
  if (nama.includes('OBAT') || nama.includes('PIL') || nama.includes('KAPSUL') || nama.includes('SALEP') || nama.includes('MINYAK ANGIN') || nama.includes('TOLAK ANGIN') || nama.includes('BODREX') || nama.includes('PANADOL') || nama.includes('PROMAG')) {
    return 'OBAT';
  }
  // ELEKTRO
  if (nama.includes('KABEL') || nama.includes('LAMPU') || nama.includes('BATRE') || nama.includes('BATERAI') || nama.includes('SAKLAR') || nama.includes('COLOKAN') || nama.includes('PHILIPS')) {
    return 'ELEKTRO';
  }
  // PECAH BELAH
  if (nama.includes('GELAS') || nama.includes('PIRING') || nama.includes('MANGKOK') || nama.includes('CANGKIR') || nama.includes('SENDOK') || nama.includes('GARPU') || nama.includes('TUPPERWARE')) {
    return 'PECAH BELAH';
  }
  // NON FOOD (Pembersih dll)
  if (nama.includes('RINSO') || nama.includes('DAIA') || nama.includes('SOKLIN') || nama.includes('WIPOL') || nama.includes('BAYGON') || nama.includes('HIT') || nama.includes('TISSUE') || nama.includes('PLASTIK') || nama.includes('MOLTO') || nama.includes('DOWNY') || nama.includes('SUNLIGHT') || nama.includes('MAMA LEMON')) {
    return 'NON FOOD';
  }
  // FOOD
  if (nama.includes('MIE') || nama.includes('BERAS') || nama.includes('MINYAK') || nama.includes('GULA') || nama.includes('KOPI') || nama.includes('TEH') || nama.includes('SUSU') || nama.includes('AIR') || nama.includes('ROKOK') || nama.includes('SNACK') || nama.includes('KECAP') || nama.includes('SAOS') || nama.includes('BUMBU') || nama.includes('AQUA') || nama.includes('MINERAL') || nama.includes('BISKUIT') || nama.includes('ROTI') || nama.includes('INDOMIE') || nama.includes('KACANG') || nama.includes('DJARUM') || nama.includes('GUDANG GARAM') || nama.includes('SAMPORNA') || nama.includes('SAMPOERNA') || nama.includes('MANTAP') || nama.includes('CHITATO') || nama.includes('TARO')) {
    return 'FOOD';
  }
  
  // Default (Kalau tidak terdeteksi)
  return 'FOOD'; 
}

async function assignCategories() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_koperasi',
  });

  try {
    const [barangList] = await db.query('SELECT id_barang, nama_barang FROM barang');
    
    let counts = {
      'FOOD': 0, 'NON FOOD': 0, 'ELEKTRO': 0, 'PECAH BELAH': 0, 
      'ATK': 0, 'KOSMETIK': 0, 'OBAT': 0, 'ABRI': 0, 'RAJUTAN': 0
    };
    
    console.log(`Mulai mengklasifikasikan ${barangList.length} barang...`);
    
    for (let barang of barangList) {
      const cat = guessCategory(barang.nama_barang);
      counts[cat]++;
      
      await db.query('UPDATE barang SET golongan = ? WHERE id_barang = ?', [cat, barang.id_barang]);
    }
    
    console.log('Selesai!');
    console.table(counts);
    
  } catch (err) {
    console.error(err);
  } finally {
    await db.end();
  }
}

assignCategories();
