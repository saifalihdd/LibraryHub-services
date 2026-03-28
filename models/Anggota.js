const mongoose = require('mongoose');

const skemaAnggota = new mongoose.Schema({
    no_anggota: { type: String, required: true, unique: true },
    nama: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    no_hp: { type: String },
    alamat: { type: String },
    status: { type: String, enum: ['Aktif', 'Nonaktif'], default: 'Aktif' },
    poin: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Anggota', skemaAnggota);