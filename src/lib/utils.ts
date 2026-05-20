import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatPopulation(population: number | null | undefined) {
  if (population === null || population === undefined) return "—";
  return new Intl.NumberFormat("pt-BR").format(population);
}

export function formatFileSize(bytes: number | null | undefined) {
  if (bytes === null || bytes === undefined) return "—";
  const kb = bytes / 1024;
  if (kb < 1) return `${bytes} B`;
  const mb = kb / 1024;
  if (mb < 1) return `${kb.toFixed(1)} KB`;
  return `${mb.toFixed(1)} MB`;
}

export function getFileIcon(fileType: string | null | undefined) {
  if (!fileType) return "📄";
  const type = fileType.toLowerCase();
  if (type.includes("pdf")) return "📄";
  if (type.includes("image") || type.includes("png") || type.includes("jpg") || type.includes("jpeg") || type.includes("gif")) return "🖼️";
  if (type.includes("excel") || type.includes("spreadsheet") || type.includes("csv")) return "📊";
  if (type.includes("word") || type.includes("document")) return "📄";
  if (type.includes("zip") || type.includes("compressed")) return "🗜️";
  if (type.includes("text")) return "📝";
  return "📎";
}

export function isValidEmail(email: string | null | undefined) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
