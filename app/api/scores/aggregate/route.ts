import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aggregateSheets } from "@/lib/scores";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const candidateId = Number(searchParams.get("candidateId"));
  if (!Number.isInteger(candidateId)) {
    return NextResponse.json({ error: "candidateId wajib diisi" }, { status: 400 });
  }
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
  if (!candidate) return NextResponse.json({ error: "kandidat tidak ditemukan" }, { status: 404 });

  const sheets = await prisma.scoreSheet.findMany({
    where: { candidateId },
    orderBy: { id: "asc" },
    include: { interviewer: true, scores: { include: { criterion: true } } },
  });
  return NextResponse.json({ candidateId, ...aggregateSheets(sheets) });
}
