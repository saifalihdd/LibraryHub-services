const express = require('express');
const router = express.Router();
const Peminjaman = require('../models/Peminjaman');
const Buku = require('../models/Buku');
const Anggota = require('../models/Anggota');

// GET /pinjam - Ambil semua data peminjaman (dengan filter ?status=terlambat & pagination)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;

        let query = {};

        if (status) {
            if (status !== 'terlambat') {
                return res.status(400).json({ message: "Status harus 'terlambat'" });
            }
            query.status = 'Terlambat';
        }

        const peminjaman = await Peminjaman.find(query)
            .populate('id_buku', 'judul pengarang genre')
            .populate('id_anggota', 'nama no_anggota')
            .skip((page - 1) * limit)
            .limit(limit);


        if (peminjaman.length === 0) {
            return res.status(404).json({ message: "Belum ada yang meminjam" });
        }

        query.status = status;

        res.json({
            data: peminjaman,
            page,
            limit,
            total_data_halaman_ini: peminjaman.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /pinjam/:id - Ambil detail peminjaman berdasarkan ID
router.get('/:id', async (req, res) => {
    try {
        const peminjaman = await Peminjaman.findById(req.params.id)
            .populate('id_buku', 'judul pengarang genre')
            .populate('id_anggota', 'nama no_anggota email');
            
        if (!peminjaman) return res.status(404).json({ message: 'Data peminjaman tidak ditemukan.' });
        res.json(peminjaman);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /pinjam - Buat peminjaman baru
router.post('/', async (req, res) => {
    try {
        const { id_buku, id_anggota } = req.body;

        const anggota = await Anggota.findById(id_anggota);
        if (!anggota) {
            return res.status(404).json({ message: 'Data anggota tidak ditemukan' });
        }
        if (anggota.status === 'nonaktif') {
            return res.status(403).json({ message: 'Anggota berstatus nonaktif dan tidak diizinkan meminjam buku' });
        }

        const buku = await Buku.findById(id_buku);
        if (!buku || buku.stok < 1) {
            return res.status(400).json({ message: 'Buku tidak ditemukan/stok habis.' });
        }

        buku.stok -= 1;
        if (buku.stok === 0) buku.tersedia = false;
        await buku.save();

        const tgl_pinjam = new Date();
        const tgl_kembali_rencana = new Date();
        tgl_kembali_rencana.setDate(tgl_pinjam.getDate() + 7);

        const peminjaman = new Peminjaman({
            id_buku,
            id_anggota,
            tgl_pinjam,
            tgl_kembali_rencana
        });
        await peminjaman.save();

        res.status(201).json({ message: 'Peminjaman berhasil.', data: peminjaman });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /pinjam/cek-terlambat - Update massal status peminjaman yang lewat tenggat
router.put('/cek-terlambat', async (req, res) => {
    try {
        const sekarang = new Date();
        const result = await Peminjaman.updateMany(
            {
                status: 'Dipinjam',
                tgl_kembali_rencana: { $lt: sekarang }
            },
            {
                $set: { status: 'Terlambat' }
            }
        );
        res.json({ message: `${result.modifiedCount} data peminjaman diubah menjadi terlambat.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /pinjam/:id/kembali - Proses pengembalian buku
router.put('/:id/kembali', async (req, res) => {
    try {
        const peminjaman = await Peminjaman.findById(req.params.id);

        if (!peminjaman || (peminjaman.status !== 'Dipinjam' && peminjaman.status !== 'Terlambat')) {
            return res.status(400).json({ message: 'Data Peminjaman tidak valid atau sudah dikembalikan.' });
        }

        const tgl_kembali_aktual = new Date();
        peminjaman.tgl_kembali_aktual = tgl_kembali_aktual;

        // Hitung selisih hari
        const tglRencana = new Date(peminjaman.tgl_kembali_rencana);
        const selisihWaktu = tgl_kembali_aktual.getTime() - tglRencana.getTime();
        
        const selisihHari = Math.ceil(selisihWaktu / (1000 * 3600 * 24));

        let denda = 0;
        let poinTambahan = 0;

        if (selisihHari > 0) {
            denda = selisihHari * 2000;
            // Tetap set status jadi dikembalikan karena bukunya sudah pulang
            peminjaman.status = 'Dikembalikan'; 
        } else {
            poinTambahan = 10;
            peminjaman.status = 'Dikembalikan';
        }
        
        peminjaman.denda = denda;

        // Update Poin Anggota jika tepat waktu
        if (poinTambahan > 0) {
            await Anggota.findByIdAndUpdate(peminjaman.id_anggota, { $inc: { poin: poinTambahan } });
        }

        // Update Stok Buku
        const buku = await Buku.findById(peminjaman.id_buku);
        if (buku) {
            buku.stok += 1;
            buku.tersedia = true;
            await buku.save();
        }

        // Simpan Perubahan Peminjaman
        await peminjaman.save();

        res.status(200).json({ 
            message: 'Pengembalian berhasil diproses.', 
            detail: {
                status_akhir: peminjaman.status,
                denda_dikenakan: denda,
                poin_didapat: poinTambahan
            },
            data: peminjaman 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;