const mongoose = require('mongoose');

const skemaReview = new mongoose.Schema({
    id_buku: { type: mongoose.Schema.Types.ObjectId, ref: 'Buku', required: true },
    id_anggota: { type: mongoose.Schema.Types.ObjectId, ref: 'Anggota', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    komentar: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Review', skemaReview);