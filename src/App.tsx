import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { type Entry, type ListItem } from './types';
import { getLatestFromUrl } from './lib/download';
import { ItemRow } from './components/ItemRow';
import { getAiOverview, isAiEnabled, setAiEnabled } from './lib/gemini';
import { copyToClipboard } from './lib/clipboard';
import { Button } from './components/ui/button';
import { Spinner } from './components/ui/spinner';
import { Skeleton } from './components/ui/skeleton';

const rand = (opt1: unknown, opt2: unknown) => Math.random() > 0.5 ? opt1 : opt2;

function Loader({ rows, size }: { rows: number; size?: "md" | "lg" }) {
  return (
    <div className='flex flex-col items-center gap-1 w-[400px] gap-4'>
      <Button variant="secondary" disabled size="sm">
        <Spinner />
        Betöltés...
      </Button>
      <div className='flex flex-col items-start gap-1 w-full'>
        {new Array(rows).fill(null).map((_, i) => {
          const h = `${size === "lg" ? 'h-8' : 'h-4'}`;
          const w = `${rand('w-full', rand('w-1/2', 'w-1/3'))}`;
          return (
            <Skeleton key={i} className={`${h} ${w} bg-gray-300`} />
          )
        })}
      </div>
    </div>
  )
}

export default function App() {
  const tableRef = useRef<HTMLTableElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const tableBlinkRef = useRef<HTMLDivElement>(null);
  const docBlinkRef = useRef<HTMLDivElement>(null);
  const aiBlinkRef = useRef<HTMLDivElement>(null);

  const [current, setCurrent] = useState('');
  const [items, setItems] = useState<ListItem[]>([]);
  const [currentPDFEntries, setCurrentPDFEntries] = useState<Entry[][]>([]);
  const [ai, setAi] = useState(isAiEnabled());

  const [tableLoading, setTableLoading] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const onAiEnabledChange = (enabled: boolean) => {
    setAi(enabled);
    setAiEnabled(enabled);
  }

  const onLoadList = async () => {
    setTableLoading(true);
    tableBlinkRef.current?.classList.remove("borderedBlink");
    setItems([]);
    setCurrentPDFEntries([]);
    const itemsArray = await getLatestFromUrl('https://magyarkozlony.hu/');
    setItems(itemsArray);
    setTimeout(() => {
      tableBlinkRef.current?.scrollIntoView({ behavior: "smooth" });
      tableBlinkRef.current?.classList.add("borderedBlink");
    }, 250);
    setTableLoading(false);
  }

  const onRowLoadStart = () => {
    setDocLoading(true);
    if (outputRef.current) {
      outputRef.current.innerText = '';
    }
    if (aiRef.current) {
      aiRef.current.textContent = '';
    }
  }

  const onRowLoadEnd = async (title: string, entries: Entry[][]) => {
    console.debug('Loaded PDF:', title);
    outputRef.current?.classList.remove("borderedBlink");
    setDocLoading(true);
    setCurrent(title);
    toast.dismiss();
    toast.success(`Dokumentum letöltve: ${title}`);

    if (titleRef.current) {
      titleRef.current.innerText = title;
    }

    setCurrentPDFEntries(entries);
    if (aiRef.current) {
      aiRef.current.textContent = "-";
    }

    setDocLoading(false);

    if (ai) {
      toast.dismiss();
      aiBlinkRef.current?.classList.remove("borderedBlink");
      const aiPromise = new Promise<string>((resolve, reject) => {
        (async function () {
          setAiLoading(true);
          const aiOverview = await getAiOverview(entries[0]);
          if (aiOverview.code !== 0) {
            reject(aiOverview)
          }
          if (aiRef.current) {
            aiRef.current.textContent = aiOverview.text;
          }
          setTimeout(() => {
            aiBlinkRef.current?.scrollIntoView({ behavior: "smooth" });
            aiBlinkRef.current?.classList.add("borderedBlink");
          }, 250);
          setAiLoading(false);
          resolve(aiOverview.text);
        })();
      });
      toast.promise<string>(aiPromise, {
        loading: "AI összefoglaló generálása...",
        error: 'Ooopsz, valami félrement',
      });
    }

    if (!outputRef.current) {
      return;
    }

    outputRef.current.innerText = `${entries.map(b => (
      b.map(entry => `${entry.id} ${entry.name} ${entry.num}\n`).join('')
    ))}`;
    setTimeout(() => {
      outputRef.current?.scrollIntoView({ behavior: "smooth" });
      outputRef.current?.classList.add("borderedBlink");
    }, 250);
  }

  const onCopyToClipboard = async () => {
    if (!outputRef.current || !currentPDFEntries.length) {
      return;
    }

    const htmlTable = await copyToClipboard(currentPDFEntries);
    outputRef.current.innerHTML = `<div style="max-width: 500px">${htmlTable}</div>`;
  }

  return (
    <>
      <Toaster />
      <div className="w-full flex flex-col xs:flex-row">
        <div className='flex flex-row align-middle items-center justify-center gap-4'>
          <div>
            <Button onClick={onLoadList}>
              Aktuális Magyar közlöny lista letöltése
            </Button>
          </div>
          <div className='flex items-center justify-center gap-1'>
            <label
              title='Kérek egy rövid összefoglalót a dokumentum tartalomjegyzéke alapján'
              htmlFor="ai"
              className='cursor-help'
            >
              AI összefoglaló:
            </label>
            <input
              type="checkbox"
              id="ai"
              name="ai"
              onChange={e => onAiEnabledChange(e.target.checked)}
              checked={ai}
            />
          </div>
        </div>

        <div className='flex flex-col lg:flex-row gap-4 items-center justify-between'>
          <div ref={tableBlinkRef} className="bordered flex items-center">
            {tableLoading ? <Loader rows={15} size="lg" /> : (
              <table ref={tableRef} className='min-h-[500px]'>
                <thead>
                  <tr>
                    <td width={125}>Dátum</td>
                    <td width={400}>Cím</td>
                    <td width={200}></td>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <ItemRow key={item.title} item={item} onLoadStart={onRowLoadStart} onLoadEnd={onRowLoadEnd} isCurrent={current === item.title} />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex flex-col xs:flex-row gap-4 min-h-[500px]">
            <div className="flex flex-col items-center bordered gap-2" ref={docBlinkRef}>
              <div>Aktuális dokumentum:</div>
              <div className='font-bold' ref={titleRef}>-</div>
              {docLoading ? <Loader rows={5} /> : (
                <Button className='w-fit' onClick={() => onCopyToClipboard()} disabled={!(currentPDFEntries.length)}>
                  Másolás táblázatként
                </Button>
              )}
              <div ref={outputRef} id="output" className="p-4 rounded-lg w-[600px] max-h-[300px] overflow-y-auto whitespace-pre-line text-xs bordered">
                Üres - nyomd meg a 'Betöltés' gombot egy sorban
              </div>
            </div>
            {ai ? (
              <div>
                <hr className='mb-6' />
                <div className='font-bold'>AI összefoglaló:</div>
                <div ref={aiBlinkRef} className='flex flex-col items-center bordered gap-2'>
                  {aiLoading ? <Loader rows={5} /> : null}
                  <div id="ai-overview" ref={aiRef} className='w-[600px] max-h-[400px] overflow-y-auto whitespace-pre-line text-xs' />
                </div>
              </div>
            ) : <div />}
          </div>
        </div>

        <div className='pt-8 text-xs flex flex-col gap-2 p-2'>
          <p>
            Kattints a <Button size="sm" disabled>... letöltés ...</Button>,
            majd a <Button size="sm" disabled>Betöltés</Button>,
            végül a <Button size="sm" disabled>Másolás ...</Button> gombra a táblázatban.
          </p>
          <div>
            forrás: <a rel='noopener' target='_blank' href="http://github.com/thavixt/fetch-magyar-kozlony">github</a>
          </div>
        </div>
      </div>
    </>
  )
}
