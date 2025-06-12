import { useRef, useState } from 'react';
import { toast } from 'sonner';
// @ts-expect-error mehhhhh
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { Toaster } from './components/ui/sonner';

interface ListItem {
  date: string | null;
  title: string | null;
  url: string | null;
}

const proxyUrl = (url: string) => `https://corsproxy.io/?${url}`;

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
        const items = doc.querySelectorAll('.journal-row > div[itemscope]');
        const itemsArray = Array.from(items);

        const result = itemsArray.map(item => {
          const date = (item.querySelector('div.col-xs-3 > meta[itemprop=datePublished]')!.getAttribute('content') ?? '-');
          const title = (item.querySelector('div.col-xs-6 > a')!.textContent ?? '-').trim();
          const url = item.querySelector('a[href*="letoltes"]')!.getAttribute('href');
          return { date, title, url };
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
    (async function() {
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
    success: "Processed PDF file",
  });

  return downloadPdfPromise;
}

const SEPARATOR = 'Tartalomjegyzék';
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

  const regex = new RegExp(`${SEPARATOR}\\s+(.*)`, 'gm');
  const match = fullText.match(regex);
  let matchText = match?.join('') ?? '';
  matchText = matchText.replace(SEPARATOR, '').trim();

  const outputDiv = document.getElementById('output')!;
  outputDiv.innerText = "";
  outputDiv.innerText = matchText;
}

function App() {
  const [items, setItems] = useState<ListItem[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);

  const onClick = async () => {
    const itemsArray = await getLatestFromUrl(proxyUrl('https://magyarkozlony.hu/'));
    setItems(itemsArray)
  }

  const copyToClipboard = () => {
    if (!outputRef.current) {
      return;
    }

    console.clear();

    const text = outputRef.current.innerText;
    const splitText = text.replace(/(\d+\/2025)/g, '\n$1');
    const lines = splitText.split('\n').filter(Boolean);
    console.log(lines);

    const arr = lines.map((line) => ({
      col1: line.match(/(\d+\/2025)/g),
      col2: "",
      col3: "",
      col4: "",
    }));
    console.log(arr);

    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }

  return (
    <>
      <Toaster />
      <div className="flex flex-col gap-8 items-center">
        <div>
          <p>
            Click <button disabled>Fetch ...</button>,
            then <button disabled>Load</button> from a row,
            then <button disabled>Copy ...</button> the contents as table cells.
          </p>
        </div>
        <button onClick={onClick}>
          Fetch the latest from 'Magyar Közlöny'
        </button>
        <div className="flex gap-12">
          <table className='w-lg h-fit table-fixed'>
            <thead>
              <tr>
                <td width={125}>Date</td>
                <td width={400}>Title</td>
                <td width={100}>URL</td>
              </tr>
            </thead>
            <tbody>
              {items.length ? (
                items.map((item) => <ItemRow key={crypto.randomUUID().slice(0, 8)} item={item} />)
              ) : (
                <tr>
                  <td colSpan={3}>Empty - press the button above to load stuff</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className='flex flex-col gap-8 items-center w-full'>
            <div className='font-bold border-b-1 border-slate-600 w-full'>Table of contents:</div>
            <button className='w-fit' onClick={copyToClipboard}>
              Copy to clipboard for pasting into Excel
            </button>
            <div ref={outputRef} id="output" className="p-4 border rounded-lg w-[400px] max-h-[400px] overflow-y-scroll whitespace-pre-line">
              nothing yet - press 'Load' in a row
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function ItemRow({ item }: { item: ListItem }) {
  const onDownload = async (url: string | null) => {
    if (!url) {
      console.warn('No URL provided in', item);
      return;
    }
    const pdfBytes = await downloadPdf(url);
    await parsePdf(pdfBytes);
  }

  return (
    <tr className='table-row'>
      <td className='table-cell truncate'>{item.date}</td>
      <td className='table-cell truncate'>{item.title}</td>
      <td className='table-cell truncate'>
        <button onClick={() => onDownload(item.url)}>Load</button>
      </td>
    </tr>
  )
}

export default App
