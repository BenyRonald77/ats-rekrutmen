# ATS Rekrutmen Sederhana

Aplikasi Applicant Tracking System (ATS): kelola lowongan, pipeline kandidat
(kanban), penilaian rubrik terstruktur, dan penjadwalan interview anti-bentrok.

Stack: Next.js 14 + TypeScript + Prisma 5.22 + SQLite + Tailwind CSS.

## Cara Menjalankan

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

Buka http://localhost:3000.

## Halaman

- `/` — Dashboard: ringkasan jumlah lowongan & kandidat per tahap.
- `/lowongan` — Daftar lowongan + tambah lowongan + buka/tutup lowongan.
- `/lowongan/[id]` — Board kanban per tahap; pindah tahap kandidat via tombol.
- `/kandidat/[id]` — Detail kandidat: info, timeline riwayat tahap, penilaian
  rubrik + agregat, jadwal interview, tambah slot kosong, submit skor.
- `/jadwal` — Penjadwalan: pilih kandidat + pewawancara, cari slot yang cocok,
  lalu booking.

## API

| Method | Endpoint | Keterangan |
|---|---|---|
| GET/POST | `/api/jobs` | Daftar & buat lowongan |
| GET/PATCH | `/api/jobs/[id]` | Detail (+kandidat) & ubah lowongan |
| GET/POST | `/api/candidates` | Daftar (filter `jobId`, `tahap`) & buat kandidat |
| GET | `/api/candidates/[id]` | Detail + timeline + agregat skor + interview |
| POST | `/api/candidates/[id]/stage` | Pindah tahap (validasi transisi) |
| GET/POST | `/api/rubric` | Master rubrik |
| GET/POST | `/api/scores` | Daftar & submit lembar skor |
| GET | `/api/scores/aggregate?candidateId=` | Agregat penilaian |
| GET/POST | `/api/interviewers` | Daftar & tambah pewawancara |
| POST | `/api/interviewers/[id]/slots` | Tambah slot ketersediaan pewawancara |
| POST | `/api/candidates/[id]/slots` | Tambah slot kosong kandidat |
| POST | `/api/interviews/search` | Cari slot cocok (irisan + anti-bentrok) |
| POST | `/api/interviews/book` | Booking interview (atomik) |
| GET | `/api/interviews` | Daftar interview (filter `candidateId`, `interviewerId`) |

## Aturan bisnis penting

- Transisi tahap hanya ke tahap **berikutnya** atau ke `ditolak`; tidak bisa
  loncat/mundur; `hired`/`ditolak` terminal.
- Satu pewawancara hanya bisa menilai 1x per kandidat+tahap (409 jika ganda).
- Booking interview atomik di level SQL: slot yang sama tidak bisa dibooking 2x.
