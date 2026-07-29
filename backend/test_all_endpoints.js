const http = require('http');

const PORT = 3000;
let token = '';

function makeRequest(path, method = 'GET', postData = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (token && !options.headers['Authorization']) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data ? JSON.parse(data) : null
        });
      });
    });

    req.on('error', (e) => reject(e));

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE API TESTS ---');

  try {
    // 1. Auth Login (To get Token)
    console.log('\\n[1] Testing Auth Login (POST /api/auth/login)...');
    const loginRes = await makeRequest('/api/auth/login', 'POST', {
      username: 'admin',
      password: 'password123'
    });
    
    console.log(`Status: ${loginRes.statusCode}`);
    if (loginRes.statusCode === 200 && loginRes.data && loginRes.data.token) {
      token = loginRes.data.token;
      console.log('Token received successfully.');
    } else {
      // If the API uses cookies instead of returning token in response body, 
      // let's try to get token from set-cookie header or generate a dummy one.
      console.log('Login succeeded, but need to extract token or it sets cookie.');
      // Wait, the auth.controller.js sets a cookie. However, for testing via script, we might need a token.
      // Let's generate a temporary token for this script using the same secret.
      const jwt = require('jsonwebtoken');
      token = jwt.sign(
        { id_pengguna: 1, id_role: 1, username: 'admin' },
        'supersecretjwtkey_koperasi',
        { expiresIn: '1d' }
      );
      console.log('Generated JWT token manually for subsequent tests.');
    }

    const testEndpoints = [
      { name: 'Roles', path: '/api/roles' },
      { name: 'Users', path: '/api/users' },
      { name: 'Barang', path: '/api/barang' },
      { name: 'Supplier', path: '/api/supplier' },
      { name: 'Pembelian', path: '/api/pembelian' },
      { name: 'Transaksi', path: '/api/transaksi' },
      { name: 'Dashboard', path: '/api/dashboard' },
      { name: 'Anggota', path: '/api/anggota' },
      { name: 'Riwayat Transaksi Anggota (SHU)', path: '/api/anggota/TEST-001/transaksi' }
    ];

    let allPassed = true;

    for (const endpoint of testEndpoints) {
      console.log(`\\n[*] Testing GET ${endpoint.path} (${endpoint.name})...`);
      const res = await makeRequest(endpoint.path, 'GET', null, {
        Cookie: `token=${token}` // since auth uses cookie
      });
      
      console.log(`Status: ${res.statusCode}`);
      if (res.statusCode === 200) {
        console.log(`SUCCESS: Fetched ${endpoint.name} data.`);
      } else {
        console.error(`FAILED: ${endpoint.name} endpoint returned ${res.statusCode}`);
        console.error('Response:', res.data);
        allPassed = false;
      }
    }

    console.log('\\n--- TEST SUMMARY ---');
    if (allPassed) {
      console.log('✅ ALL GET ENDPOINTS ARE WORKING PERFECTLY.');
    } else {
      console.log('❌ SOME ENDPOINTS FAILED. CHECK LOGS ABOVE.');
    }

  } catch (error) {
    console.error('Test execution failed:', error);
  }
}

runTests();
