import { TAHAP_ORDER } from "./format";

export const SEMUA_TAHAP = [...TAHAP_ORDER, "ditolak"] as const;

export function isTahapValid(t: string): boolean {
  return (SEMUA_TAHAP as readonly string[]).includes(t);
}

/** Transisi sah dari suatu tahap: hanya ke tahap berikutnya atau ke "ditolak". */
export function allowedTransitions(dari: string): string[] {
  if (dari === "hired" || dari === "ditolak") return [];
  const i = (TAHAP_ORDER as readonly string[]).indexOf(dari);
  if (i < 0) return [];
  const next = i + 1 < TAHAP_ORDER.length ? [TAHAP_ORDER[i + 1] as string] : [];
  return [...next, "ditolak"];
}

/** null = sah; string = pesan error */
export function validateTransition(dari: string, ke: string): string | null {
  if (!isTahapValid(ke)) return `tahap tujuan "${ke}" tidak dikenal`;
  if (dari === ke) return "kandidat sudah berada di tahap tersebut";
  const ok = allowedTransitions(dari);
  if (!ok.includes(ke)) {
    return `transisi ${dari} → ${ke} tidak sah (hanya boleh ke: ${ok.join(", ") || "-"})`;
  }
  return null;
}
