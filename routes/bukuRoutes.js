const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Buku = require('../models/Buku');
const Peminjaman = require('../models/Peminjaman');
const Review = require('../models/Review');
const Anggota = require('../models/Anggota');

// GET /buku - Ambil semua buku (dengan filter, search, & pagination bonus)
router.get('/', async (req, res) => {
    try {
        const { genre, search, page = 1, limit = 10 } = req.query;
        let query = {};

        if (genre) query.genre = genre;
        if (search) {
            query.$or = [
                { judul: { $regex: search, $options: 'i' } },
                { pengarang: { $regex: search, $options: 'i' } }
            ];
        }

        const buku = await Buku.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();
            
        res.json({ data: buku, page, limit });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /buku/rekomendasi
router.get('/rekomendasi', async (req, res) => {
    try {
        const id_anggota = req.query.id_anggota;
        
        if (!id_anggota) {
            return res.status(400).json({ message: 'id_anggota wajib diisi' });
        }

        const anggota = await Anggota.findById(id_anggota);
        if (!anggota) {
            return res.status(404).json({ message: 'Data anggota tidak ditemukan' });
        }

        const favorit = await Peminjaman.aggregate([
            { $match: { id_anggota: new mongoose.Types.ObjectId(id_anggota) } },
            {
                $lookup: {
                    from: 'bukus', 
                    localField: 'id_buku',
                    foreignField: '_id',
                    as: 'buku_detail'
                }
            },
            { $unwind: '$buku_detail' },
            { $group: { _id: '$buku_detail.genre', jumlah: { $sum: 1 } } },
            { $sort: { jumlah: -1 } },
            { $limit: 1 } 
        ]);

        if (favorit.length === 0) {
            return res.status(404).json({ message: 'Anggota belum memiliki riwayat peminjaman untuk dianalisis' });
        }

        const genreFavorit = favorit[0]._id;

        const rekomendasiBuku = await Buku.find({
            genre: genreFavorit,
            stok: { $gt: 0 }
        }).limit(3);

        res.json({
            message: `Rekomendasi dari ${anggota.nama} (Genre favorit: ${genreFavorit})`,
            data: rekomendasiBuku
        });

    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// GET /buku/:id - Ambil buku berdasarkan ID
router.get('/:id', async (req, res) => {
    try {
        const buku = await Buku.findById(req.params.id);
        if (!buku) return res.status(404).json({ message: 'Buku tidak ditemukan.' });
        res.json(buku);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /buku/:id/review - Ambil semua review untuk buku tertentu
router.get('/:id/review', async (req, res) => {
    try {
        const reviews = await Review.find({ id_buku: req.params.id }).populate('id_anggota', 'nama email');
        res.json(reviews);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /buku - Tambah buku
router.post('/', async (req, res) => {
    try {
        const bukuBaru = new Buku(req.body);
        const savedBuku = await bukuBaru.save();
        res.status(201).json(savedBuku);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /buku/:id - Update buku
router.put('/:id', async (req, res) => {
    try {
        const buku = await Buku.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.json(buku);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /buku/:id - Hapus buku (validasi sedang dipinjam)
router.delete('/:id', async (req, res) => {
    try {
        const sedangDipinjam = await Peminjaman.findOne({ id_buku: req.params.id, status: 'Dipinjam' });
        if (sedangDipinjam) return res.status(400).json({ message: 'Buku tidak dapat dihapus karena sedang dipinjam.' });
        
        await Buku.findByIdAndDelete(req.params.id);
        res.json({ message: 'Buku berhasil dihapus.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;