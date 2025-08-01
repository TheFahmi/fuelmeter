# 🚀 Quick Start Guide - FuelMeter

Panduan cepat untuk menjalankan aplikasi FuelMeter dalam 5 menit!

## 📋 Prerequisites

- Node.js 18+ terinstall
- Akun Supabase (gratis)

## ⚡ Langkah Cepat

### 1. Clone & Install
```bash
git clone <repository-url>
cd fuelmeter
npm install
```

### 2. Setup Supabase (2 menit)

1. **Buat Project Supabase:**
   - Buka [supabase.com](https://supabase.com)
   - Klik "New Project"
   - Pilih organization dan beri nama project
   - Tunggu setup selesai

2. **Dapatkan Credentials:**
   - Buka Settings > API
   - Copy "Project URL" dan "anon public" key

3. **Setup Database:**
   - Buka SQL Editor di Supabase Dashboard
   - Copy isi file `supabase-setup-simple.sql`
   - Paste dan klik "Run"

### 3. Setup Environment
```bash
# Copy file environment
cp env.example .env.local

# Edit .env.local dengan credentials Supabase Anda
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Jalankan Aplikasi
```bash
npm run dev
```

### 5. Test Aplikasi
- Buka [http://localhost:3000](http://localhost:3000)
- Klik "Daftar di sini" untuk membuat akun
- Login dan mulai menggunakan aplikasi!

## 🎯 Fitur yang Bisa Dicoba

1. **Register & Login** - Buat akun baru
2. **Dashboard** - Lihat statistik penggunaan
3. **Tambah Catatan** - Catat pengisian bahan bakar
4. **Lihat Semua** - Daftar semua catatan
5. **Edit Catatan** - Edit catatan yang sudah ada
6. **Hapus Catatan** - Hapus catatan yang tidak diperlukan

## 🔧 Troubleshooting

### Error "column row_security does not exist"
- Gunakan file `supabase-setup-simple.sql` yang sudah diperbaiki

### Error "Invalid API key"
- Pastikan URL dan Anon Key sudah benar di `.env.local`
- Restart development server setelah mengubah environment variables

### Error "relation fuel_records does not exist"
- Pastikan script SQL sudah dijalankan di Supabase SQL Editor
- Cek di Table Editor apakah tabel sudah terbuat

## 📱 Mobile Testing

Aplikasi sudah dioptimalkan untuk mobile:
- Buka Developer Tools di browser
- Aktifkan device simulation
- Test di berbagai ukuran layar

## 🚀 Deployment

Setelah testing berhasil, deploy ke Vercel:
1. Push code ke GitHub
2. Connect ke Vercel
3. Set environment variables
4. Deploy!

---

**Selamat! Aplikasi FuelMeter Anda sudah siap digunakan! 🎉** 