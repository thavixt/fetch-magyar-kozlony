import type { ListItem } from "@/types";
import { toast } from "sonner";
import { PLACEHOLDER_TEXT } from "./const";

const proxyUrl = (url: string) => {
  return import.meta.env.PROD
    ? `https://komlosidev.net/api/proxy?url=${url}`
    : `http://localhost:8080/api/proxy?url=${url}`;
};

export async function getLatestFromUrl(url: string): Promise<ListItem[]> {
  console.debug("Fetching items from ", url);

  const itemsPromise = new Promise<ListItem[]>((resolve, reject) => {
    (async () => {
      try {
        const response = await fetch(proxyUrl(url));
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
        resolve(result);
      } catch (error) {
        reject(error);
      }
    })();
  });

  toast.promise<ListItem[]>(itemsPromise, {
    loading: "Letöltés ...",
    error: "Ooopsz, valami félrement",
  });

  return itemsPromise;
}

export async function downloadPdf(url: string): Promise<Uint8Array> {
  console.debug("Download PDF from:", url);

  const downloadPdfPromise = new Promise<Uint8Array>((resolve) => {
    (async function () {
      const response = await fetch(proxyUrl(url));
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("pdf")) {
        const text = await response.text();
        console.error(
          "Not a PDF! Content-Type:",
          contentType,
          "First 200 chars:",
          text.slice(0, 200),
        );
        throw new Error("Fetched file is not a PDF");
      }
      const arrayBuffer =
        (await response.arrayBuffer()) as unknown as Uint8Array;
      resolve(arrayBuffer);
    })();
  });

  toast.promise<Uint8Array>(downloadPdfPromise, {
    loading: "Dokumentum letöltése ...",
    error: "Ooopsz, valami félrement",
  });

  return downloadPdfPromise;
}
