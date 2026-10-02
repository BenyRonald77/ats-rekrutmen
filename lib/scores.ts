type SkorRow = { skor: number; criterion: { bobot: number; nama: string; id: number } };
type Sheet = { id: number; interviewer: { id: number; nama: string }; tahap: string; scores: SkorRow[] };

export function weightedAvg(scores: SkorRow[]): number {
  let num = 0, den = 0;
  for (const s of scores) {
    num += s.skor * s.criterion.bobot;
    den += s.criterion.bobot;
  }
  return den === 0 ? 0 : num / den;
}

/** Agregat: rata-rata terbobot per pewawancara, lalu rata-rata antar pewawancara + rata-rata per kriteria. */
export function aggregateSheets(sheets: Sheet[]) {
  const perSheet = sheets.map((sh) => ({
    sheetId: sh.id,
    interviewerId: sh.interviewer.id,
    interviewerNama: sh.interviewer.nama,
    tahap: sh.tahap,
    terbobot: weightedAvg(sh.scores),
  }));
  const keseluruhan =
    perSheet.length === 0 ? 0 : perSheet.reduce((a, s) => a + s.terbobot, 0) / perSheet.length;

  const perKriteria = new Map<number, { nama: string; total: number; n: number }>();
  for (const sh of sheets) {
    for (const s of sh.scores) {
      const e = perKriteria.get(s.criterion.id) ?? { nama: s.criterion.nama, total: 0, n: 0 };
      e.total += s.skor;
      e.n += 1;
      perKriteria.set(s.criterion.id, e);
    }
  }
  const rataKriteria = [...perKriteria.entries()].map(([id, e]) => ({
    criterionId: id, nama: e.nama, rataRata: e.n === 0 ? 0 : e.total / e.n,
  }));

  return { perSheet, keseluruhan, rataKriteria, jumlahPenilai: sheets.length };
}
