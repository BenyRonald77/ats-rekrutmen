export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
export const nowIso = () => new Date().toISOString();

export const TAHAP_ORDER = ["melamar", "screening", "interview", "penawaran", "hired"] as const;
export type Tahap = (typeof TAHAP_ORDER)[number] | "ditolak";

export const TAHAP_LABEL: Record<string, string> = {
  melamar: "Melamar",
  screening: "Screening",
  interview: "Interview",
  penawaran: "Penawaran",
  hired: "Hired",
  ditolak: "Ditolak",
};

export const fmtTanggal = (s: string) => {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};
export const fmtWaktu = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
