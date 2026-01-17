import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getIntentScoreColor(score: number): string {
  if (score >= 7) return "text-emerald-500";
  if (score <= 4) return "text-red-500";
  return "text-amber-500";
}

export function getIntentScoreBg(score: number): string {
  if (score >= 7) return "bg-emerald-500/10 border-emerald-500/20";
  if (score <= 4) return "bg-red-500/10 border-red-500/20";
  return "bg-amber-500/10 border-amber-500/20";
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
