import { toast } from "sonner";

export async function copyToClipboard(entries: Entry[][]): Promise<string> {
  // Convert to HTML table
  const htmlTable =
    '<table border="1" cellpadding="4" cellspacing="0" style="border-collapse: collapse;">' +
    entries.map(block => (
      block.map(entry => `<tr>
        <td>${entry.id}</td>
        <td>${entry.name}</td>
        <td>${entry.num}</td>
      </tr>`.trim()).join('')
    )).join('') +
    '</table>';

  // Copy to clipboard as HTML
  return navigator.clipboard.write([
    new ClipboardItem({
      "text/html": new Blob([htmlTable], { type: "text/html" }),
      "text/plain": new Blob([htmlTable], { type: "text/plain" }) // fallback
    })
  ]).then(() => {
    toast.success('Táblázat kimásolva - CTRL+V a beillesztéshez');
    return `<div style="max-width: 500px">${htmlTable}</div>`;
  }).catch(err => {
    const msg = `Attempting to copy contents failed: ${err}`;
    toast.error(msg);
    console.error(msg);
    return '-';
  });
}