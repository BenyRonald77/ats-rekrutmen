import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/format";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const candidateId = searchParams.get("candidateId");
  const where: Record<string, unknown> = {};
  if (candidateId) {
    const n = Number(candidateId);
    if (!Number.isInteger(n)) return NextResponse.json({ error: "candidateId tidak valid" }, { status: 400 });
    where.candidateId = n;
  }
  const sheets = await prisma.scoreSheet.findMany({
    where,
    orderBy: { id: "asc" },
    include: { interviewer: true, scores: { include: { criterion: true } } },
  });
  return NextResponse.json(sheets);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const candidateId = Number(body?.candidateId);
  const interviewerId = Number(body?.interviewerId);
  const tahap = body?.tahap?.toString() ?? "interview";
  const skorArr = body?.scores;
  if (!Number.isInteger(candidateId) || !Number.isInteger(interviewerId)) {
    return NextResponse.json({ error: "candidateId dan interviewerId wajib diisi" }, { status: 400 });
  }
  if (!Array.isArray(skorArr) || skorArr.length === 0) {
    return NextResponse.json({ error: "scores wajib berupa array tidak kosong" }, { status: 400 });
  }
  const [candidate, interviewer, criteria] = await Promise.all([
    prisma.candidate.findUnique({ where: { id: candidateId } }),
    prisma.interviewer.findUnique({ where: { id: interviewerId } }),
    prisma.rubricCriterion.findMany({ orderBy: { id: "asc" } }),
  ]);
  if (!candidate) return NextResponse.json({ error: "kandidat tidak ditemukan" }, { status: 404 });
  if (!interviewer) return NextResponse.json({ error: "pewawancara tidak ditemukan" }, { status: 404 });
  if (criteria.length === 0) {
    return NextResponse.json({ error: "master rubrik masih kosong" }, { status: 422 });
  }

  // Validasi: skor harus mencakup SEMUA kriteria master, rentang 0-100
  const critIds = new Set(criteria.map((c) => c.id));
  const seen = new Set<number>();
  for (const s of skorArr) {
    const cid = Number(s?.criterionId);
    const skor = Number(s?.skor);
    if (!Number.isInteger(cid) || !critIds.has(cid)) {
      return NextResponse.json({ error: `criterionId ${s?.criterionId} tidak dikenal` }, { status: 422 });
    }
    if (seen.has(cid)) return NextResponse.json({ error: `kriteria ${cid} duplikat` }, { status: 422 });
    seen.add(cid);
    if (!Number.isFinite(skor) || skor < 0 || skor > 100) {
      return NextResponse.json({ error: `skor kriteria ${cid} harus 0-100` }, { status: 422 });
    }
  }
  if (seen.size !== critIds.size) {
    return NextResponse.json({ error: "skor harus mencakup semua kriteria rubrik" }, { status: 422 });
  }

  try {
    const sheet = await prisma.scoreSheet.create({
      data: {
        candidateId,
        interviewerId,
        tahap,
        waktu: nowIso(),
        scores: {
          create: skorArr.map((s: { criterionId: number; skor: number }) => ({
            criterionId: Number(s.criterionId),
            skor: Number(s.skor),
          })),
        },
      },
      include: { scores: { include: { criterion: true } }, interviewer: true },
    });
    return NextResponse.json(sheet, { status: 201 });
  } catch (e) {
    if (String(e).includes("Unique constraint")) {
      return NextResponse.json(
        { error: "pewawancara sudah menilai kandidat ini pada tahap tersebut" },
        { status: 409 }
      );
    }
    throw e;
  }
}
