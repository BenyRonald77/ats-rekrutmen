import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/format";

export async function GET() {
  const jobs = await prisma.job.findMany({
    orderBy: { id: "asc" },
    include: { _count: { select: { candidates: true } } },
  });
  return NextResponse.json(jobs);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const judul = body?.judul?.toString().trim();
  const departemen = body?.departemen?.toString().trim();
  if (!judul || !departemen) {
    return NextResponse.json(
      { error: "judul dan departemen wajib diisi" },
      { status: 400 }
    );
  }
  const status = body?.status?.toString() ?? "buka";
  if (!["buka", "tutup"].includes(status)) {
    return NextResponse.json({ error: "status harus buka atau tutup" }, { status: 422 });
  }
  const job = await prisma.job.create({
    data: {
      judul,
      departemen,
      deskripsi: body?.deskripsi?.toString() ?? "",
      syarat: body?.syarat?.toString() ?? "",
      status,
      tanggalMulai: body?.tanggalMulai?.toString() || null,
      createdAt: nowIso(),
    },
  });
  return NextResponse.json(job, { status: 201 });
}
