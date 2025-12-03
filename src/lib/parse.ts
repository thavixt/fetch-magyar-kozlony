import { LINE_BREAK, IGNORED_HEADINGS } from "./const";
// @ts-expect-error mehhhhh
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import type { PDFDocumentLoadingTask } from "pdfjs-dist/types/src/pdf.d";
import type { TextItem } from "pdfjs-dist/types/src/display/api.d";
import { convertToRomanNumerals } from "./romanize";
import { type Entry, DocType } from "@/types";

function assertIsPdfTextItem(item: TextItem | unknown): item is TextItem {
  return typeof (item as TextItem).hasEOL === "boolean";
}

export async function parsePdf(
  title: string,
  pdfBytes: Uint8Array,
): Promise<Entry[][]> {
  const docType = title.includes("Hivatalos Értesítő")
    ? DocType.ERTESITO
    : DocType.KOZLONY;
  console.debug(`Parsing PDF: ${title} - ${docType}`);

  const loadingTask = pdfjsLib.getDocument({
    data: pdfBytes,
  }) as PDFDocumentLoadingTask;
  const pdf = await loadingTask.promise;

  let record = false;
  const blocks: Array<string[]> = [[]];
  let blockCount = 1;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    content.items.forEach((item) => {
      if (!assertIsPdfTextItem(item)) {
        return;
      }
      if (item.str.trim().length === 0) {
        return;
      }
      if (item.str === "Tartalomjegyzék") {
        record = true;
        return;
      }

      if (docType === DocType.ERTESITO) {
        const isNumberedHeading =
          new Array(10).fill(0).some((_v, i) => i + 1 >= blockCount) &&
          item.str.startsWith(`${convertToRomanNumerals(i + 1)}. `);
        if (
          item.height === 10 &&
          !item.str.includes(" FEJEZET") &&
          !isNumberedHeading
        ) {
          record = true;
          blockCount++;
          blocks.push([]);
          blocks[blockCount - 1].push(item.str);
          blocks[blockCount - 1].push("");
          blocks[blockCount - 1].push(LINE_BREAK);
          return;
        }
        if (item.height === 17) {
          record = false;
          return;
        }
        // else if (!record || item.height === 10 || item.height === 17) {
        //   record = false;
        //   return;
        // }
      }

      if (docType === DocType.KOZLONY) {
        if (!record || item.height === 10 || item.height === 17) {
          record = false;
          return;
        }
      }

      const text = item.str.replace(/^(\d{4})$/, `$1${LINE_BREAK}`);
      blocks[blockCount - 1].push(`${text} `);
    });
  }

  const docBlocks: Entry[][] = [];

  for (let block = 0; block < blockCount; block++) {
    let entryIndex = -1;
    let hadLineBreak = true;
    const entries: Entry[] = [{ id: "", name: "", num: "" }];

    for (let i = 0; i < blocks[block].length; i++) {
      if (blocks[block][i].includes(LINE_BREAK)) {
        hadLineBreak = true;
        entries[entryIndex].num = blocks[block][i].replace(LINE_BREAK, "");
        continue;
      }
      if (hadLineBreak) {
        hadLineBreak = false;
        entryIndex++;
        entries[entryIndex] = { id: "", name: "", num: "" };
        entries[entryIndex].id = blocks[block][i];
      } else {
        entries[entryIndex].name += blocks[block][i];
      }
    }

    docBlocks.push(
      entries.filter(
        (e) =>
          e.name &&
          !IGNORED_HEADINGS.some((ignored) => e.id.trim().includes(ignored)),
      ),
    );
  }

  const result = docBlocks.filter((arr) => !!arr.length);
  return result;
}
