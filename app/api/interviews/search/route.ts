import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findMatches } from "@/lib/schedule";

/**
 * Cari slot interview yang cocok:
 * irisan ketersediaan interviewer & slot kosong kandidat,
 * dikurangi waktu yang sudah bentrok dengan interview terjadwal.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const candidateId = Number(body?.candidateId);
  const interviewerId = Number(body?.interviewerId);
  const durasi = body?.durasi === undefined ? 60 : Number(body?.durasi);
  if (!Number.isInteger(candidateId) || !Number.isInteger(interviewerId)) {
    return NextResponse.json({ error: "candidateId dan interviewerId wajib diisi" }, { status: 400 });
  }
  if (!Number.isInteger(durasi) || durasi < 30 || durasi > 240) {
    return NextResponse.json({ error: "durasi harus 30-240 menit" }, { status: 422 });
  }
  const [candidate, interviewer] = await Promise.all([
    prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { availabilities: true },
    }),
    prisma.interviewer.findUnique({
      where: { id: interviewerId },
      include: { slots: true },
    }),
  ]);
  if (!candidate) return NextResponse.json({ error: "kandidat tidak ditemukan" }, { status: 404 });
  if (!interviewer) return NextResponse.json({ error: "pewawancara tidak ditemukan" }, { status: 404 });

  const existing = await prisma.interview.findMany({
    where: { OR: [{ candidateId }, { interviewerId }] },
  });
  const cocok = findMatches(candidate.availabilities, interviewer.slots, existing, candidateId, interviewerId, durasi);
  return NextResponse.json({ candidateId, interviewerId, durasi, cocok });
}
