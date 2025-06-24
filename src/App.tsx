import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { type Entry, type ListItem } from './types';
import { getLatestFromUrl } from './utils/download';
import { ItemRow } from './components/ItemRow';

export default function App() {
  const tableRef = useRef<HTMLTableElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);
  const [currentPDFEntries, setCurrentPDFEntries] = useState<Entry[]>([]);

  const onClick = async () => {
    const itemsArray = await getLatestFromUrl('https://magyarkozlony.hu/');
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setItems(itemsArray)
  }

  const onRowLoaded = (title: string, entries: Entry[]) => {
    console.log('Loaded PDF:', title);
    toast.success(`Preview: ${entries[0].id} ${entries[0].name} ...`);

    if (titleRef.current) {
      titleRef.current.innerText = title;
    }
    setCurrentPDFEntries(entries);

    if (!outputRef.current) {
      return;
    }
    outputRef.current.innerText = `${entries.map(e => (
      `${e.id} ${e.name} ${e.num}\n`
    ))}`;

    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const copyToClipboard = () => {
    if (!outputRef.current) {
      return;
    }

    // Convert to HTML table
    const htmlTable =
      '<table border="1" cellpadding="4" cellspacing="0" style="border-collapse: collapse;">' +
      currentPDFEntries.map(entry =>
        `<tr>
          <td>${entry.id}</td>
          <td>${entry.name}</td>
          <td>${entry.num}</td>
        </tr>`.trim()
      ).join('') +
      '</table>';

    // Copy to clipboard as HTML
    navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([htmlTable], { type: "text/html" }),
        "text/plain": new Blob([htmlTable], { type: "text/plain" }) // fallback
      })
    ]).then(() => {
      toast.success('Table copied to clipboard for pasting into an email - press CTRL-V in the email body');
      if (outputRef.current) {
        outputRef.current.innerHTML = `<div style="max-width: 500px">${htmlTable}</div>`;
      }
    }).catch(err => {
      const msg = `Attempting to copy contents failed: ${err}`;
      toast.error(msg);
      console.error(msg);
    });
  }

  return (
    <>
      <Toaster />
      <div className="flex flex-col gap-8 items-center">
        <div>
          <p>
            Click <button disabled>Fetch ...</button>,
            then <button disabled>Load</button> from a row,
            and  <button disabled>Copy ...</button> the contents as table cells,
          </p>
        </div>
        <button onClick={onClick}>
          Fetch the latest from 'Magyar Közlöny'
        </button>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <table ref={tableRef} className=''>
            <thead>
              <tr>
                <td width={125}>Date</td>
                <td width={400}>Title</td>
                <td width={200}>Actions</td>
              </tr>
            </thead>
            <tbody>
              {items.length ? (
                items.map((item, i) => (
                  <ItemRow first={i === 0} key={crypto.randomUUID().slice(0, 8)} item={item} onLoad={onRowLoaded} />
                ))
              ) : (
                <tr>
                  <td colSpan={3}>Empty - press the button above to load stuff</td>
                </tr>
              )}
            </tbody>
          </table>
          <div ref={contentRef} className='flex flex-col gap-8 items-center w-full'>
            <div className='font-bold border-b-1 border-slate-600 w-full'>Table of contents:</div>
            <button className='w-fit' onClick={copyToClipboard}>
              Copy as a table
            </button>
            <div className="flex flex-col gap-2">
              <h2 className='font-bold'>Current document:</h2>
              <h2 ref={titleRef}>-</h2>
            </div>
            <div ref={outputRef} id="output" className="p-4 border rounded-lg w-[600px] max-h-[400px] overflow-y-auto whitespace-pre-line">
              nothing yet - press 'Load' in a row
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
