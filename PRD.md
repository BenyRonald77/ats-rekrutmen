# PRD — ATS Rekrutmen Sederhana (`ats-rekrutmen`)

## Ringkasan
Aplikasi Applicant Tracking System (ATS) sederhana untuk mengelola proses rekrutmen:
lowongan pekerjaan, kandidat, pipeline tahapan seleksi (kanban), penilaian rubrik
terstruktur oleh pewawancara, dan penjadwalan interview anti-bentrok.

## Stack
Next.js 14 (App Router) + TypeScript + Prisma 5.22 + SQLite + Tailwind CSS.
Tanggal disimpan sebagai TEXT `YYYY-MM-DD`, jam sebagai TEXT `HH:MM`,
timestamp sebagai TEXT ISO (hindari drama timezone). ID integer autoincrement.

## Entitas

### Lowongan (Job)
- `judul`, `departemen`, `deskripsi`, `syarat` (teks)
- `status`: `buka` | `tutup` (default `buka`)
- `tanggalMulai`: TEXT `YYYY-MM-DD` (opsional)

### Kandidat (Candidate)
- `nama`, `email` (unik), `telepon`, `cv` (link/file teks)
- `jobId` → Lowongan yang dilamar
- `tahap`: tahap pipeline saat ini

### Pipeline (tahapan, berurutan)
1. `melamar` → 2. `screening` → 3. `interview` → 4. `penawaran` → 5. `hired`
- Status terminal khusus: `ditolak` (bisa dari tahap mana pun, kecuali `hired`/`ditolak`).
- Transisi sah: hanya ke tahap **berikutnya** atau ke `ditolak`. Tidak boleh
  loncat (mis. `melamar` → `penawaran` = 422), tidak boleh mundur, tidak boleh
  keluar dari status terminal.
- Setiap perpindahan dicatat di **Riwayat Tahap**: tahap asal, tahap tujuan,
  waktu (ISO), oleh siapa, catatan → timeline per kandidat.

### Rubrik Penilaian
- Master rubrik: kriteria + bobot (mis. Pengalaman 30, Komunikasi 25,
  Problem Solving 25, Kesesuaian Budaya 20). Total bobot tidak harus 100
  (agregat dinormalisasi), tapi tiap bobot > 0.
- Setiap pewawancara memberi skor per kriteria untuk satu kandidat pada satu
  tahap (tahap `interview`). Skor rentang 0–100.
- **Validasi**: pewawancara tidak bisa menilai 2x untuk kombinasi
  kandidat + pewawancara + tahap yang sama → 409.
- **Agregat**: rata-rata terbobot per pewawancara
  `Σ(skor × bobot) / Σ(bobot)`, lalu agregat antar pewawancara = rata-rata
  dari skor terbobot tiap pewawancara (juga rata-rata per kriteria).

### Penjadwalan Interview
- Pewawancara punya **slot ketersediaan** (tanggal, jam mulai–selesai).
- Kandidat punya **slot kosong** (tanggal, jam mulai–selesai).
- Endpoint **cari slot cocok**: slot kandidat berdurasi ≥ 60 menit yang
  irisannya dengan slot interviewer ≥ 60 menit, DAN tidak bentrok dengan
  interview lain yang sudah terjadwal (baik untuk interviewer maupun kandidat).
- **Booking atomik**: single-statement `INSERT ... SELECT ... WHERE NOT EXISTS`
  (overlap check di level SQL) — slot yang sama tidak bisa dibooking 2x,
  dibuktikan dengan test konkurensi (409 pada booking kedua).

## API
| Method | Endpoint | Fungsi |
|---|---|---|
| GET/POST | `/api/jobs` | Daftar & buat lowongan |
| GET/PATCH | `/api/jobs/[id]` | Detail (+ kandidat) & ubah (mis. tutup) |
| GET/POST | `/api/candidates` | Daftar (filter `jobId`, `tahap`) & buat kandidat |
| GET | `/api/candidates/[id]` | Detail: info, timeline, agregat skor, interview |
| POST | `/api/candidates/[id]/stage` | Pindah tahap (validasi transisi) |
| GET/POST | `/api/rubric` | Master rubrik: daftar & tambah kriteria |
| GET/POST | `/api/scores` | Daftar lembar skor (filter `candidateId`) & submit skor |
| GET | `/api/scores/aggregate?candidateId=` | Agregat penilaian |
| GET/POST | `/api/interviewers` | Daftar & tambah pewawancara |
| POST | `/api/interviewers/[id]/slots` | Tambah slot ketersediaan pewawancara |
| POST | `/api/candidates/[id]/slots` | Tambah slot kosong kandidat |
| POST | `/api/interviews/search` | Cari slot cocok |
| POST | `/api/interviews/book` | Booking interview (atomik) |
| GET | `/api/interviews?candidateId=` | Daftar interview |

## UI (Bahasa Indonesia)
- `/` — Dashboard: ringkasan lowongan & kandidat per tahap + daftar lowongan.
- `/lowongan` — Daftar lowongan + form tambah; tutup/buka lowongan.
- `/lowongan/[id]` — **Board kanban** per tahap; pindah tahap via tombol
  (validasi di server, error ditampilkan).
- `/kandidat/[id]` — Detail kandidat: info, timeline riwayat tahap, penilaian
  + agregat, jadwal interview, form tambah slot kosong & submit skor.
- `/jadwal` — Penjadwalan: pilih kandidat + pewawancara, cari slot cocok,
  booking.

## Seed
2 lowongan, 7 kandidat tersebar di tiap tahap (termasuk 1 ditolak), 3 pewawancara
dengan slot ketersediaan, contoh penilaian rubrik, 1 interview terjadwal.

## Aturan non-fungsional
- `npm run build` wajib lolos.
- Tanpa atribusi AI di commit/repo. Identitas git lokal: BenyRonald77.
