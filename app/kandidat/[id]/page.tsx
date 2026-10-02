"use client";
import { useEffect, useState } from "react";
import { TAHAP_LABEL, fmtTanggal, fmtWaktu } from "@/lib/format";

type History = { id: number; dari: string; ke: string; waktu: string; oleh: string; catatan: string };
type Skor = { skor: number; criterion: { id: number; nama: string; bobot: number } };
type Sheet = { id: number; tahap: string; interviewer: { nama: string }; scores: Skor[] };
type Interview = { id: number; tanggal: string; mulai: string; selesai: string; catatan: string; interviewer: { nama: string } };
type Detail = {
  id: number; nama: string; email: string; telepon: string; cv: string; tahap: string;
  job: { id: number; judul: string };
  histories: History[]; scoreSheets: Sheet[]; interviews: Interview[];
};
type Agg = {
  keseluruhan: number; jumlahPenilai: number;
  perSheet: { interviewerNama: string; terbobot: number }[];
  rataKriteria: { nama: string; rataRata: number }[];
};
type Criterion = { id: number; nama: string; bobot: number };
type Interviewer = { id: number; nama: string };

export default function KandidatPage({ params }: { params: { id: string } }) {
  const [d, setD] = useState<Detail | null>(null);
  const [agg, setAgg] = useState<Agg | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [slot, setSlot] = useState({ tanggal: "", mulai: "", selesai: "" });
  const [skorForm, setSkorForm] = useState<{ interviewerId: string; nilai: Record<string, string> }>({
    interviewerId: "", nilai: {},
  });

  const load = () => {
    fetch(`/api/candidates/${params.id}`).then((r) => r.json()).then(setD);
    fetch(`/api/scores/aggregate?candidateId=${params.id}`).then((r) => r.json()).then(setAgg);
  };
  useEffect(() => {
    load();
    fetch("/api/rubric").then((r) => r.json()).then(setCriteria);
    fetch("/api/interviewers").then((r) => r.json()).then(setInterviewers);
  }, [params.id]);

  const tambahSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setOk("");
    const r = await fetch(`/api/candidates/${params.id}/slots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slot),
    });
    const j = await r.json();
    if (!r.ok) { setErr(j.error ?? "Gagal"); return; }
    setOk("Slot kosong ditambahkan.");
    setSlot({ tanggal: "", mulai: "", selesai: "" });
    load();
  };

  const submitSkor = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setOk("");
    const scores = criteria.map((c) => ({
      criterionId: c.id,
      skor: Number(skorForm.nilai[String(c.id)]),
    }));
    const r = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidateId: Number(params.id),
        interviewerId: Number(skorForm.interviewerId),
        scores,
      }),
    });
    const j = await r.json();
    if (!r.ok) { setErr(j.error ?? "Gagal"); return; }
    setOk("Penilaian tersimpan.");
    setSkorForm({ interviewerId: "", nilai: {} });
    load();
  };

  if (!d) return <p>Memuat...</p>;

  return (
    <div className="space-y-6">
      <div>
        <a href={`/lowongan/${d.job.id}`} className="text-sm text-blue-600 hover:underline">← {d.job.judul}</a>
        <h1 className="text-2xl font-bold mt-1">{d.nama}</h1>
        <p className="text-sm text-slate-500">{d.email} · {d.telepon}</p>
        {d.cv && <a href={d.cv} className="text-sm text-blue-600 hover:underline" target="_blank">Lihat CV</a>}
        <div className="mt-2 inline-block text-sm px-3 py-1 rounded bg-blue-100 text-blue-800">
          Tahap: {TAHAP_LABEL[d.tahap]}
        </div>
      </div>

      {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{err}</p>}
      {ok && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{ok}</p>}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2">Timeline Tahap</h2>
          <ol className="space-y-2 text-sm">
            {d.histories.map((h) => (
              <li key={h.id} className="border-l-2 border-blue-300 pl-3">
                <div className="font-medium">
                  {h.dari === "-" ? "Melamar" : TAHAP_LABEL[h.dari]} → {TAHAP_LABEL[h.ke]}
                </div>
                <div className="text-xs text-slate-500">
                  {fmtWaktu(h.waktu)}{h.oleh ? ` · oleh ${h.oleh}` : ""}{h.catatan ? ` · ${h.catatan}` : ""}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2">Penilaian Rubrik</h2>
          {agg && agg.jumlahPenilai > 0 ? (
            <div className="text-sm space-y-2">
              <p className="text-lg">Skor agregat: <b>{agg.keseluruhan.toFixed(2)}</b> <span className="text-slate-500">({agg.jumlahPenilai} penilai)</span></p>
              {agg.perSheet.map((s, i) => (
                <p key={i}>{s.interviewerNama}: <b>{s.terbobot.toFixed(2)}</b></p>
              ))}
              <div className="pt-1">
                {agg.rataKriteria.map((k) => (
                  <p key={k.nama} className="text-slate-600">{k.nama}: {k.rataRata.toFixed(2)}</p>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Belum ada penilaian.</p>
          )}

          <form onSubmit={submitSkor} className="mt-4 space-y-2 border-t pt-3">
            <h3 className="text-sm font-semibold">Tambah Penilaian</h3>
            <select className="w-full border rounded px-3 py-2 text-sm"
              value={skorForm.interviewerId}
              onChange={(e) => setSkorForm({ ...skorForm, interviewerId: e.target.value })}>
              <option value="">— Pewawancara —</option>
              {interviewers.map((iv) => <option key={iv.id} value={iv.id}>{iv.nama}</option>)}
            </select>
            {criteria.map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-sm">
                <span className="flex-1">{c.nama} <span className="text-slate-400">(bobot {c.bobot})</span></span>
                <input type="number" min={0} max={100} className="w-20 border rounded px-2 py-1" placeholder="0-100"
                  value={skorForm.nilai[String(c.id)] ?? ""}
                  onChange={(e) => setSkorForm({ ...skorForm, nilai: { ...skorForm.nilai, [String(c.id)]: e.target.value } })} />
              </div>
            ))}
            <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm">Simpan Penilaian</button>
          </form>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2">Jadwal Interview</h2>
          {d.interviews.length === 0 && <p className="text-sm text-slate-500">Belum ada jadwal.</p>}
          <ul className="text-sm space-y-1">
            {d.interviews.map((iv) => (
              <li key={iv.id}>
                {fmtTanggal(iv.tanggal)} {iv.mulai}–{iv.selesai} · {iv.interviewer.nama}
                {iv.catatan && <span className="text-slate-500"> · {iv.catatan}</span>}
              </li>
            ))}
          </ul>
          <a href="/jadwal" className="text-sm text-blue-600 hover:underline">Jadwalkan interview →</a>
        </div>

        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2">Tambah Slot Kosong</h2>
          <form onSubmit={tambahSlot} className="flex flex-wrap gap-2 items-end text-sm">
            <input type="date" className="border rounded px-3 py-2" value={slot.tanggal}
              onChange={(e) => setSlot({ ...slot, tanggal: e.target.value })} />
            <input type="time" className="border rounded px-3 py-2" value={slot.mulai}
              onChange={(e) => setSlot({ ...slot, mulai: e.target.value })} />
            <input type="time" className="border rounded px-3 py-2" value={slot.selesai}
              onChange={(e) => setSlot({ ...slot, selesai: e.target.value })} />
            <button className="bg-blue-600 text-white px-4 py-2 rounded">Tambah</button>
          </form>
        </div>
      </div>
    </div>
  );
}
