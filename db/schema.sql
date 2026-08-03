-- Database Schema Dump
-- Generated for Koperasi Tribuana IV

SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS anggota;
CREATE TABLE `anggota` (
  `nrp` varchar(50) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `pangkat` varchar(100) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`nrp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS barang;
CREATE TABLE `barang` (
  `id_barang` int NOT NULL AUTO_INCREMENT,
  `barcode` varchar(50) DEFAULT NULL,
  `nama_barang` varchar(150) NOT NULL,
  `golongan` varchar(100) DEFAULT NULL,
  `harga_beli` decimal(15,2) DEFAULT '0.00',
  `stok_swalayan` int DEFAULT '0',
  `stok_grosir` int DEFAULT '0',
  `harga_swalayan` decimal(15,2) DEFAULT '0.00',
  `harga_grosir` decimal(15,2) DEFAULT '0.00',
  `satuan_swalayan` varchar(20) DEFAULT NULL,
  `satuan_grosir` varchar(20) DEFAULT NULL,
  `stok_minimal` int DEFAULT '10',
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_barang`),
  UNIQUE KEY `barcode` (`barcode`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS detail_pembelian;
CREATE TABLE `detail_pembelian` (
  `id_detail` int NOT NULL AUTO_INCREMENT,
  `id_pembelian` int NOT NULL,
  `id_barang` int DEFAULT NULL,
  `snapshot_nama_barang` varchar(255) NOT NULL,
  `jumlah` int NOT NULL,
  `harga_satuan` decimal(15,2) NOT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id_detail`),
  KEY `id_pembelian` (`id_pembelian`),
  KEY `id_barang` (`id_barang`),
  CONSTRAINT `detail_pembelian_ibfk_1` FOREIGN KEY (`id_pembelian`) REFERENCES `pembelian` (`id_pembelian`) ON DELETE CASCADE,
  CONSTRAINT `detail_pembelian_ibfk_2` FOREIGN KEY (`id_barang`) REFERENCES `barang` (`id_barang`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS detail_transaksi;
CREATE TABLE `detail_transaksi` (
  `id_detail` int NOT NULL AUTO_INCREMENT,
  `id_transaksi` int NOT NULL,
  `id_barang` int DEFAULT NULL,
  `quantity_barang` int NOT NULL,
  `harga_satuan` decimal(15,2) DEFAULT NULL,
  `diskon` decimal(15,2) DEFAULT '0.00',
  `subtotal` decimal(15,2) NOT NULL,
  `snapshot_nama_barang` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_detail`),
  KEY `idx_fk_transaksi` (`id_transaksi`),
  KEY `fk_detail_barang` (`id_barang`),
  CONSTRAINT `detail_transaksi_ibfk_1` FOREIGN KEY (`id_transaksi`) REFERENCES `transaksi` (`id_transaksi`),
  CONSTRAINT `fk_detail_barang` FOREIGN KEY (`id_barang`) REFERENCES `barang` (`id_barang`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS pembelian;
CREATE TABLE `pembelian` (
  `id_pembelian` int NOT NULL AUTO_INCREMENT,
  `kategori` enum('Swalayan','Grosir') NOT NULL,
  `status` enum('Menunggu','Diterima','Dimutasi','Ditunda') DEFAULT 'Menunggu',
  `waktu_pembelian` datetime DEFAULT CURRENT_TIMESTAMP,
  `id_supplier` int NOT NULL,
  `id_pengguna` int NOT NULL,
  `total_biaya` decimal(15,2) DEFAULT '0.00',
  PRIMARY KEY (`id_pembelian`),
  KEY `id_supplier` (`id_supplier`),
  KEY `id_pengguna` (`id_pengguna`),
  CONSTRAINT `pembelian_ibfk_1` FOREIGN KEY (`id_supplier`) REFERENCES `supplier` (`id_supplier`) ON DELETE RESTRICT,
  CONSTRAINT `pembelian_ibfk_2` FOREIGN KEY (`id_pengguna`) REFERENCES `pengguna` (`id_pengguna`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS pengguna;
CREATE TABLE `pengguna` (
  `id_pengguna` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nama_pengguna` varchar(100) NOT NULL,
  `id_role` int DEFAULT NULL,
  PRIMARY KEY (`id_pengguna`),
  UNIQUE KEY `username` (`username`),
  KEY `pengguna_ibfk_1` (`id_role`),
  CONSTRAINT `pengguna_ibfk_1` FOREIGN KEY (`id_role`) REFERENCES `role` (`id_role`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS role;
CREATE TABLE `role` (
  `id_role` int NOT NULL AUTO_INCREMENT,
  `nama_role` varchar(50) NOT NULL,
  `deskripsi` text,
  PRIMARY KEY (`id_role`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS supplier;
CREATE TABLE `supplier` (
  `id_supplier` int NOT NULL AUTO_INCREMENT,
  `nama_supplier` varchar(255) NOT NULL,
  `kontak` varchar(100) DEFAULT NULL,
  `alamat` text,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_supplier`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS transaksi;
CREATE TABLE `transaksi` (
  `id_transaksi` int NOT NULL AUTO_INCREMENT,
  `waktu_transaksi` datetime NOT NULL,
  `total_bayar` decimal(15,2) DEFAULT '0.00',
  `jenis_transaksi` varchar(50) DEFAULT NULL,
  `id_pengguna` int DEFAULT NULL,
  `nrp` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_transaksi`),
  KEY `transaksi_ibfk_1` (`id_pengguna`),
  KEY `fk_transaksi_anggota` (`nrp`),
  KEY `idx_waktu_transaksi` (`waktu_transaksi`),
  CONSTRAINT `fk_transaksi_anggota` FOREIGN KEY (`nrp`) REFERENCES `anggota` (`nrp`) ON DELETE SET NULL,
  CONSTRAINT `transaksi_ibfk_1` FOREIGN KEY (`id_pengguna`) REFERENCES `pengguna` (`id_pengguna`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS=1;
