import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Metzudat HaLikud - Admin Panel",
  description: "Content management system for Metzudat HaLikud news app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="font-heebo antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
