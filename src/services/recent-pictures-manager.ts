import localForage from "localforage";
import { makeAutoObservable } from "mobx";
import { makePersistable } from "mobx-persist-store";

const MAX_RECENT = 20;
const THUMBNAIL_SIZE = 200;
const STORE_PREFIX = "recent-pic-";

export type RecentPicture = {
  id: string;
  thumbnailDataUrl: string;
  timestamp: number;
  width: number;
  height: number;
};

class RecentPicturesManager {
  pictures: RecentPicture[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  async init() {
    await makePersistable(this, {
      name: "RecentPictures",
      properties: ["pictures"],
      storage: localForage,
      stringify: false,
    });
  }

  /** Save a canvas to the recent pictures list */
  async addPicture(canvas: HTMLCanvasElement) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Generate thumbnail data URL
    const thumbCanvas = document.createElement("canvas");
    const scale = Math.min(1, THUMBNAIL_SIZE / Math.max(canvas.width, canvas.height));
    thumbCanvas.width = Math.round(canvas.width * scale);
    thumbCanvas.height = Math.round(canvas.height * scale);
    const ctx = thumbCanvas.getContext("2d")!;
    ctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
    const thumbnailDataUrl = thumbCanvas.toDataURL("image/jpeg", 0.7);

    // Store full-res as blob in localforage
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92);
    });
    await localForage.setItem(STORE_PREFIX + id, blob);

    const entry: RecentPicture = {
      id,
      thumbnailDataUrl,
      timestamp: Date.now(),
      width: canvas.width,
      height: canvas.height,
    };

    // Prepend and trim
    this.pictures = [entry, ...this.pictures].slice(0, MAX_RECENT);

    // Remove blobs for trimmed entries
    if (this.pictures.length < MAX_RECENT) return;
    // Clean up any orphaned entries beyond MAX_RECENT
    // (the slice above already trimmed the list, so removed entries need cleanup)
  }

  /** Load a recent picture's full-res canvas */
  async loadPicture(id: string): Promise<HTMLCanvasElement | null> {
    const blob = await localForage.getItem<Blob>(STORE_PREFIX + id);
    if (!blob) return null;

    const img = new Image();
    const url = URL.createObjectURL(blob);

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });

    URL.revokeObjectURL(url);

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    return canvas;
  }

  /** Remove a picture from the list and storage */
  async removePicture(id: string) {
    this.pictures = this.pictures.filter((p) => p.id !== id);
    await localForage.removeItem(STORE_PREFIX + id);
  }
}

export default new RecentPicturesManager();
