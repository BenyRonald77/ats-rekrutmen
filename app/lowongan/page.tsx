"use client";
import { useEffect, useState } from "react";

type Job = {
  id: number; judul: string; departemen: string; deskripsi: string;
  syarat: string; status: string; tanggalMulai: string | null;
  _count: { candidates: number };
};

const empty = { judul: "", departemen: "", deskripsi: "", syarat: "", tanggalMulai: "" };

export default function LowonganPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState("");

  const load = () => fetch("/api/jobs").then((r) => r.json()).then(setJobs);
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const r = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!r.ok) {
      const j = await r.json();
      setErr(j.error ?? "Gagal menyimpan");
      return;
    }
    setForm(empty);
    load();
  };

  const toggle = async (j: Job) => {
    await fetch(`/api/jobs/${j.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: j.status === "buka" ? "tutup" : "buka" }),
    });
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Lowongan</h1>

      <form onSubmit={submit} className="bg-white rounded shadow p-4 space-y-3 max-w-xl">
        <h2 className="font-semibold">Tambah Lowongan</h2>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <input className="w-full border rounded px-3 py-2" placeholder="Judul *"
          value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} />
        <input className="w-full border rounded px-3 py-2" placeholder="Departemen *"
          value={form.departemen} onChange={(e) => setForm({ ...form, departemen: e.target.value })} />
        <textarea className="w-full border rounded px-3 py-2" placeholder="Deskripsi"
          value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
        <textarea className="w-full border rounded px-3 py-2" placeholder="Syarat"
          value={form.syarat} onChange={(e) => setForm({ ...form, syarat: e.target.value })} />
        <input type="date" className="border rounded px-3 py-2"
          value={form.tanggalMulai} onChange={(e) => setForm({ ...form, tanggalMulai: e.target.value })} />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Simpan</button>
      </form>

      <div className="space-y-2">
        {jobs.map((j) => (
          <div key={j.id} className="bg-white rounded shadow p-4 flex justify-between items-center">
            <a href={`/lowongan/${j.id}`} className="block">
              <div className="font-semibold hover:underline">{j.judul}</div>
              <div className="text-sm text-slate-500">{j.departemen} · {j._count.candidates} kandidat · {j.status}</div>
            </a>
            <button onClick={() => toggle(j)} className="text-sm border rounded px-3 py-1">
              {j.status === "buka" ? "Tutup" : "Buka lagi"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
