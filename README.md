# FuelMeter - Aplikasi Pencatatan Bahan Bakar

Aplikasi web untuk mencatat dan mengelola data pengisian bahan bakar dengan Next.js 15, Supabase, dan desain mobile-first.

## Fitur

- 🔐 **Autentikasi** - Login dan register menggunakan Supabase Auth
- 📱 **Mobile-First Design** - Responsif untuk semua ukuran layar
- ⛽ **Pencatatan Bahan Bakar** - Tambah, lihat, dan hapus catatan pengisian
- 📊 **Dashboard** - Statistik dan ringkasan penggunaan bahan bakar
- 🎨 **UI Modern** - Desain yang bersih dan mudah digunakan
- 🔒 **Keamanan** - Autentikasi yang aman dengan Supabase

## Teknologi yang Digunakan

- **Next.js 15** - Framework React terbaru
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling utility-first
- **Supabase** - Backend as a Service (Auth & Database)
- **Lucide React** - Icon library
- **clsx & tailwind-merge** - Utility untuk class names

## Setup dan Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd fuelmeter
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

1. Buat akun di [Supabase](https://supabase.com)
2. Buat project baru
3. Dapatkan URL dan Anon Key dari Settings > API
4. Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Setup Database

**Cara 1: Setup Database Baru (Recommended)**

1. Buka Supabase Dashboard > SQL Editor
2. Copy dan paste isi file `supabase-setup-simple.sql` ke SQL Editor
3. Klik "Run" untuk menjalankan script

**Cara 2: Update Database yang Sudah Ada**

Jika Anda sudah memiliki tabel `fuel_records` tanpa kolom odometer:
1. Jalankan `add-distance-columns.sql` untuk menambah kolom baru
2. Jalankan `add-user-settings.sql` untuk menambah tabel pengaturan user
3. Jalankan `recalculate-distance-simple.sql` untuk menghitung ulang jarak

**Cara 3: Manual Setup**

Jalankan SQL berikut di Supabase SQL Editor:

```sql
-- Buat tabel fuel_records
CREATE TABLE IF NOT EXISTS fuel_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  fuel_type TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  price_per_liter DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aktifkan Row Level Security
ALTER TABLE fuel_records ENABLE ROW LEVEL SECURITY;

-- Buat policy untuk user hanya bisa akses data mereka sendiri
CREATE POLICY "Users can view own fuel records" ON fuel_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fuel records" ON fuel_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fuel records" ON fuel_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fuel records" ON fuel_records
  FOR DELETE USING (auth.uid() = user_id);

-- Buat trigger untuk auto-set user_id
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_fuel_record_created
  BEFORE INSERT ON fuel_records
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

### 5. Jalankan Aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Struktur Aplikasi

```
src/
├── app/                    # App Router (Next.js 15)
│   ├── login/             # Halaman login
│   ├── register/          # Halaman register
│   ├── dashboard/         # Dashboard utama
│   │   ├── add-record/    # Tambah catatan
│   │   └── records/       # Lihat semua catatan
│   └── page.tsx           # Halaman utama (redirect)
├── components/
│   └── ui/                # Komponen UI reusable
│       ├── button.tsx
│       ├── input.tsx
│       └── card.tsx
└── lib/
    ├── supabase.ts        # Konfigurasi Supabase
    └── utils.ts           # Utility functions
```

## Halaman dan Fitur

### 1. Login (`/login`)
- Form login dengan email dan password
- Validasi input
- Redirect ke dashboard setelah login berhasil

### 2. Register (`/register`)
- Form pendaftaran dengan validasi
- Konfirmasi password
- Auto-redirect ke login setelah register

### 3. Dashboard (`/dashboard`)
- Statistik penggunaan bahan bakar
- Quick actions untuk tambah dan lihat catatan
- Daftar catatan terbaru
- Logout functionality

### 4. Tambah Catatan (`/dashboard/add-record`)
- Form untuk menambah catatan baru
- Modal odometer awal untuk user baru
- Input odometer untuk perhitungan jarak otomatis
- Kalkulasi otomatis total biaya dan biaya per km
- Validasi input
- Pilihan jenis bahan bakar

### 5. Semua Catatan (`/dashboard/records`)
- Daftar semua catatan dengan detail odometer
- Informasi jarak tempuh dan biaya per km
- Fungsi edit dan hapus catatan
- Ringkasan statistik
- Sorting berdasarkan tanggal terbaru

### 6. Edit Catatan (`/dashboard/edit-record/[id]`)
- Form edit catatan yang sudah ada
- Kalkulasi otomatis jarak dan biaya per km
- Fungsi hapus catatan
- Validasi input
- Redirect otomatis setelah edit

## Komponen UI

### Button
- Variant: primary, secondary, outline, ghost
- Size: sm, md, lg
- Loading state

### Input
- Label dan error handling
- Validasi visual
- Placeholder support

### Card
- Header, content, footer sections
- Responsive design
- Hover effects

## Styling

Aplikasi menggunakan Tailwind CSS dengan:
- Mobile-first approach
- Responsive breakpoints
- Custom color scheme
- Consistent spacing
- Modern UI patterns

## Deployment

### Vercel (Recommended)

1. Push code ke GitHub
2. Connect repository ke Vercel
3. Set environment variables di Vercel dashboard
4. Deploy otomatis

### Environment Variables untuk Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

## Keamanan

- Row Level Security (RLS) di Supabase
- User hanya bisa akses data mereka sendiri
- Validasi input di client dan server
- Secure authentication dengan Supabase Auth

## Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Support

Jika ada pertanyaan atau masalah, silakan buat issue di repository ini.
