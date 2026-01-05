import type { Entry } from "@/types";
import { toast } from "sonner";
import type { PDFEntry } from "./download";

const LOCALSTORAGE_KEY = "fmk-ai-disabled";
export const isAiEnabled = () => !window.localStorage.getItem(LOCALSTORAGE_KEY);
export const setAiEnabled = (enabled: boolean) => {
  if (enabled) {
    window.localStorage.removeItem(LOCALSTORAGE_KEY);
  } else {
    window.localStorage.setItem(LOCALSTORAGE_KEY, "1");
  }
};

const getUrl = () => {
  if (import.meta.env.DEV) {
    return "http://localhost:8080/api/gemini";
  }
  return "https://personal.komlosidev.net/api/gemini";
};

export interface GeminiResponse {
  code: number;
  text: string;
}

async function gemini(text: string): Promise<GeminiResponse> {
  let res;
  try {
    res = await fetch(getUrl(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });
  } catch {
    throw new Error("Network error");
  }
  const json = (await res.json()) as GeminiResponse;
  if (json.code !== 0) {
    console.error(json);
    throw new Error(`Invalid response - error code ${json.code}`);
  }
  return json;
}

const aiOverviewCache = new Map<string, string>();
export async function getAiOverview(
  cacheKey: string,
  lines: PDFEntry[],
): Promise<GeminiResponse | null> {
  const payload = lines.map((l) => `${l.title}\n${l.content}`).join("\n\n");
  const cached = aiOverviewCache.get(cacheKey);
  if (cached) {
    return { code: 0, text: cached };
  }

  try {
    const response = await gemini(
      `Itt egy lista az aktuális Magyar közlönyből, írj egy rövid összefoglalót:\n(a fonto szavakat **emeld ki**, hogy gyorsan értelmezhető legyen)\n\n${payload}`,
    );
    aiOverviewCache.set(cacheKey, response.text);
    return response;
  } catch (e) {
    console.error(e);
    return null;
  }
}

const tableCache = new Map<string, string>();
export async function getAsTableAi(
  cacheKey: string,
  entries: Entry[][],
): Promise<string | null> {
  const payload = entries
    .map((entry) => {
      return entry.map((e) => `${e.num}\n${e.name}\n${e.id}`);
    })
    .join("\n\n");

  const cached = tableCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const formatPromise = new Promise<string>(async (res, rej) => {
    try {
      const response = await gemini(
        `Itt egy lista az aktuális Magyar közlönyből, formázd a sorokat egy HTML <table>-ként, hogy könnyen tudjam egy email-be másolni:\n\n${payload}\n\n**Nagyon fontos, hogy csak a nyers <html>-t írd válaszként!**`,
      );
      let result = "";
      result = response.text
        .replaceAll("```", "")
        .replaceAll("html", "")
        .replaceAll(/\n{2,}/g, "\n")
        .replaceAll(/\s{2,}/g, " ")
        .trim();
      if (!result) {
        return null;
      }
      tableCache.set(cacheKey, result);
      res(result);
    } catch (e) {
      console.error(e);
      rej(e);
    }
  });

  const { unwrap } = toast.promise(formatPromise, {
    loading: "Táblázat formázása ...",
    error: "Táblázat formázása nem sikerült :(",
  });

  const result = await unwrap();
  return result;
}
