import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.rubricCriterion.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const nama = body?.nama?.toString().trim();
  const bobot = Number(body?.bobot);
  if (!nama) return NextResponse.json({ error: "nama kriteria wajib diisi" }, { status: 400 });
  if (!Number.isFinite(bobot) || bobot <= 0) {
    return NextResponse.json({ error: "bobot harus angka > 0" }, { status: 422 });
  }
  const created = await prisma.rubricCriterion.create({ data: { nama, bobot } });
  return NextResponse.json(created, { status: 201 });
}
