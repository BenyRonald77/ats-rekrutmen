import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/format";
import { validateTransition } from "@/lib/pipeline";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "id tidak valid" }, { status: 400 });
  const body = await req.json().catch(() => null);
  const ke = body?.ke?.toString();
  if (!ke) return NextResponse.json({ error: "tahap tujuan (ke) wajib diisi" }, { status: 400 });

  const c = await prisma.candidate.findUnique({ where: { id } });
  if (!c) return NextResponse.json({ error: "kandidat tidak ditemukan" }, { status: 404 });

  const err = validateTransition(c.tahap, ke);
  if (err) return NextResponse.json({ error: err }, { status: 422 });

  const waktu = nowIso();
  const updated = await prisma.candidate.update({
    where: { id },
    data: {
      tahap: ke,
      histories: {
        create: {
          dari: c.tahap,
          ke,
          waktu,
          oleh: body?.oleh?.toString() ?? "",
          catatan: body?.catatan?.toString() ?? "",
        },
      },
    },
    include: { histories: { orderBy: { id: "desc" }, take: 1 } },
  });
  return NextResponse.json(updated);
}
