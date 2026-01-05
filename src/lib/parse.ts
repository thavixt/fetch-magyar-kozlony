import type { PDFEntry } from "./download";

export function getAsTable(entries: PDFEntry[]) {
  return `<table>
<tbody>
  ${entries
    .map(
      (e) => `<tr>
  <td>${e.title}</td>
  <td>${e.content}</td>
</tr>`,
    )
    .join("")}
</tbody>
</table>`;
}
