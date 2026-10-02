"use client";
import { useEffect, useState } from "react";
import { TAHAP_LABEL, TAHAP_ORDER } from "@/lib/format";

type Job = { id: number; judul: string; departemen: string; status: string; _count: { candidates: number } };

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [perTahap, setPerTahap] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/jobs").then((r) => r.json()).then(setJobs);
    fetch("/api/candidates").then((r) => r.json()).then((cs: { tahap: string }[]) => {
      const m: Record<string, number> = {};
      for (const c of cs) m[c.tahap] = (m[c.tahap] ?? 0) + 1;
      setPerTahap(m);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Rekrutmen</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...TAHAP_ORDER, "ditolak"].map((t) => (
          <div key={t} className="bg-white rounded shadow p-3 text-center">
            <div className="text-2xl font-bold">{perTahap[t] ?? 0}</div>
            <div className="text-xs text-slate-500">{TAHAP_LABEL[t]}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Lowongan</h2>
          <a href="/lowongan" className="text-sm text-blue-600 hover:underline">Kelola lowongan →</a>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {jobs.map((j) => (
            <a key={j.id} href={`/lowongan/${j.id}`} className="bg-white rounded shadow p-4 hover:shadow-md block">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{j.judul}</div>
                  <div className="text-sm text-slate-500">{j.departemen}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${j.status === "buka" ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-600"}`}>
                  {j.status}
                </span>
              </div>
              <div className="text-sm text-slate-500 mt-2">{j._count.candidates} kandidat</div>
            </a>
          ))}
          {jobs.length === 0 && <p className="text-slate-500 text-sm">Belum ada lowongan.</p>}
        </div>
      </div>
    </div>
  );
}
