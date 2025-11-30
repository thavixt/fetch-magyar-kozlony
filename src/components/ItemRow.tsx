import { cn } from "@/lib/utils";
import type { Entry, ListItem } from "@/types";
import { downloadPdf } from "@/lib/download";
import { parsePdf } from "@/lib/parse";

interface ItemRowProps {
  isCurrent: boolean;
  item: ListItem;
  onLoad: (title: string, entries: Entry[][]) => void
}

export function ItemRow({ item, onLoad, isCurrent }: ItemRowProps) {
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
    <tr className={cn('table-row', { 'font-bold': isCurrent })}>
      <td className='table-cell truncate'>{item.date}</td>
      <td className='table-cell truncate'>{item.title}</td>
      <td className='table-cell truncate'>
        <button onClick={() => onDownload(item.download)} disabled={isCurrent}>Betöltés</button>
        <a href={item.view} target='__blank' className="ml-2">PDF</a>
      </td>
    </tr>
  )
}
