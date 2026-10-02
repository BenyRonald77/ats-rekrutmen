import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "ATS Rekrutmen",
  description: "ATS Rekrutmen Sederhana: lowongan, pipeline kandidat, penilaian rubrik, penjadwalan interview",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen text-slate-900">
        <nav className="bg-slate-900 text-white">
          <div className="max-w-6xl mx-auto px-4 py-3 flex gap-6 items-center">
            <a href="/" className="font-bold text-lg">ATS Rekrutmen</a>
            <a href="/" className="text-sm hover:underline">Dashboard</a>
            <a href="/lowongan" className="text-sm hover:underline">Lowongan</a>
            <a href="/jadwal" className="text-sm hover:underline">Penjadwalan</a>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
