import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function idParam(p: { id: string }) {
  const id = Number(p.id);
  return Number.isInteger(id) ? id : null;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = idParam(params);
  if (id === null) return NextResponse.json({ error: "id tidak valid" }, { status: 400 });
  const c = await prisma.candidate.findUnique({
    where: { id },
    include: {
      job: true,
      histories: { orderBy: { id: "asc" } },
      scoreSheets: {
        orderBy: { id: "asc" },
        include: { interviewer: true, scores: { include: { criterion: true } } },
      },
      interviews: { orderBy: [{ tanggal: "asc" }, { mulai: "asc" }], include: { interviewer: true } },
      availabilities: { orderBy: [{ tanggal: "asc" }, { mulai: "asc" } ] },
    },
  });
  if (!c) return NextResponse.json({ error: "kandidat tidak ditemukan" }, { status: 404 });
  return NextResponse.json(c);
}
