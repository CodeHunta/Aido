import { extractText, getDocumentProxy } from "unpdf";

/** Extract the text layer from a PDF. Scanned filings return an empty string. */
export async function pdfToText(data: Uint8Array): Promise<string> {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const noisy = (args: unknown[]) => typeof args[0] === "string" && args[0].startsWith("Warning:");
  console.log = (...args: unknown[]) => {
    if (noisy(args)) return;
    originalLog(...args);
  };
  console.warn = (...args: unknown[]) => {
    if (noisy(args)) return;
    originalWarn(...args);
  };
  try {
    const pdf = await getDocumentProxy(data);
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
  }
}
