-- Table structure for void_log
DROP TABLE IF EXISTS `void_log`;
CREATE TABLE `void_log` (
  `id_void` int NOT NULL AUTO_INCREMENT,
  `waktu` datetime DEFAULT CURRENT_TIMESTAMP,
  `id_kasir` int NOT NULL,
  `id_otorisator` int NOT NULL,
  `alasan` text,
  `nominal_batal` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id_void`),
  KEY `fk_void_kasir` (`id_kasir`),
  KEY `fk_void_otorisator` (`id_otorisator`),
  CONSTRAINT `fk_void_kasir` FOREIGN KEY (`id_kasir`) REFERENCES `pengguna` (`id_pengguna`),
  CONSTRAINT `fk_void_otorisator` FOREIGN KEY (`id_otorisator`) REFERENCES `pengguna` (`id_pengguna`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
