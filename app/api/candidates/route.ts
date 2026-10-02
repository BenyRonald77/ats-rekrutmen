import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/format";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const where: Record<string, unknown> = {};
  const jobId = searchParams.get("jobId");
  const tahap = searchParams.get("tahap");
  if (jobId) {
    const n = Number(jobId);
    if (!Number.isInteger(n)) return NextResponse.json({ error: "jobId tidak valid" }, { status: 400 });
    where.jobId = n;
  }
  if (tahap) where.tahap = tahap;
  const rows = await prisma.candidate.findMany({
    where,
    orderBy: { id: "asc" },
    include: { job: { select: { id: true, judul: true } } },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const nama = body?.nama?.toString().trim();
  const email = body?.email?.toString().trim();
  const jobId = Number(body?.jobId);
  if (!nama || !email || !Number.isInteger(jobId)) {
    return NextResponse.json({ error: "nama, email, dan jobId wajib diisi" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "format email tidak valid" }, { status: 422 });
  }
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return NextResponse.json({ error: "lowongan tidak ditemukan" }, { status: 404 });
  if (job.status !== "buka") {
    return NextResponse.json({ error: "lowongan sudah tutup, tidak bisa menerima lamaran" }, { status: 409 });
  }
  try {
    const c = await prisma.candidate.create({
      data: {
        nama,
        email,
        telepon: body?.telepon?.toString() ?? "",
        cv: body?.cv?.toString() ?? "",
        jobId,
        tahap: "melamar",
        createdAt: nowIso(),
        histories: {
          create: { dari: "-", ke: "melamar", waktu: nowIso(), oleh: body?.oleh?.toString() ?? "", catatan: "Lamaran diterima" },
        },
      },
    });
    return NextResponse.json(c, { status: 201 });
  } catch (e) {
    if (String(e).includes("Unique constraint")) {
      return NextResponse.json({ error: "email kandidat sudah terdaftar" }, { status: 409 });
    }
    throw e;
  }
}
