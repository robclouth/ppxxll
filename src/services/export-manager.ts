import { makeAutoObservable } from "mobx";
import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer,
} from "three";
import App from "./app";
import CameraManager from "./camera-manager";
import RenderManager from "./render-manager";

const maxChunkSize = 500;

let messageId = 0;
const pendingMessages = new Map<number, { resolve: Function; reject: Function }>();

function createExportWorker() {
  const worker = new Worker(
    new URL("./export-thread.ts", import.meta.url),
    { type: "module" }
  );
  worker.onmessage = (e: MessageEvent) => {
    const { id, result, error } = e.data;
    const pending = pendingMessages.get(id);
    if (pending) {
      pendingMessages.delete(id);
      if (error) pending.reject(new Error(error));
      else pending.resolve(result);
    }
  };
  return worker;
}

function callWorker(
  worker: Worker,
  type: string,
  args: any,
  transfer?: Transferable[]
): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = messageId++;
    pendingMessages.set(id, { resolve, reject });
    if (transfer) {
      worker.postMessage({ type, id, args }, transfer);
    } else {
      worker.postMessage({ type, id, args });
    }
  });
}

class ExportManager {
  isExporting = false;
  photoProgress = 0;

  latestExportBlob?: Blob;

  mode: "photo" | "video" = "photo";
  isRecording = false;
  mediaRecorder?: MediaRecorder;
  latestVideoBlob?: Blob;

  constructor() {
    makeAutoObservable(this);
  }

  async exportImage() {
    const material = RenderManager.material;
    if (!material) return;

    this.isExporting = true;
    this.photoProgress = 0;

    const exportSize = { ...App.exportSize };

    // Get full-res textures for all inputs
    const exportTextures = await CameraManager.getExportTextures();

    material.setSize(exportSize.width, exportSize.height);
    material.updateInputTextures(exportTextures);

    const worker = createExportWorker();
    await callWorker(worker, "start", {
      width: exportSize.width,
      height: exportSize.height,
    });

    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;
    const scene = new Scene();
    const quad = new Mesh(new PlaneGeometry(2, 2, 1, 1), material);
    scene.add(quad);

    const renderer = new WebGLRenderer({ alpha: true });

    const totalChunks =
      Math.ceil(exportSize.width / maxChunkSize) *
      Math.ceil(exportSize.height / maxChunkSize);
    let numChunksProcessed = 0;

    for (let chunkY = 0; chunkY < exportSize.height; chunkY += maxChunkSize) {
      const chunkHeight = Math.min(maxChunkSize, exportSize.height - chunkY);

      const rowChunks = [];
      for (let chunkX = 0; chunkX < exportSize.width; chunkX += maxChunkSize) {
        const chunkWidth = Math.min(maxChunkSize, exportSize.width - chunkX);
        const chunkBuffer = new ArrayBuffer(chunkWidth * chunkHeight * 4);

        renderer.setSize(chunkWidth, chunkHeight);

        camera.setViewOffset(
          exportSize.width,
          exportSize.height,
          chunkX,
          chunkY,
          chunkWidth,
          chunkHeight
        );
        camera.updateProjectionMatrix();

        renderer.render(scene, camera);

        const gl = renderer.getContext();
        const uintArray = new Uint8Array(chunkBuffer);

        gl.readPixels(
          0,
          0,
          chunkWidth,
          chunkHeight,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          uintArray
        );

        rowChunks.push({ chunkBuffer, chunkWidth, chunkHeight });
        numChunksProcessed++;
        this.photoProgress = numChunksProcessed / totalChunks;
      }

      const buffers = rowChunks.map((chunk) => chunk.chunkBuffer);
      await callWorker(
        worker,
        "addRowChunks",
        {
          buffers,
          widths: rowChunks.map((chunk) => chunk.chunkWidth),
          height: chunkHeight,
        },
        buffers
      );
    }

    renderer.dispose();

    const imageBuffer = await callWorker(worker, "finish", {});
    this.latestExportBlob = new Blob([imageBuffer]);

    worker.terminate();

    // Dispose export textures
    exportTextures.forEach((t) => t?.dispose());

    // Restore preview size and textures
    const canvas = RenderManager.canvas;
    if (canvas) material.setSize(canvas.width, canvas.height);
    const previewTextures = CameraManager.getPreviewTextures();
    material.updateInputTextures(previewTextures);

    // Restart camera stream
    await CameraManager.startVideoStream(true);

    this.isExporting = false;
  }

  startRecording() {
    const canvas = RenderManager.canvas;
    if (!canvas) return;

    try {
      const stream = canvas.captureStream(App.outputFps);
      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.addEventListener("dataavailable", (e) => {
        this.latestVideoBlob = new Blob([e.data], { type: "video/webm" });
      });
      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (err) {
      console.error(err);
    }
  }

  stopRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  async shareExport() {
    if (!this.latestExportBlob) await this.exportImage();
    this.shareFile(this.latestExportBlob!, "png");
  }

  shareVideo() {
    if (this.latestVideoBlob) this.shareFile(this.latestVideoBlob, "webm");
  }

  private shareFile(blob: Blob, extension: string) {
    const filename = `${new Date().getTime()}.${extension}`;
    const files = [
      new File([blob], filename, {
        type: extension === "png" ? "image/png" : "video/webm",
        lastModified: new Date().getTime(),
      }),
    ];

    if (navigator.canShare && navigator.canShare({ files })) {
      navigator.share({ files });
    } else throw new Error("Share not available");
  }

  async downloadExport() {
    if (!this.latestExportBlob) await this.exportImage();

    const url = URL.createObjectURL(this.latestExportBlob!);
    this.downloadFile(url, "png");
    URL.revokeObjectURL(url);
  }

  downloadVideo() {
    if (!this.latestVideoBlob) return;

    const url = URL.createObjectURL(this.latestVideoBlob);
    this.downloadFile(url, "webm");
    URL.revokeObjectURL(url);
  }

  private downloadFile(url: string, extension: string) {
    const filename = `${new Date().getTime()}.${extension}`;
    const a = document.createElement("a");
    document.body.appendChild(a);
    (a as any).style = "display: none";
    a.href = url;
    a.download = filename;
    a.click();
    document.body.removeChild(a);
  }
}

export default new ExportManager();
