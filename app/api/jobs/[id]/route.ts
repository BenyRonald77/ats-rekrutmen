import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "id tidak valid" }, { status: 400 });
  const job = await prisma.job.findUnique({
    where: { id },
    include: { candidates: { orderBy: { id: "asc" } } },
  });
  if (!job) return NextResponse.json({ error: "lowongan tidak ditemukan" }, { status: 404 });
  return NextResponse.json(job);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "id tidak valid" }, { status: 400 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "body tidak valid" }, { status: 400 });
  }
  const data: Record<string, string> = {};
  for (const k of ["judul", "departemen", "deskripsi", "syarat", "tanggalMulai"] as const) {
    if (body[k] !== undefined) data[k] = body[k]?.toString() ?? "";
  }
  if (body.status !== undefined) {
    if (!["buka", "tutup"].includes(body.status)) {
      return NextResponse.json({ error: "status harus buka atau tutup" }, { status: 422 });
    }
    data.status = body.status;
  }
  try {
    const job = await prisma.job.update({ where: { id }, data });
    return NextResponse.json(job);
  } catch {
    return NextResponse.json({ error: "lowongan tidak ditemukan" }, { status: 404 });
  }
}
