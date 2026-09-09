const express = require('express');
const router = express.Router();
const anggotaController = require('../controllers/anggota.controller');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

// GET rekap voucher seluruh anggota (Excel export)
router.get('/rekap-voucher', verifyToken, anggotaController.getRekapVoucherAll);

// GET detail cetak laporan resmi anggota individu
router.get('/:nrp/detail-cetak', verifyToken, anggotaController.getDetailCetakAnggota);

// GET all anggota
router.get('/', verifyToken, anggotaController.getAllAnggota);

// GET anggota by NRP
router.get('/:nrp', verifyToken, anggotaController.getAnggotaByNrp);

// POST anggota baru
router.post('/', verifyToken, verifyAdmin, anggotaController.createAnggota);

// PUT update anggota
router.put('/:nrp', verifyToken, verifyAdmin, anggotaController.updateAnggota);

// DELETE anggota (soft delete)
router.delete('/:nrp', verifyToken, verifyAdmin, anggotaController.deleteAnggota);

// GET riwayat transaksi (SHU) anggota
router.get('/:nrp/transaksi', verifyToken, anggotaController.getRiwayatTransaksiAnggota);

module.exports = router;
