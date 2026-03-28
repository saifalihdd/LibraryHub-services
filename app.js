const express = require('express');
const mongoose = require('mongoose');
const logger = require('./middleware/logger');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(logger); // Mengguanakan middleware logger wajib

// Koneksi ke MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/libraryHubDB')
    .then(() => console.log('Terkoneksi ke MongoDB (libraryHubDB)'))
    .catch((err) => console.error('Gagal terkoneksi ke MongoDB:', err));

// Routes
app.use('/buku', require('./routes/bukuRoutes'));
app.use('/anggota', require('./routes/anggotaRoutes'));
app.use('/pinjam', require('./routes/peminjamanRoutes'));
app.use('/review', require('./routes/reviewRoutes'));
app.use('/statistik', require('./routes/statistikRoutes'));

// Start Server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});