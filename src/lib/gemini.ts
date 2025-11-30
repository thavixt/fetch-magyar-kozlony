import type { Entry } from "@/types";

const LOCALSTORAGE_KEY = "fmk-ai-disabled";
export const isAiEnabled = () => !window.localStorage.getItem(LOCALSTORAGE_KEY);
export const setAiEnabled = (enabled: boolean) => {
  if (enabled) {
    window.localStorage.removeItem(LOCALSTORAGE_KEY);
  } else {
    window.localStorage.setItem(LOCALSTORAGE_KEY, "1");
  }
}

const getUrl = () => {
  if (import.meta.env.DEV) {
    return "http://localhost:8080/api/gemini";
  }
  return "https://personal.komlosidev.net/api/gemini";
}

export interface GeminiResponse { code: number; text: string };

async function gemini(text: string): Promise<GeminiResponse> {
  const res = await fetch(getUrl(), {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });
  const json = await res.json() as GeminiResponse;
  if (json.code !== 0) {
    console.error(json);
  }
  return json;
}

export async function getAiOverview(lines: Entry[]): Promise<GeminiResponse> {
  const payload = lines.map(l => `${l.num}\n${l.name}\n${l.id}`).join('\n\n');

  return gemini(`Itt egy lista az aktuális Magyar közlönyből, írj egy rövid összefoglalót:\n\n${payload}`);
}