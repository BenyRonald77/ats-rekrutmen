import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/format";
import { validHHMM, validTanggal } from "@/lib/schedule";

/**
 * Booking interview ATOMIK: satu statement INSERT ... SELECT ... WHERE
 * yang hanya berhasil jika (a) window muat di slot interviewer,
 * (b) window muat di slot kandidat, dan (c) tidak ada interview lain
 * yang overlap untuk interviewer maupun kandidat. Jika kondisi gagal,
 * 0 row terpengaruh -> 409.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const candidateId = Number(body?.candidateId);
  const interviewerId = Number(body?.interviewerId);
  const tanggal = body?.tanggal?.toString();
  const mulai = body?.mulai?.toString();
  const selesai = body?.selesai?.toString();
  if (!Number.isInteger(candidateId) || !Number.isInteger(interviewerId)) {
    return NextResponse.json({ error: "candidateId dan interviewerId wajib diisi" }, { status: 400 });
  }
  if (!validTanggal(tanggal) || !validHHMM(mulai) || !validHHMM(selesai) || mulai >= selesai) {
    return NextResponse.json({ error: "tanggal/jam tidak valid atau selesai <= mulai" }, { status: 422 });
  }
  const [candidate, interviewer] = await Promise.all([
    prisma.candidate.findUnique({ where: { id: candidateId } }),
    prisma.interviewer.findUnique({ where: { id: interviewerId } }),
  ]);
  if (!candidate) return NextResponse.json({ error: "kandidat tidak ditemukan" }, { status: 404 });
  if (!interviewer) return NextResponse.json({ error: "pewawancara tidak ditemukan" }, { status: 404 });

  const affected = await prisma.$executeRaw`
    INSERT INTO "Interview" ("candidateId", "interviewerId", "tanggal", "mulai", "selesai", "catatan", "createdAt")
    SELECT ${candidateId}, ${interviewerId}, ${tanggal}, ${mulai}, ${selesai}, ${body?.catatan?.toString() ?? ""}, ${nowIso()}
    WHERE EXISTS (
      SELECT 1 FROM "InterviewerSlot"
      WHERE "interviewerId" = ${interviewerId} AND "tanggal" = ${tanggal}
        AND "mulai" <= ${mulai} AND "selesai" >= ${selesai}
    )
    AND EXISTS (
      SELECT 1 FROM "CandidateSlot"
      WHERE "candidateId" = ${candidateId} AND "tanggal" = ${tanggal}
        AND "mulai" <= ${mulai} AND "selesai" >= ${selesai}
    )
    AND NOT EXISTS (
      SELECT 1 FROM "Interview"
      WHERE "tanggal" = ${tanggal}
        AND ("interviewerId" = ${interviewerId} OR "candidateId" = ${candidateId})
        AND "mulai" < ${selesai} AND "selesai" > ${mulai}
    )`;

  if (Number(affected) === 0) {
    return NextResponse.json(
      { error: "slot tidak bisa dibooking: bentrok dengan jadwal lain atau di luar ketersediaan" },
      { status: 409 }
    );
  }
  const created = await prisma.interview.findFirst({
    where: { candidateId, interviewerId, tanggal, mulai, selesai },
    orderBy: { id: "desc" },
  });
  return NextResponse.json(created, { status: 201 });
}
