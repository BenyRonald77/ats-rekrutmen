import { PrismaClient } from "@prisma/client";
import { TAHAP_ORDER } from "../lib/format";

const prisma = new PrismaClient();
const now = () => new Date().toISOString();
const past = (daysAgo: number, hhmm = "09:00") => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${hhmm}:00.000Z`;
};

async function main() {
  const n = await prisma.job.count();
  if (n > 0) {
    console.log("seed dilewati (sudah ada data)");
    return;
  }

  // ---- Master rubrik ----
  const rubrik = await prisma.rubricCriterion.createMany({
    data: [
      { nama: "Pengalaman", bobot: 30 },
      { nama: "Komunikasi", bobot: 25 },
      { nama: "Problem Solving", bobot: 25 },
      { nama: "Kesesuaian Budaya", bobot: 20 },
    ],
  });
  const criteria = await prisma.rubricCriterion.findMany({ orderBy: { id: "asc" } });
  console.log("rubrik:", rubrik.count);

  // ---- Pewawancara ----
  const [sinta, budi, dewi] = await Promise.all(
    [
      { nama: "Sinta Rahma", email: "sinta@perusahaan.id" },
      { nama: "Budi Santoso", email: "budi@perusahaan.id" },
      { nama: "Dewi Anggraini", email: "dewi@perusahaan.id" },
    ].map((d) => prisma.interviewer.create({ data: d }))
  );

  // Slot ketersediaan pewawancara (2026-10-05 s.d. 2026-10-07)
  for (const iv of [sinta, budi, dewi]) {
    for (const tgl of ["2026-10-05", "2026-10-06", "2026-10-07"]) {
      await prisma.interviewerSlot.create({
        data: { interviewerId: iv.id, tanggal: tgl, mulai: "09:00", selesai: "12:00" },
      });
    }
  }
  await prisma.interviewerSlot.create({
    data: { interviewerId: sinta.id, tanggal: "2026-10-06", mulai: "13:00", selesai: "16:00" },
  });

  // ---- Lowongan ----
  const job1 = await prisma.job.create({
    data: {
      judul: "Backend Developer",
      departemen: "Engineering",
      deskripsi: "Membangun dan memelihara layanan backend perusahaan.",
      syarat: "Min. 2 tahun pengalaman Node.js/TypeScript, paham SQL.",
      status: "buka",
      tanggalMulai: "2026-10-01",
      createdAt: now(),
    },
  });
  const job2 = await prisma.job.create({
    data: {
      judul: "Digital Marketing",
      departemen: "Marketing",
      deskripsi: "Mengelola kampanye digital dan media sosial.",
      syarat: "Pengalaman iklan Meta/Google min. 1 tahun.",
      status: "buka",
      tanggalMulai: "2026-10-01",
      createdAt: now(),
    },
  });

  // ---- Kandidat tersebar di tiap tahap ----
  type CandSeed = { nama: string; email: string; telepon: string; jobId: number; tahap: string; riwayat: string[] };
  const seeds: CandSeed[] = [
    { nama: "Andi Pratama", email: "andi.pratama@mail.id", telepon: "08121110001", jobId: job1.id, tahap: "melamar", riwayat: ["melamar"] },
    { nama: "Rina Wijaya", email: "rina.wijaya@mail.id", telepon: "08121110002", jobId: job1.id, tahap: "screening", riwayat: ["melamar", "screening"] },
    { nama: "Dedi Kurniawan", email: "dedi.k@mail.id", telepon: "08121110003", jobId: job1.id, tahap: "interview", riwayat: ["melamar", "screening", "interview"] },
    { nama: "Maya Putri", email: "maya.putri@mail.id", telepon: "08121110004", jobId: job1.id, tahap: "penawaran", riwayat: ["melamar", "screening", "interview", "penawaran"] },
    { nama: "Fajar Nugroho", email: "fajar.n@mail.id", telepon: "08121110005", jobId: job1.id, tahap: "hired", riwayat: ["melamar", "screening", "interview", "penawaran", "hired"] },
    { nama: "Lina Marlina", email: "lina.m@mail.id", telepon: "08121110006", jobId: job1.id, tahap: "ditolak", riwayat: ["melamar", "screening", "ditolak"] },
    { nama: "Hendra Gunawan", email: "hendra.g@mail.id", telepon: "08121110007", jobId: job2.id, tahap: "melamar", riwayat: ["melamar"] },
    { nama: "Sari Dewi", email: "sari.dewi@mail.id", telepon: "08121110008", jobId: job2.id, tahap: "interview", riwayat: ["melamar", "screening", "interview"] },
  ];

  const candidates = [];
  for (const s of seeds) {
    const c = await prisma.candidate.create({
      data: {
        nama: s.nama,
        email: s.email,
        telepon: s.telepon,
        cv: `https://cv.contoh.id/${s.email.split("@")[0]}.pdf`,
        jobId: s.jobId,
        tahap: s.tahap,
        createdAt: past(6 - TAHAP_ORDER.indexOf(s.tahap as never)),
      },
    });
    for (let i = 0; i < s.riwayat.length; i++) {
      await prisma.stageHistory.create({
        data: {
          candidateId: c.id,
          dari: i === 0 ? "-" : s.riwayat[i - 1],
          ke: s.riwayat[i],
          waktu: past(6 - i),
          oleh: "HRD",
          catatan: i === 0 ? "Lamaran diterima" : "",
        },
      });
    }
    candidates.push(c);
  }
  console.log("kandidat:", candidates.length);

  const dedi = candidates.find((c) => c.email === "dedi.k@mail.id")!;
  const sari = candidates.find((c) => c.email === "sari.dewi@mail.id")!;

  // ---- Contoh penilaian Dedi (tahap interview, 2 pewawancara) ----
  const nilaiDedi: Record<number, number[]> = {
    [sinta.id]: [85, 80, 90, 75],
    [budi.id]: [70, 75, 80, 85],
  };
  for (const [ivId, skorArr] of Object.entries(nilaiDedi)) {
    const sheet = await prisma.scoreSheet.create({
      data: {
        candidateId: dedi.id,
        interviewerId: Number(ivId),
        tahap: "interview",
        waktu: past(1),
      },
    });
    for (let i = 0; i < criteria.length; i++) {
      await prisma.score.create({
        data: { sheetId: sheet.id, criterionId: criteria[i].id, skor: skorArr[i] },
      });
    }
  }

  // ---- Slot kosong kandidat ----
  await prisma.candidateSlot.createMany({
    data: [
      { candidateId: dedi.id, tanggal: "2026-10-06", mulai: "10:00", selesai: "12:00" },
      { candidateId: dedi.id, tanggal: "2026-10-07", mulai: "09:00", selesai: "11:00" },
      { candidateId: sari.id, tanggal: "2026-10-06", mulai: "09:30", selesai: "11:30" },
    ],
  });

  // ---- 1 interview terjadwal (Sari x Sinta) ----
  await prisma.interview.create({
    data: {
      candidateId: sari.id,
      interviewerId: sinta.id,
      tanggal: "2026-10-06",
      mulai: "10:00",
      selesai: "11:00",
      catatan: "Interview tahap 1",
      createdAt: now(),
    },
  });

  console.log("seed selesai");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
