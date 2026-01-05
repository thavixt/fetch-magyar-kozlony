import { cn } from "@/lib/utils";
import type { ListItem } from "@/types";
import { downloadPdf, type PDFEntry } from "@/lib/download";
import { Button } from "./ui/button";

interface ItemRowProps {
  isCurrent: boolean;
  item: ListItem;
  onLoadStart: (title: string) => void;
  onLoadEnd: (title: string, entries: PDFEntry[]) => void;
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
    try {
      const entries = await downloadPdf(url);
      onLoadEnd(item.title ?? "", entries);
    } catch (e) {
      console.error(e);
      onLoadEnd("Ismeretlen hiba történt :(", []);
    }
  };

  return (
    <tr className={cn("table-row", { "font-extrabold": isCurrent })}>
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
