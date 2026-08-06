-- Table structure for jurnal_akuntansi
DROP TABLE IF EXISTS `jurnal_akuntansi`;
CREATE TABLE `jurnal_akuntansi` (
  `id_jurnal` int NOT NULL AUTO_INCREMENT,
  `tanggal` datetime DEFAULT CURRENT_TIMESTAMP,
  `keterangan` varchar(255) NOT NULL,
  `akun_debit` varchar(100) NOT NULL,
  `akun_kredit` varchar(100) NOT NULL,
  `nominal` decimal(15,2) NOT NULL,
  `id_transaksi_referensi` int DEFAULT NULL,
  `jenis_referensi` enum('Penjualan', 'Pembelian', 'Manual') DEFAULT 'Manual',
  PRIMARY KEY (`id_jurnal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
