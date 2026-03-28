const mongoose = require('mongoose');
const Buku = require('../models/Buku');
const Anggota = require('../models/Anggota');
const Peminjaman = require('../models/Peminjaman');

const seedDB = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/libraryHubDB');
        console.log('Koneksi ke DB berhasil untuk proses Seeding');

        // Bersihkan koleksi
        await Buku.deleteMany({});
        await Anggota.deleteMany({});
        await Peminjaman.deleteMany({});

        // Seed Buku
        const bukuData = [
            { isbn: '111', judul: 'Bagaimana Cara Terbang', pengarang: 'I Gusti Alit', genre: 'Fiksi', stok: 5 },
            { isbn: '222', judul: 'How Delivery System Works', pengarang: 'Dahlia Turner', genre: 'Sejarah', stok: 3 },
            { isbn: '333', judul: 'Sapiens', pengarang: 'Anggas', genre: 'Sains', stok: 4 },
            { isbn: '444', judul: 'Clean Motorcycle', pengarang: 'Robert C. Surya', genre: 'Teknologi', stok: 2 },
            { isbn: '555', judul: 'Why bird is the most majestic animal', pengarang: 'James Lits', genre: 'Non-Fiksi', stok: 6 }
        ];
        const bukuInserted = await Buku.insertMany(bukuData);

        // Seed Anggota
        const anggotaData = [
            { no_anggota: 'A001', nama: 'Alit Perkutut', email: 'alit@mail.com', poin: 0 },
            { no_anggota: 'A002', nama: 'Lits Bird', email: 'bird@mail.com', poin: 10 },
            { no_anggota: 'A003', nama: 'Surya N Max', email: 'surya@mail.com', poin: 5 },
            { no_anggota: 'A004', nama: 'Dahlia Packet', email: 'dahlia@mail.com', status: 'Nonaktif' },
            { no_anggota: 'A005', nama: 'Dewi Sartika', email: 'dewi@mail.com', poin: 20 }
        ];
        const anggotaInserted = await Anggota.insertMany(anggotaData);

        // Seed Peminjaman
        // Membuat 10 data peminjaman acak
        const pinjamData = [];
        for (let i = 0; i < 10; i++) {
            let tglPinjam = new Date();
            tglPinjam.setDate(tglPinjam.getDate() - Math.floor(Math.random() * 15)); // Random 0-15 hari lalu
            
            let tglRencana = new Date(tglPinjam);
            tglRencana.setDate(tglRencana.getDate() + 7);

            pinjamData.push({
                id_buku: bukuInserted[i % 5]._id,
                id_anggota: anggotaInserted[i % 5]._id,
                tgl_pinjam: tglPinjam,
                tgl_kembali_rencana: tglRencana,
                status: 'Dipinjam'
            });
        }
        await Peminjaman.insertMany(pinjamData);

        console.log('Proses Seeding Berhasil! 5 Buku, 5 Anggota, dan 10 Peminjaman ditambahkan.');
        mongoose.connection.close();
    } catch (err) {
        console.error('Seeding gagal:', err);
    }
};

seedDB();