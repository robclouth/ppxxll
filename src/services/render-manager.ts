import { makeAutoObservable, autorun } from "mobx";
import { Texture } from "three";
import ShadertoyMaterial from "./shadertoy-material";
import { Shader } from "../types";
import CameraManager from "./camera-manager";
import App from "./app";

class RenderManager {
  material: ShadertoyMaterial;

  canvas?: HTMLCanvasElement;

  isRenderingActive = true;

  shouldCapturePreview = false;
  latestPreviewUrl?: string;

  constructor() {
    makeAutoObservable(this);
    this.material = new ShadertoyMaterial();
  }

  init() {
    // React to input changes and update material textures
    autorun(() => {
      const textures = CameraManager.getPreviewTextures();
      this.material.updateInputTextures(textures);
    });
  }

  setShader(shader: Shader) {
    if (this.material) this.material.dispose();

    this.material = new ShadertoyMaterial(shader);
    if (this.canvas) {
      this.material.setSize(this.canvas.width, this.canvas.height);
    }

    const textures = CameraManager.getPreviewTextures();
    this.material.updateInputTextures(textures);
  }

  setPreviewCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  setPreviewCanvasSize(width: number, height: number) {
    this.material?.setSize(width, height);
  }

  setRenderingActive(active: boolean) {
    this.isRenderingActive = active;

    if (CameraManager.cameraTexture?.image) {
      if (active) (CameraManager.cameraTexture.image as HTMLVideoElement).play();
      else (CameraManager.cameraTexture.image as HTMLVideoElement).pause();
    }

    if (this.material) {
      this.material.shouldUpdateUniforms = active;
    }
  }

  async startPreviewCapture() {
    if (!this.material) return;

    // Capture high-res photos for all live camera inputs NOW (at shutter press time)
    await CameraManager.captureLiveInputs();

    this.shouldCapturePreview = true;
  }

  finishPreviewCapture(dataUrl: string) {
    this.latestPreviewUrl = dataUrl;
    this.shouldCapturePreview = false;
    this.setRenderingActive(false);
  }

  updateInputTextures(textures: (Texture | undefined)[]) {
    this.material.updateInputTextures(textures);
  }
}

export default new RenderManager();
