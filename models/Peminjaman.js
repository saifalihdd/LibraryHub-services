const mongoose = require('mongoose');

const skemaPeminjaman = new mongoose.Schema({
    id_buku: { type: mongoose.Schema.Types.ObjectId, ref: 'Buku', required: true },
    id_anggota: { type: mongoose.Schema.Types.ObjectId, ref: 'Anggota', required: true },
    tgl_pinjam: { type: Date, default: Date.now },
    tgl_kembali_rencana: { type: Date, required: true },
    tgl_kembali_aktual: { type: Date },
    status: { 
        type: String, 
        enum: ['Dipinjam', 'Dikembalikan', 'Terlambat'], 
        default: 'Dipinjam' 
    },
    denda: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Peminjaman', skemaPeminjaman);