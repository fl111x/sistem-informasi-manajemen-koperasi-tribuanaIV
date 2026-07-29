const http = require('http');

async function runTests() {
  const baseUrl = 'http://localhost:3000/api';
  
  // Create a user directly in DB or use existing API to login?
  // Let's assume we can just login or we need to register first.
  let token = '';
  
  // 1. Try to login as admin
  try {
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    if (!loginRes.ok) {
      console.log('Login failed, trying to register admin...');
      // Need a role first, assuming role id 1 is admin.
      const regRes = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password123', nama_pengguna: 'Administrator', id_role: 1 })
      });
      console.log('Register response:', await regRes.text());
      
      const loginRes2 = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password123' })
      });
      const loginData2 = await loginRes2.json();
      token = loginRes2.headers.get('set-cookie')?.split(';')[0].split('=')[1] || loginData2.token;
      
      // If the API uses cookies for auth, we need to extract it.
      // Wait, in auth.controller.js, it sets cookie 'token' but doesn't return it in JSON.
      let cookieHeader = loginRes2.headers.get('set-cookie');
      if (cookieHeader) {
         token = cookieHeader.split(';')[0].split('=')[1];
      }
    } else {
      let cookieHeader = loginRes.headers.get('set-cookie');
      if (cookieHeader) {
         token = cookieHeader.split(';')[0].split('=')[1];
      }
    }
  } catch(e) {
    console.error('Auth error', e);
  }
  
  console.log('Using Token:', token);

  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `token=${token}`
  };

  // 2. Test POST /api/anggota
  console.log('--- POST /api/anggota ---');
  const postRes = await fetch(`${baseUrl}/anggota`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ nrp: 'TEST-001', nama: 'Test User', pangkat: 'Kopral' })
  });
  console.log(await postRes.text());

  // 3. Test GET /api/anggota
  console.log('--- GET /api/anggota ---');
  const getRes = await fetch(`${baseUrl}/anggota`, { headers });
  console.log(await getRes.text());

  // 4. Test GET /api/anggota/:nrp
  console.log('--- GET /api/anggota/TEST-001 ---');
  const getOneRes = await fetch(`${baseUrl}/anggota/TEST-001`, { headers });
  console.log(await getOneRes.text());

  // 5. Test PUT /api/anggota/:nrp
  console.log('--- PUT /api/anggota/TEST-001 ---');
  const putRes = await fetch(`${baseUrl}/anggota/TEST-001`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ pangkat: 'Sersan' })
  });
  console.log(await putRes.text());

  // 6. Test DELETE /api/anggota/:nrp
  console.log('--- DELETE /api/anggota/TEST-001 ---');
  const delRes = await fetch(`${baseUrl}/anggota/TEST-001`, {
    method: 'DELETE',
    headers
  });
  console.log(await delRes.text());
}

runTests();
