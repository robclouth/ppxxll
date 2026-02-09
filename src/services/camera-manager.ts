import { makeAutoObservable } from "mobx";
import {
  CanvasTexture,
  Texture,
  VideoTexture,
} from "three";
import { InputOutput } from "../types";
import ShaderManager from "./shader-manager";

const PREVIEW_MAX_DIM = 1200;
const LOAD_TIMEOUT_MS = 10000;

function downsizeToCanvas(
  source: HTMLCanvasElement,
  maxDim: number
): HTMLCanvasElement {
  const { width, height } = source;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export type InputCapture = {
  fullRes: HTMLCanvasElement;
  previewTexture: CanvasTexture;
  /** true if this was auto-captured from a live camera input at shutter time */
  fromLive?: boolean;
};

class CameraManager {
  mediaStream?: MediaStream;
  cameraTexture?: VideoTexture;

  activeCamera: "front" | "back" = "back";
  frontCameraDeviceId?: string;
  backCameraDeviceId?: string;

  /** Per-input captured photo data (index -> capture) */
  inputCaptures: { [index: number]: InputCapture } = {};

  /** Whether we're in "capture for input" mode */
  capturingForInput: number | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get inputs(): InputOutput[] {
    const activeShader = ShaderManager.activeShader;
    if (activeShader) return activeShader.passes[0].inputs;
    return [{ type: "camera" }];
  }

  async init() {
    await this.detectCameras();
    await this.startVideoStream();

    // On mobile browsers the OS can revoke camera access when the tab is
    // backgrounded.  Re-acquire the stream when the user returns.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && this.mediaStream) {
        const track = this.mediaStream.getVideoTracks()[0];
        if (!track || track.readyState === "ended") {
          console.warn("Camera track lost while hidden, restarting stream");
          this.startVideoStream();
        }
      }
    });
  }

  async detectCameras() {
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      const devices = await navigator.mediaDevices.enumerateDevices();
      let frontDeviceId;
      let backDeviceId;
      if (devices.length > 0) {
        frontDeviceId = devices[0].deviceId;
        backDeviceId = devices[0].deviceId;
      }
      devices.forEach((device) => {
        if (device.kind === "videoinput") {
          if (device.label && device.label.length > 0) {
            if (device.label.toLowerCase().indexOf("back") >= 0)
              backDeviceId = device.deviceId;
            else if (device.label.toLowerCase().indexOf("front") >= 0)
              frontDeviceId = device.deviceId;
            else frontDeviceId = backDeviceId = device.deviceId;
          }
        }
      });
      this.frontCameraDeviceId = frontDeviceId;
      this.backCameraDeviceId = backDeviceId;
      tempStream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      console.error(`Unable to get cameras: ${error}`);
    }
  }

  async startVideoStream(preview = true) {
    try {
      this.stopCurrentStream();

      const constraints = {
        audio: false,
        video: {
          width: { ideal: preview ? 1200 : 4000 },
          height: { ideal: preview ? 900 : 3000 },
          deviceId: {
            exact:
              this.activeCamera === "front"
                ? this.frontCameraDeviceId
                : this.backCameraDeviceId,
          },
        },
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      const mediaStreamTrack = this.mediaStream.getVideoTracks()[0];
      const { width, height } = mediaStreamTrack.getSettings();
      console.log(`Stream res: ${width}:${height}`);

      // Restart the stream if the track ends unexpectedly (e.g. tab
      // backgrounded on mobile, OS-level camera revocation, device
      // disconnect).
      mediaStreamTrack.addEventListener("ended", () => {
        console.warn("Camera track ended unexpectedly, restarting stream");
        this.startVideoStream(preview);
      }, { once: true });

      const video = document.createElement("video");
      video.srcObject = this.mediaStream;
      video.width = width!;
      video.height = height!;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Timed out waiting for camera video data"));
        }, LOAD_TIMEOUT_MS);

        video.addEventListener("loadeddata", async () => {
          clearTimeout(timeout);
          try {
            await video.play();
            resolve();
          } catch (error) {
            reject(error);
          }
        }, { once: true });
      });

      this.cameraTexture = new VideoTexture(video);
    } catch (error) {
      console.error(`Unable to start camera: ${error}`);
    }
  }

  private stopCurrentStream() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
    }
    if (this.cameraTexture) this.cameraTexture.dispose();
  }

  async switchCamera() {
    this.activeCamera = this.activeCamera === "front" ? "back" : "front";
    await this.startVideoStream();
  }

  /** Capture a high-res photo from the camera and return it as a canvas */
  async captureHighResPhoto(): Promise<HTMLCanvasElement> {
    // Stop current stream temporarily
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
    }

    const constraints = {
      audio: false,
      video: {
        width: { ideal: 8000 },
        height: { ideal: 6000 },
        deviceId: {
          exact:
            this.activeCamera === "front"
              ? this.frontCameraDeviceId
              : this.backCameraDeviceId,
        },
      },
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const mediaStreamTrack = stream.getVideoTracks()[0];
    const { width, height } = mediaStreamTrack.getSettings();
    console.log(`Capture res: ${width}:${height}`);

    const video = document.createElement("video");
    video.srcObject = stream;
    video.width = width!;
    video.height = height!;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timed out waiting for high-res camera data"));
      }, LOAD_TIMEOUT_MS);

      video.addEventListener("loadeddata", async () => {
        clearTimeout(timeout);
        const { videoWidth, videoHeight } = video;
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        try {
          await video.play();
          ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
          resolve();
        } catch (error) {
          reject(error);
        }
      }, { once: true });
    });

    stream.getTracks().forEach((track) => track.stop());
    return canvas;
  }

  /** Capture a photo for a specific input index */
  async captureForInput(index: number) {
    this.capturingForInput = index;

    try {
      const fullRes = await this.captureHighResPhoto();
      const preview = downsizeToCanvas(fullRes, PREVIEW_MAX_DIM);
      const previewTexture = new CanvasTexture(preview);

      // Dispose old capture texture if exists
      this.inputCaptures[index]?.previewTexture.dispose();

      this.inputCaptures = {
        ...this.inputCaptures,
        [index]: { fullRes, previewTexture },
      };

      // Update the input type
      const input = this.inputs[index];
      if (input) input.type = "captured";
    } finally {
      this.capturingForInput = null;
      await this.startVideoStream(true);
    }
  }

  /** Set an input back to live camera */
  setInputToCamera(index: number) {
    const input = this.inputs[index];
    if (input) input.type = "camera";

    // Dispose and remove capture
    this.inputCaptures[index]?.previewTexture.dispose();
    const { [index]: _, ...rest } = this.inputCaptures;
    this.inputCaptures = rest;
  }

  /** Clear an input (same as setting to camera) */
  clearInput(index: number) {
    this.setInputToCamera(index);
  }

  /** Get the preview texture for an input (either camera or captured) */
  getInputTexture(index: number): Texture | undefined {
    const input = this.inputs[index];
    if (!input) return undefined;

    if (input.type === "captured" && this.inputCaptures[index]) {
      return this.inputCaptures[index].previewTexture;
    }
    return this.cameraTexture;
  }

  /** Get all input textures for preview rendering */
  getPreviewTextures(): (Texture | undefined)[] {
    return this.inputs.map((_, i) => this.getInputTexture(i));
  }

  /** Capture high-res photos for all live camera inputs (called at shutter press time) */
  async captureLiveInputs() {
    const hasLiveInput = this.inputs.some((input) => input.type === "camera");
    if (!hasLiveInput) return;

    const fullRes = await this.captureHighResPhoto();

    // Store the capture for every live input
    this.inputs.forEach((input, i) => {
      if (input.type === "camera") {
        const preview = downsizeToCanvas(fullRes, PREVIEW_MAX_DIM);
        this.inputCaptures[i]?.previewTexture.dispose();
        this.inputCaptures = {
          ...this.inputCaptures,
          [i]: { fullRes, previewTexture: new CanvasTexture(preview), fromLive: true },
        };
        input.type = "captured";
      }
    });

    await this.startVideoStream(true);
  }

  /** Restore all captured-from-live inputs back to live camera */
  restoreLiveInputs() {
    this.inputs.forEach((input, i) => {
      // Only restore inputs that were captured from live (not user-chosen photos)
      if (input.type === "captured" && this.inputCaptures[i]?.fromLive) {
        input.type = "camera";
        this.inputCaptures[i]?.previewTexture.dispose();
        const { [i]: _, ...rest } = this.inputCaptures;
        this.inputCaptures = rest;
      }
    });
  }

  /** Get all input textures for export (full-res, already captured at shutter time) */
  getExportTextures(): (Texture | undefined)[] {
    return this.inputs.map((input, i) => {
      if (this.inputCaptures[i]) {
        return new CanvasTexture(this.inputCaptures[i].fullRes);
      }
      return this.cameraTexture;
    });
  }

  /** Load an image from a file and set it as a captured input */
  async setInputFromFile(index: number, file: File) {
    const img = new Image();
    const url = URL.createObjectURL(file);

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });

    const fullRes = document.createElement("canvas");
    fullRes.width = img.naturalWidth;
    fullRes.height = img.naturalHeight;
    const ctx = fullRes.getContext("2d")!;
    ctx.drawImage(img, 0, 0);

    URL.revokeObjectURL(url);

    const preview = downsizeToCanvas(fullRes, PREVIEW_MAX_DIM);
    const previewTexture = new CanvasTexture(preview);

    this.inputCaptures[index]?.previewTexture.dispose();
    this.inputCaptures = {
      ...this.inputCaptures,
      [index]: { fullRes, previewTexture },
    };

    const input = this.inputs[index];
    if (input) input.type = "captured";
  }
}

export default new CameraManager();
