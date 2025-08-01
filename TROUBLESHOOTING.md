# 🔧 Troubleshooting Guide - FuelMeter

Panduan untuk mengatasi masalah umum yang mungkin terjadi saat setup dan penggunaan aplikasi.

## 🗄️ Database Issues

### Error: "column reference is ambiguous"

**Penyebab:** Referensi kolom yang tidak jelas dalam query SQL.

**Solusi:**
1. Gunakan script `recalculate-distance-simple.sql` yang sudah diperbaiki
2. Pastikan semua referensi kolom menggunakan alias yang jelas

### Error: "relation fuel_records does not exist"

**Penyebab:** Tabel belum dibuat di database.

**Solusi:**
1. Jalankan `supabase-setup-simple.sql` terlebih dahulu
2. Cek di Table Editor apakah tabel sudah terbuat

### Error: "column odometer_km does not exist"

**Penyebab:** Database lama tanpa kolom odometer.

**Solusi:**
1. Jalankan `add-distance-columns.sql` untuk menambah kolom
2. Jalankan `recalculate-distance-simple.sql` untuk update data

## 🔐 Authentication Issues

### Error: "Invalid API key"

**Penyebab:** Environment variables tidak benar.

**Solusi:**
1. Cek file `.env.local`
2. Pastikan URL dan Anon Key sudah benar
3. Restart development server

### Error: "User not found"

**Penyebab:** User belum terdaftar atau session expired.

**Solusi:**
1. Register user baru
2. Login ulang
3. Cek Supabase Auth settings

## 📱 UI/UX Issues

### Text input tidak terlihat

**Penyebab:** Masalah styling atau kontras warna.

**Solusi:**
1. Refresh browser
2. Cek browser developer tools untuk error CSS
3. Pastikan Tailwind CSS sudah ter-load dengan benar

### Form tidak berfungsi

**Penyebab:** JavaScript error atau network issue.

**Solusi:**
1. Cek browser console untuk error
2. Pastikan Supabase connection aktif
3. Cek network connectivity

## 🚀 Deployment Issues

### Error saat build

**Penyebab:** TypeScript error atau missing dependencies.

**Solusi:**
1. Jalankan `npm install` untuk install dependencies
2. Cek TypeScript errors dengan `npm run build`
3. Pastikan semua environment variables sudah diset

### Error saat runtime

**Penyebab:** Environment variables tidak tersedia di production.

**Solusi:**
1. Set environment variables di platform deployment (Vercel, Netlify, dll)
2. Pastikan nama variable sama dengan yang di `.env.local`

## 📊 Data Issues

### Jarak tempuh tidak terhitung

**Penyebab:** Odometer tidak diisi atau perhitungan salah.

**Solusi:**
1. Pastikan odometer diisi dengan benar
2. Jalankan `recalculate-distance-simple.sql` untuk update data
3. Cek apakah odometer terakhir sudah benar

### Statistik tidak akurat

**Penyebab:** Data lama atau perhitungan error.

**Solusi:**
1. Refresh halaman dashboard
2. Cek data di Supabase Table Editor
3. Jalankan script recalculation jika perlu

## 🔧 Script SQL Troubleshooting

### Script tidak berjalan

**Penyebab:** Syntax error atau permission issue.

**Solusi:**
1. Jalankan script per bagian
2. Cek error message di Supabase SQL Editor
3. Pastikan user memiliki permission yang cukup

### Data tidak terupdate

**Penyebab:** WHERE clause tidak match atau data kosong.

**Solusi:**
1. Cek apakah ada data di tabel
2. Jalankan SELECT query terlebih dahulu untuk verifikasi
3. Pastikan kondisi WHERE sudah benar

## 📞 Getting Help

Jika masalah masih berlanjut:

1. **Cek Logs:** Browser console dan Supabase logs
2. **Documentation:** Baca README.md dan QUICK_START.md
3. **Community:** Tanyakan di forum atau GitHub issues
4. **Support:** Hubungi tim support jika diperlukan

## 🎯 Common Solutions

### Reset Database (Hati-hati!)
```sql
-- Hapus semua data (irreversible!)
DELETE FROM fuel_records;
```

### Recreate Table
```sql
-- Drop dan recreate table
DROP TABLE IF EXISTS fuel_records;
-- Jalankan supabase-setup-simple.sql
```

### Check Data
```sql
-- Cek data yang ada
SELECT * FROM fuel_records ORDER BY created_at DESC LIMIT 10;
```

---

**Tips:** Selalu backup data sebelum menjalankan script yang mengubah struktur database! 