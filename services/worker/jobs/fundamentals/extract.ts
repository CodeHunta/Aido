import { extractText, getDocumentProxy } from "unpdf";

// unpdf 2.x embeds a PDF.js build that uses the `Iterator` global. Node 20 and
// older do not define it, which surfaced in CI as
// "PDF.js could not be resolved: ReferenceError: Iterator is not defined".
// Fail once, with the actual fix, instead of per filing.
const NODE_MAJOR = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
if (NODE_MAJOR < 24) {
  throw new Error(
    `Financial extraction needs Node.js 24 or newer (running ${process.version}). ` +
      "unpdf/PDF.js uses the Iterator global, which older Node versions do not provide.",
  );
}

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
