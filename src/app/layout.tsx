import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navigation/Navbar";

export const metadata: Metadata = {
  title: "Mundane — Open-Source AI Field Investigator",
  description: "The world is full of things you've never really noticed. An open-source AI outdoor investigation companion powered by Gemma.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans bg-paper-100 text-charcoal-800 antialiased pb-16 md:pb-0">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-paper-300 bg-paper-200/50 py-6 text-center text-xs text-stone-500 font-mono">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <span>Mundane &bull; Hacktoberfest 2026</span>
              <span className="mx-2 text-stone-400">|</span>
              <span className="text-forest-600 font-medium">Leave No Trace &bull; Observe Reality</span>
            </div>
            <div>
              <span>Open-Weight AI via Google Gemma &bull; Local Ollama</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
