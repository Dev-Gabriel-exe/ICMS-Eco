// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {
    template: "%s — ICMS-ECO",
    default: "ICMS-ECO | Gestão do Selo Ambiental",
  },
  description:
    "Sistema de Gestão do ICMS Ecológico — Certificação do Selo Ambiental para municípios piauienses conforme Decreto 24.288/2025.",
  keywords: ["ICMS Ecológico", "Selo Ambiental", "Piauí", "SEMARH", "municípios"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={cn("font-sans", inter.variable)}>
      <body>{children}</body>
    </html>
  );
}