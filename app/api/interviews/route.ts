import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const where: Record<string, unknown> = {};
  for (const k of ["candidateId", "interviewerId"] as const) {
    const v = searchParams.get(k);
    if (v) {
      const n = Number(v);
      if (!Number.isInteger(n)) return NextResponse.json({ error: `${k} tidak valid` }, { status: 400 });
      where[k] = n;
    }
  }
  const rows = await prisma.interview.findMany({
    where,
    orderBy: [{ tanggal: "asc" }, { mulai: "asc" }],
    include: { candidate: true, interviewer: true },
  });
  return NextResponse.json(rows);
}
