CREATE TABLE IF NOT EXISTS Pembelian (
  id_pembelian INT AUTO_INCREMENT PRIMARY KEY,
  kategori VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  nama_supplier VARCHAR(200) NOT NULL,
  id_pengguna INT NOT NULL,
  total_biaya DECIMAL(15,2) DEFAULT 0,
  waktu_pembelian DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_pengguna) REFERENCES Pengguna(id_pengguna) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS Detail_Pembelian (
  id_detail_pembelian INT AUTO_INCREMENT PRIMARY KEY,
  id_pembelian INT NOT NULL,
  id_barang INT NOT NULL,
  snapshot_nama_barang VARCHAR(200),
  jumlah INT NOT NULL,
  harga_satuan DECIMAL(15,2) NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL,
  FOREIGN KEY (id_pembelian) REFERENCES Pembelian(id_pembelian) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_barang) REFERENCES Barang(id_barang) ON DELETE RESTRICT ON UPDATE CASCADE
);
