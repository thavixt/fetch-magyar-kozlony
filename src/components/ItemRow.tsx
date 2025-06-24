import { cn } from "@/lib/utils";
import type { Entry, ListItem } from "@/types";
import { downloadPdf } from "@/utils/download";
import { parsePdf } from "@/utils/parse";

export function ItemRow({ first, item, onLoad }: { first: boolean; item: ListItem; onLoad: (title: string, entries: Entry[]) => void }) {
  const onDownload = async (url: string) => {
    if (!url) {
      console.error('No URL provided for item', item);
      return;
    }
    const pdfBytes = await downloadPdf(url);
    const entries = await parsePdf(item.title, pdfBytes);
    onLoad(item.title ?? '', entries);
  }

  return (
    <tr className={cn('table-row', { 'font-bold': first })}>
      <td className='table-cell truncate'>{item.date}</td>
      <td className='table-cell truncate'>{item.title}</td>
      <td className='table-cell truncate'>
        <a href={item.view} target='__blank'>View PDF</a>
        <button onClick={() => onDownload(item.download)}>Load</button>
      </td>
    </tr>
  )
}
