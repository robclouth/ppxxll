import PNGWriter from "./dekapng/png-writer";

let pngWriter: PNGWriter | undefined;

function start(width: number, height: number) {
  pngWriter = new PNGWriter(width, height);
}

function addRowChunks(
  buffers: ArrayBuffer[],
  widths: number[],
  height: number
) {
  if (!pngWriter) throw new Error("start() not called");

  for (let row = height - 1; row >= 0; row--) {
    for (let i = 0; i < buffers.length; i++) {
      const rowSize = widths[i] * 4;
      const offset = rowSize * row;

      pngWriter.addPixels(new Uint8Array(buffers[i]), offset, widths[i]);
    }
  }
}

async function finish(): Promise<ArrayBuffer> {
  if (!pngWriter) throw new Error("start() not called");
  const blob = pngWriter.finishAndGetBlob();
  return await blob.arrayBuffer();
}

self.onmessage = async (e: MessageEvent) => {
  const { type, id, args } = e.data;

  try {
    let result: any;
    if (type === "start") {
      start(args.width, args.height);
      result = undefined;
    } else if (type === "addRowChunks") {
      addRowChunks(args.buffers, args.widths, args.height);
      result = undefined;
    } else if (type === "finish") {
      result = await finish();
      self.postMessage({ id, result }, { transfer: [result] } as any);
      return;
    }
    self.postMessage({ id, result });
  } catch (error: any) {
    self.postMessage({ id, error: error.message });
  }
};
