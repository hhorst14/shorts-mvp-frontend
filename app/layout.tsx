import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shorts MVP Frontend",
  description: "Upload, transcribe, style, and export Shorts",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="max-w-6xl mx-auto p-4 md:p-8">{children}</div>
      </body>
    </html>
  );
}
