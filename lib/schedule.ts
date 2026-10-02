export const toMin = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
export const toHHMM = (min: number): string =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export const overlaps = (a1: number, a2: number, b1: number, b2: number): boolean =>
  Math.max(a1, b1) < Math.min(a2, b2);

export const validHHMM = (s: string): boolean => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
export const validTanggal = (s: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

export type Slot = { tanggal: string; mulai: string; selesai: string };
export type InterviewRow = Slot & { candidateId: number; interviewerId: number };

/**
 * Cari window interview (durasi menit) yang:
 * - berada di irisan slot kandidat & slot interviewer pada tanggal yang sama, dan
 * - tidak bentrok dengan interview yang sudah ada (untuk kandidat maupun interviewer).
 */
export function findMatches(
  candidateSlots: Slot[],
  interviewerSlots: Slot[],
  existing: InterviewRow[],
  candidateId: number,
  interviewerId: number,
  durasi = 60
): Slot[] {
  const hasil: Slot[] = [];
  for (const cs of candidateSlots) {
    for (const is of interviewerSlots) {
      if (cs.tanggal !== is.tanggal) continue;
      const s = Math.max(toMin(cs.mulai), toMin(is.mulai));
      const e = Math.min(toMin(cs.selesai), toMin(is.selesai));
      if (e - s < durasi) continue;
      for (let start = s; start + durasi <= e; start += 30) {
        const end = start + durasi;
        const bentrok = existing.some(
          (iv) =>
            iv.tanggal === cs.tanggal &&
            (iv.candidateId === candidateId || iv.interviewerId === interviewerId) &&
            overlaps(toMin(iv.mulai), toMin(iv.selesai), start, end)
        );
        if (!bentrok) hasil.push({ tanggal: cs.tanggal, mulai: toHHMM(start), selesai: toHHMM(end) });
      }
    }
  }
  return hasil;
}
