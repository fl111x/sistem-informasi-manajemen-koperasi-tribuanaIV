const express = require('express');
const router = express.Router();
const { getLaporanHarian, getLaporanBulanan, getLaporanTahunan, getLaporanSHU } = require('../controllers/laporan.controller');

// GET /api/laporan/harian
router.get('/harian', getLaporanHarian);

// GET /api/laporan/bulanan
router.get('/bulanan', getLaporanBulanan);

// GET /api/laporan/tahunan
router.get('/tahunan', getLaporanTahunan);

// POST /api/laporan/shu
router.post('/shu', getLaporanSHU);

module.exports = router;
