import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const sleep = (delayMs?: number) => {
  const ms = delayMs ?? 1000 + Math.random() * 1000;
  return new Promise((res) => setTimeout(res, ms));
};

export function splitRandom(str: string, min = 3, max = 10): string[] {
  if (min < 1) min = 1;
  if (max < min) max = min;
  const out: string[] = [];
  let i = 0;
  while (i < str.length) {
    const remaining = str.length - i;
    const len = Math.min(
      remaining,
      Math.floor(Math.random() * (max - min + 1)) + min,
    );
    out.push(str.slice(i, i + len));
    i += len;
  }
  return out;
}
