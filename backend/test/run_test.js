const http = require('http');

const baseUrl = 'http://localhost:3000/api';

async function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(baseUrl + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json;
        try {
           json = JSON.parse(data);
        } catch(e) {
           json = data;
        }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  try {
    console.log("=== 1. GENERATE TOKEN ===");
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id_pengguna: 1, id_role: 1, username: 'admin' }, 
      'supersecretjwtkey_koperasi', 
      { expiresIn: '1d' }
    );
    console.log("Token generated.");

    console.log("\n=== 2. TEST CREATE BARANG ===");
    const newBarang = {
      nama_barang: "Barang Test Delete " + Date.now(),
      golongan: "Test",
      barcode: "TEST-" + Date.now(),
      harga_beli: 1000,
      harga_swalayan: 2000,
      harga_grosir: 1500,
      stok_swalayan: 10,
      stok_grosir: 10,
      satuan_swalayan: "pcs",
      satuan_grosir: "box"
    };
    const barangRes = await request('POST', '/barang', newBarang, token);
    console.log("Create Barang status:", barangRes.status);
    
    // We assume the API returns the id of the new barang
    // Looking at the implementation (if typical), maybe it returns `{ id: ... }`
    // Let's fetch all barang to find the ID if not returned
    let barangId;
    if (barangRes.data && barangRes.data.id) {
       barangId = barangRes.data.id;
    } else {
       const allBarang = await request('GET', '/barang', null, token);
       const lastBarang = allBarang.data[allBarang.data.length - 1];
       barangId = lastBarang.id_barang;
    }
    console.log("Created Barang ID:", barangId);

    console.log("\n=== 3. TEST CREATE TRANSAKSI ===");
    const newTransaksi = {
      jenis_transaksi: "Swalayan",
      total_bayar: 2000,
      items: [
        {
          id_barang: barangId,
          quantity: 1,
          diskon: 0
        }
      ]
    };
    const transRes = await request('POST', '/transaksi', newTransaksi, token);
    console.log("Create Transaksi status:", transRes.status, transRes.data);
    let transId;
    if (transRes.data && transRes.data.data) {
        transId = transRes.data.data.id_transaksi;
    } else if (transRes.data && transRes.data.id_transaksi) {
        transId = transRes.data.id_transaksi;
    } else {
        const allTrans = await request('GET', '/transaksi', null, token);
        const lastTrans = allTrans.data[0]; // descending order usually
        transId = lastTrans.id_transaksi;
    }
    console.log("Created Transaksi ID:", transId);

    console.log("\n=== 4. TEST DELETE BARANG (HARD DELETE) ===");
    const delBarangRes = await request('DELETE', `/barang/${barangId}`, null, token);
    console.log("Delete Barang status:", delBarangRes.status, delBarangRes.data);

    console.log("\n=== 5. GET TRANSAKSI DETAILS (EXPECTING SNAPSHOT NAME) ===");
    const getTransRes = await request('GET', `/transaksi/${transId}`, null, token);
    console.log("Get Transaksi status:", getTransRes.status);
    console.log("Transaksi Details:", JSON.stringify(getTransRes.data, null, 2));

    console.log("\nAll tests finished!");
  } catch (err) {
    console.error("Test error:", err);
  }
}

runTests();
