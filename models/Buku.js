const mongoose = require('mongoose');

const skemaBuku = new mongoose.Schema({
    isbn: { type: String, required: true, unique: true },
    judul: { type: String, required: true },
    pengarang: { type: String, required: true },
    penerbit: { type: String },
    tahun: { type: Number },
    genre: { 
        type: String,   
        enum: ['Fiksi', 'Non-Fiksi', 'Sains', 'Sejarah', 'Teknologi', 'Romansa', 'Lainnya'] 
    },
    stok: { type: Number, required: true, min: 0 },
    tags: [{ type: String }],
    tersedia: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Buku', skemaBuku);