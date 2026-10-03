# REY MODDER — MOD • UPDATE • SHARE

Website katalog aplikasi Android & tools terkurasi, cepat, dan aman dengan panel manajemen admin lengkap.

## Fitur Utama

- **Katalog Publik Real-Time**: Tampilan dark modern, mobile-first, responsive, kategori dinamis dari database.
- **Pencarian Real-Time**: Debounced search berdasarkan nama, deskripsi, kategori, versi, filter kategori, dan multi-sorting (Terbaru, Terlama, A-Z, Z-A).
- **Halaman Detail Aplikasi**: Logo, screenshot gallery, fitur utama, changelog/what's new, info ukuran & versi, serta tombol download aman.
- **Sistem Download Aman**: Validasi URL, pencatatan statistik download log, anti-abuse.
- **Saluran WhatsApp**: Integrasi resmi ke saluran https://whatsapp.com/channel/0029VbE5QaB9MF90lmAtrq39.
- **Admin Panel (/admin)**:
  - Autentikasi aman (Argon2/bcrypt hashing, secure HTTP-only cookies, session validation, rate limiting).
  - Dashboard statistik real-time (Total apps, kategori, published, draft, featured, download count).
  - Manajemen Aplikasi (Tambah, Edit, Hapus, Quick Toggle Publish/Unpublish, Quick Toggle Featured).
  - Manajemen Kategori (Tambah, Edit, Hapus dengan perlindungan pemindahan aplikasi ke kategori 'Lainnya').
  - Pengaturan Website (Nama, tagline, deskripsi, tautan WhatsApp, pengumuman, serta ganti username & password admin).

## Langkah Instalasi & Menjalankan

### 1. Install Dependencies
```bash
npm install
```

### 2. Konfigurasi Lingkungan (.env)
Salin contoh berkas konfigurasi:
```bash
cp .env.example .env
```
Sesuaikan variabel lingkungan di `.env` jika diperlukan (default telah disiapkan untuk langsung jalan).

### 3. Setup Database & Seeding
Database akan otomatis terinisialisasi dan di-seed saat server pertama kali dijalankan. Untuk menjalankan seed manual:
```bash
npx tsx src/db/seed.ts
```

Credential default admin:
- **Username**: `adminrey`
- **Password**: `adminreykece`

*(Dapat langsung diubah melalui menu Settings di panel admin)*

### 4. Jalankan Development Server
```bash
npm run dev
```
Akses di browser pada `http://localhost:3000`.

### 5. Build Production
```bash
npm run build
```

### 6. Menjalankan di Production
```bash
npm run start
```
Server Express akan menyajikan aplikasi frontend dan REST API pada port 3000.
