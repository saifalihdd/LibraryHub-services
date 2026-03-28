const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Anggota = require('../models/Anggota');
const Peminjaman = require('../models/Peminjaman');

// GET /anggota
router.get('/', async (req, res) => {
    try {
        const anggota = await Anggota.find();
        res.json(anggota);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Rekomendasi berdasarkan genre yang sering dipinjam anggota
router.get('/rekomendasi', async (req, res) => {
    try {
        const { id_anggota } = req.query;
        if (!id_anggota) {
            return res.status(400).json({ message: "Parameter query id_anggota diperlukan." });
        }

        // Aggregation Pipeline untuk mencari genre paling sering dipinjam
        const pipeline = [
            { $match: { id_anggota: new mongoose.Types.ObjectId(id_anggota) } },
            // Lookup untuk menggabungkan data dari collection 'bukus'
            { $lookup: { from: 'bukus', localField: 'id_buku', foreignField: '_id', as: 'detailBuku' } },
            { $unwind: "$detailBuku" },
            // Group berdasarkan genre buku dan hitung jumlahnya
            { $group: { _id: "$detailBuku.genre", jumlahPinjam: { $sum: 1 } } },
            // Urutkan dari yang paling banyak dipinjam
            { $sort: { jumlahPinjam: -1 } },
            { $limit: 1 }
        ];

        const genreFavoritAggr = await Peminjaman.aggregate(pipeline);

        if (genreFavoritAggr.length === 0) {
            return res.json({ message: "Anggota ini belum memiliki riwayat peminjaman yang cukup untuk rekomendasi." });
        }

        const genreFavorit = genreFavoritAggr[0]._id;

        // Cari buku dengan genre tersebut yang stoknya masih tersedia
        const rekomendasiBuku = await Buku.find({ 
            genre: genreFavorit,
            tersedia: true 
        }).limit(5);

        res.json({
            genre_favorit: genreFavorit,
            rekomendasi: rekomendasiBuku
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /anggota/:id
router.get('/:id', async (req, res) => {
    try {
        const anggota = await Anggota.findById(req.params.id);
        res.json(anggota);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /anggota/:id/riwayat - Riwayat peminjaman dengan populate buku
router.get('/:id/riwayat', async (req, res) => {
    try {
        const riwayat = await Peminjaman.find({ id_anggota: req.params.id }).populate('id_buku', 'judul pengarang');
        res.json(riwayat);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /anggota
router.post('/', async (req, res) => {
    try {
        const anggotaBaru = new Anggota(req.body);
        await anggotaBaru.save();
        res.status(201).json(anggotaBaru);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /anggota/:id
router.put('/:id', async (req, res) => {
    try {
        const anggota = await Anggota.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.json(anggota);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /anggota/:id - Soft Delete
router.delete('/:id', async (req, res) => {
    try {
        const anggota = await Anggota.findByIdAndUpdate(req.params.id, { status: 'nonaktif' }, { new: true });
        res.json({ message: 'Anggota dinonaktifkan.', data: anggota });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;