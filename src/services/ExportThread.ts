import { expose } from "threads/worker";
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

async function finish() {
  if (!pngWriter) throw new Error("start() not called");
  const blob = pngWriter.finishAndGetBlob();
  return await blob.arrayBuffer();
}

expose({ start, addRowChunks, finish });
