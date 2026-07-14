# Ibra's Home Page — React + Supabase

Homepage pribadi bergaya World Wide Web retro yang dibuat dengan React, Vite,
dan Supabase.

## Menjalankan proyek

```bash
npm install
npm run dev
```

## Menghubungkan Supabase

1. Buat project gratis di Supabase.
2. Buka **SQL Editor** dan jalankan seluruh isi `supabase/schema.sql`.
3. Buka **Project Settings → API**.
4. Buat file `.env.local`, lalu masukkan Project URL dan public/anon key:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Jangan pernah memasukkan `service_role` key ke `.env.local` atau source React.

## Visitor otomatis harian

Workflow `.github/workflows/daily-visitor.yml` menambah visitor sebanyak satu
setiap hari pada pukul 00.05 WIB. Tambahkan dua repository secret melalui
**GitHub → Settings → Secrets and variables → Actions**:

- `SUPABASE_URL`: Project URL Supabase, misalnya `https://project-id.supabase.co`
- `SUPABASE_ANON_KEY`: public/anon key Supabase

Workflow juga dapat diuji secara manual melalui tab **Actions → Daily visitor
increment → Run workflow**. Setiap pengujian manual ikut menambah visitor satu.

## Production build

```bash
npm run build
npm run preview
```

Jika variabel Supabase belum tersedia, messenger dan visitor counter otomatis
berjalan dalam mode lokal. Setelah dikonfigurasi, pesan disimpan global, feed
akan menerima pesan baru secara realtime, dan visitor counter memakai fungsi
SQL atomik.
