const express = require('express');
const router = express.Router();
const Buku = require('../models/Buku');
const Anggota = require('../models/Anggota');
const Peminjaman = require('../models/Peminjaman');

// GET /statistik
router.get('/', async (req, res) => {
    try {
        const totalBuku = await Buku.countDocuments();
        
        // Validasi jika tidak ada data buku
        if (totalBuku === 0) {
            return res.status(404).json({
                message: "Tidak ada data buku"
            });
        }

        const anggotaAktif = await Anggota.countDocuments({ status: 'Aktif' });
        const peminjamanBerjalan = await Peminjaman.countDocuments({ status: 'Dipinjam' });

        // Aggregation untuk total denda
        const dendaAggr = await Peminjaman.aggregate([
            { $group: { _id: null, totalDenda: { $sum: "$denda" } } }
        ]);
        const totalDenda = dendaAggr.length > 0 ? dendaAggr[0].totalDenda : 0;

        // Aggregation untuk buku paling sering dipinjam
        const populerAggr = await Peminjaman.aggregate([
            { $group: { _id: "$id_buku", totalKaliDipinjam: { $sum: 1 } } },
            { $sort: { totalKaliDipinjam: -1 } },
            { $limit: 1 },
            { $lookup: { from: 'bukus', localField: '_id', foreignField: '_id', as: 'buku' } },
            { $unwind: "$buku" }
        ]);
        
        const bukuTerpopuler = populerAggr.length > 0 ? populerAggr[0].buku.judul : "Belum ada data";

        res.json({
            total_buku: totalBuku,
            anggota_aktif: anggotaAktif,
            peminjaman_berjalan: peminjamanBerjalan,
            total_denda_terkumpul: totalDenda,
            buku_paling_sering_dipinjam: bukuTerpopuler
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;