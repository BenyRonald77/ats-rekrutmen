"use client";
import { useEffect, useState } from "react";
import { TAHAP_LABEL, TAHAP_ORDER } from "@/lib/format";
import { allowedTransitions } from "@/lib/pipeline";

type Candidate = { id: number; nama: string; email: string; tahap: string };
type Job = {
  id: number; judul: string; departemen: string; deskripsi: string;
  syarat: string; status: string; candidates: Candidate[];
};

const KOLOM = [...TAHAP_ORDER, "ditolak"];

export default function BoardPage({ params }: { params: { id: string } }) {
  const [job, setJob] = useState<Job | null>(null);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ nama: "", email: "", telepon: "", cv: "" });

  const load = () =>
    fetch(`/api/jobs/${params.id}`)
      .then((r) => r.json())
      .then(setJob);

  useEffect(() => { load(); }, [params.id]);

  const pindah = async (c: Candidate, ke: string) => {
    setErr("");
    const oleh = prompt("Nama Anda (pencatat perpindahan):", "HRD") ?? "";
    const r = await fetch(`/api/candidates/${c.id}/stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ke, oleh }),
    });
    if (!r.ok) {
      const j = await r.json();
      setErr(j.error ?? "Gagal memindahkan tahap");
      return;
    }
    load();
  };

  const tambah = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const r = await fetch("/api/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, jobId: Number(params.id), oleh: "HRD" }),
    });
    if (!r.ok) {
      const j = await r.json();
      setErr(j.error ?? "Gagal menambah kandidat");
      return;
    }
    setForm({ nama: "", email: "", telepon: "", cv: "" });
    load();
  };

  if (!job) return <p>Memuat...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{job.judul}</h1>
          <p className="text-sm text-slate-500">{job.departemen} · {job.status}</p>
        </div>
        <a href="/lowongan" className="text-sm text-blue-600 hover:underline">← Lowongan</a>
      </div>
      {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{err}</p>}

      <form onSubmit={tambah} className="bg-white rounded shadow p-4 flex flex-wrap gap-2 items-end">
        <input className="border rounded px-3 py-2" placeholder="Nama *" value={form.nama}
          onChange={(e) => setForm({ ...form, nama: e.target.value })} />
        <input className="border rounded px-3 py-2" placeholder="Email *" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="border rounded px-3 py-2" placeholder="Telepon" value={form.telepon}
          onChange={(e) => setForm({ ...form, telepon: e.target.value })} />
        <input className="border rounded px-3 py-2" placeholder="Link CV" value={form.cv}
          onChange={(e) => setForm({ ...form, cv: e.target.value })} />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">+ Kandidat</button>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {KOLOM.map((t) => {
          const list = job.candidates.filter((c) => c.tahap === t);
          return (
            <div key={t} className="bg-slate-100 rounded p-2 min-h-[200px]">
              <div className="font-semibold text-sm px-1 py-1 flex justify-between">
                <span>{TAHAP_LABEL[t]}</span>
                <span className="text-slate-500">{list.length}</span>
              </div>
              <div className="space-y-2">
                {list.map((c) => (
                  <div key={c.id} className="bg-white rounded shadow-sm p-2">
                    <a href={`/kandidat/${c.id}`} className="font-medium text-sm hover:underline">{c.nama}</a>
                    <div className="text-xs text-slate-500 truncate">{c.email}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {allowedTransitions(c.tahap).map((next) => (
                        <button
                          key={next}
                          onClick={() => pindah(c, next)}
                          className={`text-xs px-2 py-1 rounded ${next === "ditolak" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
                        >
                          → {TAHAP_LABEL[next]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
