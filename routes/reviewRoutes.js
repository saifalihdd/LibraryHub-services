const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Peminjaman = require('../models/Peminjaman');
const Anggota = require('../models/Anggota');

// GET /review - Populate buku & anggota
router.get('/', async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('id_buku', 'judul genre')
            .populate('id_anggota', 'nama no_anggota');
        res.json(reviews);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /review - Tambah review (validasi harus pernah meminjam)
router.post('/', async (req, res) => {
    try {
        const { id_buku, id_anggota, rating, komentar } = req.body;

        // Validasi: Apakah anggota pernah meminjam buku ini?
        const pernahPinjam = await Peminjaman.findOne({ id_buku, id_anggota });
        if (!pernahPinjam) {
         const anggota = await Anggota.findById(id_anggota);
            const namaAnggota = anggota ? anggota.nama : 'Anggota';
            return res.status(403).json({ message: `${namaAnggota} belum pernah meminjam buku ini.` });
        }

        const reviewBaru = new Review({ id_buku, id_anggota, rating, komentar });
        await reviewBaru.save();
        res.status(201).json(reviewBaru);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /review/:id & DELETE /review/:id
router.put('/:id', async (req, res) => {
    try {
        const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.json(review);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);
        res.json({ message: 'Review dihapus.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;