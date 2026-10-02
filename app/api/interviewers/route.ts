import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.interviewer.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const nama = body?.nama?.toString().trim();
  const email = body?.email?.toString().trim();
  if (!nama || !email) {
    return NextResponse.json({ error: "nama dan email wajib diisi" }, { status: 400 });
  }
  try {
    const iv = await prisma.interviewer.create({ data: { nama, email } });
    return NextResponse.json(iv, { status: 201 });
  } catch (e) {
    if (String(e).includes("Unique constraint")) {
      return NextResponse.json({ error: "email pewawancara sudah terdaftar" }, { status: 409 });
    }
    throw e;
  }
}
