const http = require('http');

const baseUrl = 'http://127.0.0.1:3000/api';

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
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id_pengguna: 1, id_role: 1, username: 'admin' }, 
      'supersecretjwtkey_koperasi', 
      { expiresIn: '1d' }
    );

    console.log("=== 1. TEST CREATE SUPPLIER ===");
    const supplierRes = await request('POST', '/supplier', { nama_supplier: "PT. ABC Pemasok", kontak: "0812345", alamat: "Jakarta" }, token);
    console.log("Create Supplier:", supplierRes.status, supplierRes.data);
    const id_supplier = supplierRes.data.id_supplier;

    console.log("\n=== 2. TEST CREATE PEMBELIAN (WITH NEW BARANG) ===");
    // Kita akan beli 1 barang yang tidak ada ID-nya (barang baru), dan 1 barang sudah ada (misal id 1)
    const newPembelian = {
      kategori: "Swalayan",
      id_supplier: id_supplier,
      items: [
        {
          id_barang: 1,
          jumlah: 50,
          harga_satuan: 1000
        },
        {
          barang_baru: {
            nama_barang: "Kopi ABC Susu Sachet " + Date.now(),
            golongan: "Minuman",
            harga_beli: 1500,
            harga_swalayan: 2000,
            satuan_swalayan: "Sachet"
          },
          jumlah: 100,
          harga_satuan: 1500
        }
      ]
    };

    const pembRes = await request('POST', '/pembelian', newPembelian, token);
    console.log("Create Pembelian:", pembRes.status, pembRes.data);
    const id_pembelian = pembRes.data.id_pembelian;

    console.log("\n=== 3. GET PEMBELIAN SEBELUM DIMUTASI ===");
    const getPemb1 = await request('GET', `/pembelian/${id_pembelian}`, null, token);
    console.log("Status Pembelian saat ini:", getPemb1.data.status);
    const newBarangId = getPemb1.data.items[1].id_barang; // ID barang baru
    
    const cekBarang1 = await request('GET', `/barang/${newBarangId}`, null, token);
    console.log("Stok Swalayan barang baru (seharusnya 0):", cekBarang1.data.stok_swalayan);

    console.log("\n=== 4. UPDATE STATUS KE 'Diterima' ===");
    const updDiterima = await request('PUT', `/pembelian/${id_pembelian}/status`, { status: 'Diterima' }, token);
    console.log("Update status:", updDiterima.status, updDiterima.data);

    console.log("\n=== 5. UPDATE STATUS KE 'Dimutasi' (STOK NAIK) ===");
    const updDimutasi = await request('PUT', `/pembelian/${id_pembelian}/status`, { status: 'Dimutasi' }, token);
    console.log("Update status:", updDimutasi.status, updDimutasi.data);

    console.log("\n=== 6. CEK STOK BARANG BARU SETELAH DIMUTASI ===");
    const cekBarang2 = await request('GET', `/barang/${newBarangId}`, null, token);
    console.log("Stok Swalayan barang baru (seharusnya naik 100):", cekBarang2.data.stok_swalayan);

  } catch (err) {
    console.error("Test error:", err);
  }
}

runTests();
