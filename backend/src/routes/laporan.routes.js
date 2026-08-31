const express = require('express');
const router = express.Router();
const { getLaporanHarian, getLaporanBulanan, getLaporanTahunan } = require('../controllers/laporan.controller');

// GET /api/laporan/harian
router.get('/harian', getLaporanHarian);

// GET /api/laporan/bulanan
router.get('/bulanan', getLaporanBulanan);

// GET /api/laporan/tahunan
router.get('/tahunan', getLaporanTahunan);

module.exports = router;
