import { type Entry, DocType } from "@/types";
import { LINE_BREAK, HEADING } from "./const";
// @ts-expect-error mehhhhh
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import type { PDFDocumentLoadingTask } from 'pdfjs-dist/types/src/pdf.d';
import type { TextItem } from 'pdfjs-dist/types/src/display/api.d';

function assertIsPdfTextItem(item: TextItem | unknown): item is TextItem {
  return typeof (item as TextItem).hasEOL === 'boolean';
}

export async function parsePdf(title: string, pdfBytes: Uint8Array): Promise<Entry[]> {
  console.clear();
  const docType = title.includes('Hivatalos Értesítő') ? DocType.ERTESITO : DocType.KOZLONY;
  console.log(`Parsing PDF: ${title} - ${docType}`);

  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes }) as PDFDocumentLoadingTask;
  const pdf = await loadingTask.promise;

  let record = false;
  const blocks: Array<string> = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    content.items.forEach((item) => {
      if (!assertIsPdfTextItem(item)) {
        return;
      }
      if (!item.str.trim()) {
        return;
      }

      if (item.str === 'Tartalomjegyzék') {
        record = true;
        return;
      }
      if (!record || item.height === 10) {
        record = false;
      console.log('DEBUG', item);
        return;
      }

      const text = item.str.replace(/^(\d{4})$/, `$1${LINE_BREAK}`);
      blocks.push(`${text} `);
    });
  }
  console.log(blocks);

  const entries: Entry[] = [{ id: '', name: '', num: '' }];
  let entryIndex = -1;
  let hadLineBreak = true;

  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].includes(LINE_BREAK)) {
      hadLineBreak = true;
      entries[entryIndex].num = blocks[i].replace(LINE_BREAK, '');
      continue;
    }

    if (hadLineBreak) {
      hadLineBreak = false;
      entryIndex++;
      entries[entryIndex] = { id: '', name: '', num: '' };
      entries[entryIndex].id = blocks[i];
    } else {
      entries[entryIndex].name += blocks[i];
    }
  }

  console.log(entries);
  return entries.filter(e => e.id.trim() !== HEADING);
}