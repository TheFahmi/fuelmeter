# FuelMeter - Aplikasi Pencatatan Bahan Bakar

Aplikasi web mobile-first untuk mencatat dan mengelola pengeluaran bahan bakar kendaraan dengan fitur autentikasi menggunakan Supabase.

## 🚀 Live Demo

**Aplikasi sudah di-deploy di Vercel:**
- **URL:** [https://fuelmeter-thefahmi.vercel.app](https://fuelmeter-thefahmi.vercel.app)
- **Status:** ✅ Production Ready

## ✨ Fitur

- 🔐 **Autentikasi** - Login dan register menggunakan Supabase
- 📱 **Mobile First** - Desain responsif untuk mobile dan desktop
- 📊 **Dashboard** - Statistik pengeluaran bahan bakar
- ➕ **Tambah Record** - Form untuk menambah catatan bahan bakar
- 📋 **Lihat Records** - Daftar semua catatan bahan bakar
- ✏️ **Edit Record** - Edit catatan yang sudah ada
- 🧮 **Hitung Biaya per KM** - Kalkulasi otomatis biaya per kilometer
- 📏 **Odometer Tracking** - Tracking jarak berdasarkan odometer
- 🌙 **Dark Mode** - Tema gelap dan terang
- 📈 **Statistik Lengkap** - Analisis pengeluaran dan efisiensi
- 🍔 **Burger Menu** - Menu navigasi yang smooth

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Icons:** Lucide React
- **Language:** TypeScript
- **Deployment:** Vercel

## 🚀 Setup Cepat

### 1. Clone Repository
```bash
git clone https://github.com/TheFahmi/fuelmeter.git
cd fuelmeter
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
```bash
cp env.example .env.local
```
Edit `.env.local` dan isi dengan Supabase credentials Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Setup Database
- Buka [Supabase Dashboard](https://supabase.com/dashboard)
- Buat project baru atau gunakan yang sudah ada
- Jalankan SQL script dari `supabase-setup.sql`
- Atau gunakan `supabase-setup-simple.sql` untuk setup minimal

### 5. Run Development Server
```bash
npm run dev
```

### 6. Buka Browser
```
http://localhost:3000
```

## 🌐 Deployment

### Vercel (Recommended)

#### Cara Otomatis:
1. **Fork repository ini**
2. **Buka [vercel.com](https://vercel.com)**
3. **Import project dari GitHub**
4. **Connect repository `TheFahmi/fuelmeter`**
5. **Setup Environment Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. **Deploy!** - Vercel akan otomatis deploy setiap push

#### Cara Manual:
1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login ke Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

### Environment Variables untuk Production

Pastikan environment variables sudah diset di Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 📊 Database Schema

### Tabel `fuel_records`
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- date (date)
- fuel_type (text)
- quantity (numeric)
- price_per_liter (numeric)
- total_cost (numeric)
- odometer_km (numeric)
- distance_km (numeric, calculated)
- cost_per_km (numeric, calculated)
- created_at (timestamp)
- updated_at (timestamp)
```

### Tabel `user_settings`
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- initial_odometer (numeric)
- created_at (timestamp)
- updated_at (timestamp)
```

## 📁 Struktur Project

```
fuelmeter/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── dashboard/          # Dashboard pages
│   │   │   ├── add-record/     # Add fuel record
│   │   │   ├── edit-record/    # Edit fuel record
│   │   │   ├── records/        # View all records
│   │   │   └── statistics/     # Statistics page
│   │   ├── login/             # Login page
│   │   ├── register/          # Register page
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable components
│   │   ├── ui/               # UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── menu.tsx
│   │   │   └── loading.tsx
│   │   └── initial-odometer-modal.tsx
│   ├── contexts/             # React contexts
│   │   └── theme-context.tsx # Dark mode context
│   └── lib/                  # Utilities
│       ├── supabase.ts       # Supabase client
│       └── utils.ts          # Utility functions
├── supabase-setup.sql        # Database setup
├── vercel.json              # Vercel configuration
├── tailwind.config.js       # Tailwind config
├── env.example              # Environment template
└── README.md               # Documentation
```

## 🎯 Fitur Utama

### 1. 🔐 Autentikasi
- Login dengan email/password
- Register user baru
- Session management dengan Supabase
- Row Level Security (RLS)

### 2. 📊 Dashboard
- Statistik total pengeluaran
- Rata-rata harga per liter
- Total jarak tempuh
- Biaya per kilometer
- Quick actions untuk navigasi

### 3. 📝 Manajemen Record
- Tambah record baru dengan form lengkap
- Lihat semua record dalam format card
- Edit record yang sudah ada
- Kalkulasi otomatis biaya per km

### 4. 📏 Odometer Tracking
- Input odometer untuk setiap pengisian
- Kalkulasi jarak otomatis
- Modal untuk input odometer awal

### 5. 🌙 Dark Mode
- Toggle tema gelap/terang
- Persistensi preferensi user
- Transisi smooth antar tema

### 6. 📈 Statistik
- Filter berdasarkan periode (1 bulan, 3 bulan, 6 bulan, 1 tahun, semua)
- Analisis bulanan
- Perbandingan jenis bahan bakar
- Metrik efisiensi

### 7. 🍔 Burger Menu
- Menu navigasi yang smooth
- Animasi slide dari kanan
- Responsive design

## 🔧 Troubleshooting

Lihat file `TROUBLESHOOTING.md` untuk solusi masalah umum:

- **Database Connection Issues**
- **Authentication Problems**
- **Build Errors**
- **Deployment Issues**

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Contact

- **GitHub:** [@TheFahmi](https://github.com/TheFahmi)
- **Project Link:** [https://github.com/TheFahmi/fuelmeter](https://github.com/TheFahmi/fuelmeter)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React Framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework
- [Vercel](https://vercel.com/) - Deployment Platform
- [Lucide React](https://lucide.dev/) - Icon Library

---

⭐ **Jika project ini membantu Anda, jangan lupa berikan star!**
