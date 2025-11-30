import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { type Entry, type ListItem } from './types';
import { getLatestFromUrl } from './lib/download';
import { ItemRow } from './components/ItemRow';
import { getAiOverview, isAiEnabled, setAiEnabled } from './lib/gemini';
import { copyToClipboard } from './lib/clipboard';

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

  const onAiEnabledChange = (enabled: boolean) => {
    setAi(enabled);
    setAiEnabled(enabled);
  }

  const onClick = async () => {
    tableBlinkRef.current?.classList.remove("borderedBlink");
    setItems([]);
    setCurrentPDFEntries([]);
    const itemsArray = await getLatestFromUrl('https://magyarkozlony.hu/');
    setItems(itemsArray);
    setTimeout(() => tableBlinkRef.current?.classList.add("borderedBlink"), 250);
  }

  const onRowLoaded = async (title: string, entries: Entry[][]) => {
    outputRef.current?.classList.remove("borderedBlink");
    toast.dismiss();
    setCurrent(title);
    console.debug('Loaded PDF:', title);
    toast.success(`PDF betöltve: ${title}`);
    if (titleRef.current) {
      titleRef.current.innerText = title;
    }
    setCurrentPDFEntries(entries);
    if (aiRef.current) {
      aiRef.current.textContent = "-";
    }
    if (!outputRef.current) {
      return;
    }
    outputRef.current.innerText = `${entries.map(b => (
      b.map(entry => `${entry.id} ${entry.name} ${entry.num}\n`).join('')
    ))}`;

    if (ai) {
      toast.dismiss();
      aiBlinkRef.current?.classList.remove("borderedBlink");
      const aiPromise = new Promise<string>((resolve, reject) => {
        (async function () {
          const aiOverview = await getAiOverview(entries[0]);
          if (aiOverview.code !== 0) {
            reject(aiOverview)
          }
          if (aiRef.current) {
            aiRef.current.textContent = aiOverview.text;
          }
          setTimeout(() => aiBlinkRef.current?.classList.add("borderedBlink"), 250);
          resolve(aiOverview.text);
        })();
      });
      toast.promise<string>(aiPromise, {
        loading: "AI összefoglaló generálása...",
        error: 'Ooopsz, valami félrement',
      });
    }
    setTimeout(() => outputRef.current?.classList.add("borderedBlink"), 250);
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
      <div className="h-full w-full grid grid-cols-1 grid-rows-[100px_auto_50px]">
        <div className='flex flex-row align-middle items-center justify-center gap-4'>
          <div>
            <button onClick={onClick}>
              Aktuális Magyar közlöny lista letöltése
            </button>
          </div>
          <div className='flex items-center justify-center gap-1'>
            <label htmlFor="ai">AI összefoglaló:</label>
            <input type="checkbox" name="ai" id="ai" onChange={e => onAiEnabledChange(e.target.checked)} checked={ai} />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className='flex flex-col items-center'>
            <div ref={tableBlinkRef} className="bordered">
              <table ref={tableRef}>
                <thead>
                  <tr>
                    <td width={125}>Dátum</td>
                    <td width={400}>Cím</td>
                    <td width={200}></td>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <ItemRow key={item.title} item={item} onLoad={onRowLoaded} isCurrent={current === item.title} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={`grid grid-cols-1 grid-rows-[auto_auto] gap-4`}>
            <div className="flex flex-col items-center bordered" ref={docBlinkRef}>
              <div>Aktuális dokumentum:</div>
              <div className='font-bold' ref={titleRef}></div>
              <button className='w-fit' onClick={onCopyToClipboard} disabled={!(currentPDFEntries.length)}>
                Másolás táblázatként
              </button>
              <div ref={outputRef} id="output" className="p-4 rounded-lg w-[600px] max-h-[400px] overflow-y-auto whitespace-pre-line text-xs bordered">
                Üres - nyomd meg a 'Betöltés' gombot egy sorban
              </div>
            </div>
            {ai ? (
              <div ref={aiBlinkRef} className='flex flex-col items-center bordered'>
                <div className='font-bold'>AI összefoglaló:</div>
                <div id="ai-overview" ref={aiRef} className='w-[600px] max-h-[400px] overflow-y-auto whitespace-pre-line text-xs' />
              </div>) : <div />}
          </div>
        </div>

        <div className='pt-8'>
          <p className='text-xs'>
            Kattints a <button disabled>... letöltés ...</button>,
            majd a <button disabled>Betöltés</button>,
            végül a <button disabled>Másolás ...</button> gombra a táblázatban.
          </p>
        </div>
      </div>
    </>
  )
}
