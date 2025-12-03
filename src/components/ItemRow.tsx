import { cn } from "@/lib/utils";
import type { Entry, ListItem } from "@/types";
import { downloadPdf } from "@/lib/download";
import { parsePdf } from "@/lib/parse";
import { Button } from "./ui/button";

interface ItemRowProps {
  isCurrent: boolean;
  item: ListItem;
  onLoadStart: (title: string) => void;
  onLoadEnd: (title: string, entries: Entry[][]) => void;
}

export function ItemRow({
  item,
  onLoadStart,
  onLoadEnd,
  isCurrent,
}: ItemRowProps) {
  const onDownload = async (url: string) => {
    onLoadStart(item.title ?? "");
    if (!url) {
      console.error("No URL provided for item", item);
      return;
    }
    const pdfBytes = await downloadPdf(url);
    const entries = await parsePdf(item.title, pdfBytes);
    onLoadEnd(item.title ?? "", entries);
  };

  return (
    <tr className={cn("table-row", { "font-bold": isCurrent })}>
      <td className="table-cell truncate">{item.date}</td>
      <td className="table-cell truncate">{item.title}</td>
      <td className="table-cell truncate">
        <a href={item.view} target="__blank" className="m1-2">
          PDF
        </a>
        <Button
          onClick={() => onDownload(item.download)}
          disabled={isCurrent}
          className="ml-2"
          variant="ghost">
          Betöltés
        </Button>
      </td>
    </tr>
  );
}
