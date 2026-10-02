"use client";
import { useEffect, useState } from "react";
import { fmtTanggal } from "@/lib/format";

type Candidate = { id: number; nama: string };
type Interviewer = { id: number; nama: string };
type Match = { tanggal: string; mulai: string; selesai: string };

export default function JadwalPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [cid, setCid] = useState("");
  const [iid, setIid] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    fetch("/api/candidates").then((r) => r.json()).then(setCandidates);
    fetch("/api/interviewers").then((r) => r.json()).then(setInterviewers);
  }, []);

  const cari = async () => {
    setErr(""); setOk(""); setMatches([]);
    const r = await fetch("/api/interviews/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId: Number(cid), interviewerId: Number(iid) }),
    });
    const j = await r.json();
    if (!r.ok) { setErr(j.error ?? "Gagal"); return; }
    setMatches(j.cocok);
    if (j.cocok.length === 0) setErr("Tidak ada slot yang cocok.");
  };

  const booking = async (m: Match) => {
    setErr(""); setOk("");
    const r = await fetch("/api/interviews/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId: Number(cid), interviewerId: Number(iid), ...m }),
    });
    const j = await r.json();
    if (!r.ok) { setErr(j.error ?? "Gagal"); return; }
    setOk(`Interview terjadwal: ${fmtTanggal(m.tanggal)} ${m.mulai}–${m.selesai}.`);
    cari();
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold">Penjadwalan Interview</h1>
      {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{err}</p>}
      {ok && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{ok}</p>}

      <div className="bg-white rounded shadow p-4 flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-xs text-slate-500">Kandidat</label>
          <select className="block border rounded px-3 py-2" value={cid} onChange={(e) => setCid(e.target.value)}>
            <option value="">— pilih —</option>
            {candidates.map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500">Pewawancara</label>
          <select className="block border rounded px-3 py-2" value={iid} onChange={(e) => setIid(e.target.value)}>
            <option value="">— pilih —</option>
            {interviewers.map((iv) => <option key={iv.id} value={iv.id}>{iv.nama}</option>)}
          </select>
        </div>
        <button onClick={cari} disabled={!cid || !iid} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
          Cari Slot Cocok
        </button>
      </div>

      {matches.length > 0 && (
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2">Slot yang cocok ({matches.length})</h2>
          <ul className="space-y-2">
            {matches.map((m, i) => (
              <li key={i} className="flex justify-between items-center border rounded px-3 py-2 text-sm">
                <span>{fmtTanggal(m.tanggal)} · {m.mulai}–{m.selesai}</span>
                <button onClick={() => booking(m)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">
                  Booking
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
