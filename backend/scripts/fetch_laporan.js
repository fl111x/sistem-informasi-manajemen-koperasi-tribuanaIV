fetch("http://localhost:3000/api/laporan/bulanan?bulan=8&tahun=2026")
  .then(r => r.json())
  .then(data => {
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(err => console.error(err));
