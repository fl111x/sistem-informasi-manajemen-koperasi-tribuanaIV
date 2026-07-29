const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173', // Adjust this to match your frontend dev server later
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to POS Koperasi Tribuana IV API' });
});

// Import routes
const authRoutes = require('./routes/auth.routes');
const roleRoutes = require('./routes/role.routes');
const userRoutes = require('./routes/user.routes');
const barangRoutes = require('./routes/barang.routes');
const transaksiRoutes = require('./routes/transaksi.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const supplierRoutes = require('./routes/supplier.routes');
const pembelianRoutes = require('./routes/pembelian.routes');
const anggotaRoutes = require('./routes/anggota.routes');

app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/barang', barangRoutes);
app.use('/api/transaksi', transaksiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/pembelian', pembelianRoutes);
app.use('/api/anggota', anggotaRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
