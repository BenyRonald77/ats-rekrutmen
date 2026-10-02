import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validHHMM, validTanggal } from "@/lib/schedule";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "id tidak valid" }, { status: 400 });
  const c = await prisma.candidate.findUnique({ where: { id } });
  if (!c) return NextResponse.json({ error: "kandidat tidak ditemukan" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const tanggal = body?.tanggal?.toString();
  const mulai = body?.mulai?.toString();
  const selesai = body?.selesai?.toString();
  if (!validTanggal(tanggal) || !validHHMM(mulai) || !validHHMM(selesai)) {
    return NextResponse.json(
      { error: "tanggal (YYYY-MM-DD), mulai & selesai (HH:MM) wajib valid" },
      { status: 422 }
    );
  }
  if (mulai >= selesai) {
    return NextResponse.json({ error: "jam selesai harus setelah jam mulai" }, { status: 422 });
  }
  const slot = await prisma.candidateSlot.create({
    data: { candidateId: id, tanggal, mulai, selesai },
  });
  return NextResponse.json(slot, { status: 201 });
}
