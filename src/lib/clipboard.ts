import { toast } from "sonner";

export async function copyToClipboard(text: string): Promise<void> {
  navigator.clipboard
    .write([
      new ClipboardItem({
        "text/html": new Blob([text], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" }), // fallback
      }),
    ])
    .then(() => {
      toast.success("Táblázat kimásolva - CTRL+V a beillesztéshez");
    })
    .catch((err) => {
      const msg = `Attempting to copy contents failed: ${err}`;
      toast.error(msg);
      console.error(msg);
    });
}
