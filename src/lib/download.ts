import type { ListItem } from "@/types";
import { toast } from "sonner";
import { PLACEHOLDER_TEXT } from "./const";

const corsProxy = (url: string) => {
  return import.meta.env.DEV
    ? `http://localhost:3000/api/proxy?url=${url}`
    : `https://personal.komlosidev.net/api/proxy?url=${url}`;
};
const getParsedPdf = (url: string) => {
  return import.meta.env.DEV
    ? `http://localhost:3000/api/parsePdf?url=${url}`
    : `https://personal.komlosidev.net/api/parsePdf?url=${url}`;
};

export async function getLatestFromUrl(url: string): Promise<ListItem[]> {
  console.debug("Fetching items from ", url);

  const itemsPromise = new Promise<ListItem[]>((resolve, reject) => {
    (async () => {
      try {
        const headers = new Headers();
        headers.append("Content-Type", "text/html");
        const response = await fetch(corsProxy(url), { headers });
        if (!response.ok) {
          throw new Error(`Failed to fetch HTML: ${response.statusText}`);
        }
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const fresh = doc.querySelector(".fresh-row > div[itemscope]");
        const rest = doc.querySelectorAll(".journal-row > div[itemscope]");
        const items = [fresh, ...rest];
        const itemsArray = Array.from(items).filter(Boolean) as Element[];

        const result = itemsArray.map((item) => {
          const date = (
            item
              .querySelector("meta[itemprop=datePublished]")
              ?.getAttribute("content") ?? PLACEHOLDER_TEXT
          ).trim();
          const title = (
            item.querySelector("b[itemprop=name]")?.textContent ??
            PLACEHOLDER_TEXT
          ).trim();
          const download =
            item.querySelector('a[href*="letoltes"]')?.getAttribute("href") ??
            "";
          const view =
            item
              .querySelector('a[href*="megtekintes"]')
              ?.getAttribute("href") ?? "";
          return { date, title, download, view };
        });
        resolve(result.filter((e) => e.title.includes("Magyar Közlöny")));
      } catch (error) {
        reject(error);
      }
    })();
  });

  toast.promise<ListItem[]>(itemsPromise, {
    loading: "Letöltés ...",
    error: "Oopsz, valami félrement",
  });

  return itemsPromise;
}

export interface PDFEntry {
  title: string;
  content: string;
}

export async function downloadPdf(url: string): Promise<PDFEntry[]> {
  console.debug("Parse PDF from:", url);
  const downloadPdfPromise = new Promise<PDFEntry[]>((resolve, reject) => {
    (async function () {
      const headers = new Headers();
      headers.append("Content-Type", "application/json");
      try {
        const response = await fetch(getParsedPdf(url), { headers });
        const parsedPdf = (await response.json()) as PDFEntry[];
        resolve(parsedPdf);
      } catch {
        reject(new Error("Failed to download parsed PDF details"));
      }
    })();
  });
  toast.promise<PDFEntry[]>(downloadPdfPromise, {
    loading: "Dokumentum betöltése ...",
    error: "Oopsz, valami félrement",
  });
  return downloadPdfPromise;
}
