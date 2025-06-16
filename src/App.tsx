import { useRef, useState } from 'react';
import { toast } from 'sonner';
// @ts-expect-error mehhhhh
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { Toaster } from './components/ui/sonner';
import { cn } from './lib/utils';

interface ListItem {
  date: string;
  title: string;
  download: string;
  view: string;
}

const proxyUrl = (url: string) => `https://corsproxy.io/?${url}`;

const PLACEHOLDER_TEXT = '< not found >';

async function getLatestFromUrl(url: string): Promise<ListItem[]> {
  console.log('Fetching items from ', url);

  const itemsPromise = new Promise<ListItem[]>((resolve, reject) => {
    (async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch HTML: ${response.statusText}`);
        }
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const fresh = doc.querySelector('.fresh-row > div[itemscope]');
        const rest = doc.querySelectorAll('.journal-row > div[itemscope]');
        const items = [fresh, ...rest];
        const itemsArray = Array.from(items).filter(Boolean) as Element[];

        const result = itemsArray.map(item => {
          const date = (item.querySelector('meta[itemprop=datePublished]')?.getAttribute('content') ?? PLACEHOLDER_TEXT).trim();
          const title = (item.querySelector('b[itemprop=name]')?.textContent ?? PLACEHOLDER_TEXT).trim();
          const download = item.querySelector('a[href*="letoltes"]')?.getAttribute('href') ?? '';
          const view = item.querySelector('a[href*="megtekintes"]')?.getAttribute('href') ?? '';
          return { date, title, download, view };
        });
        resolve(result);
      } catch (error) {
        reject(error);
      }
    })();
  });

  toast.promise<ListItem[]>(itemsPromise, {
    loading: "Loading stuff...",
    success: "Loaded latest items",
  });

  return itemsPromise;
}

async function downloadPdf(url: string): Promise<Uint8Array> {
  console.log('Download PDF from:', url);

  const downloadPdfPromise = new Promise<Uint8Array>((resolve) => {
    (async function () {
      const response = await fetch(proxyUrl(url));
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('pdf')) {
        const text = await response.text();
        console.error('Not a PDF! Content-Type:', contentType, 'First 200 chars:', text.slice(0, 200));
        throw new Error('Fetched file is not a PDF');
      }
      const arrayBuffer = await response.arrayBuffer() as Uint8Array;
      resolve(arrayBuffer);
    })();
  })

  toast.promise<Uint8Array>(downloadPdfPromise, {
    loading: "Loading PDF file...",
    // success: "Processed PDF file",
    error: 'Oops, something went wrong :(',
  });

  return downloadPdfPromise;
}

async function parsePdf(pdfBytes: Uint8Array) {
  console.log('Parsing PDF');

  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: { str: string }) => item.str).join(' ');
    fullText += pageText + '\n';
  }

  const match = fullText.match(/Tartalomjegyzék\s+(.*)/gm);
  let matchText = match?.join('') ?? '';
  matchText = matchText.replace('Tartalomjegyzék', '').trim();

  const outputDiv = document.getElementById('output')!;
  outputDiv.innerText = "";
  outputDiv.innerText = matchText;
  // console.log(matchText);

  return `${matchText.slice(0, 100)}...`;
}

function App() {
  const tableRef = useRef<HTMLTableElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);

  const onClick = async () => {
    const itemsArray = await getLatestFromUrl(proxyUrl('https://magyarkozlony.hu/'));
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setItems(itemsArray)
  }

  const onRowLoaded = (title: string, previewText: string) => {
    console.log('Viewing PDF:', title);
    toast.success(`Preview: ${previewText}`);
    if (titleRef.current) {
      titleRef.current.innerText = title;
    }
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const copyToClipboard = () => {
    if (!outputRef.current) {
      return;
    }

    const text = outputRef.current.innerText;
    const splitText = text
      .replace(/(\d+\/2025)/g, '\n$1')
      .replace(/(\d+\/.évi)/g, '\n$1')
      // .replace(/(\s\d+\s)/g, '\n$1')
      ;
    const lines = splitText.split('\n').filter((line) => !!line && !line.includes('Utasítások')).map(line => line.trim());

    const arr = lines.map((raw) => {
      const cleaned = raw
        .replace(/\t+/g, ' ') // replace tabs
        .replace(/\n+/g, ' ') // replace line feeds
        .replace(/\s+/g, ' ') // replace multiple spaces
        ;
      const line = cleaned.trim();

      let match = line.match(/^(.*?(?:rendelet|törvény|utasítás|módósítása|módosításáról|határozat))\s(.*)\s(\d+)/);

      if (!match || match.length < 4) {
        // guess its a law or something else?
        match = line.match(/(\d+\.\sévi\s[A-Z]+\.\störvény)\s(.*)\s(\d*)$/);
        if (!match?.length || match.length !== 4) {
          console.error('Ooops, couldn\'t parse that! Probably an ugly PDF there...', raw);
          return [raw, '', ''];
        }
        return [match[1], match[2], match[3]]
      }

      return [match[1], match[2], match[3]];
    });

    // Convert to HTML table
    const htmlTable =
      '<table border="1" cellpadding="4" cellspacing="0" style="border-collapse: collapse;">' +
      arr.map(row =>
        '<tr>' + row.map(cell => `<td>${cell}</td>`).join('') + '</tr>'
      ).join('') +
      '</table>';

    // Copy to clipboard as HTML
    navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([htmlTable], { type: "text/html" }),
        "text/plain": new Blob([htmlTable], { type: "text/plain" }) // fallback
      })
    ]).then(() => {
      toast.success('Table copied to clipboard for pasting into an email\n- just press CTRL-V');
      if (outputRef.current) {
        outputRef.current.innerHTML = `<div style="max-width: 500px">${htmlTable}</div>`;
      }
    }).catch(err => {
      const msg = `Copy failed: ${err}`;
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

function ItemRow({ first, item, onLoad }: { first: boolean; item: ListItem; onLoad: (title: string, previewText: string) => void }) {
  const onDownload = async (url: string) => {
    if (!url) {
      console.error('No URL provided for item', item);
      return;
    }
    const pdfBytes = await downloadPdf(url);
    const preview = await parsePdf(pdfBytes);
    onLoad(item.title ?? '', preview);
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

export default App
