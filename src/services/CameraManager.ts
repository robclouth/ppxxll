import * as THREE from "three";
import { Size, Viewport } from "@react-three/fiber";
import { makeAutoObservable } from "mobx";
import ShaderToyMaterial from "../components/renderer/ShaderToyMaterial";
import { Shader } from "./ShaderManager";

const chunkWidth = 500;
const chunkHeight = 500;

class CameraManager {
  material: ShaderToyMaterial;

  isExporting = false;
  exportProgress = 0;
  viewport!: Viewport;

  imageCapture?: ImageCapture;
  cameraTexture?: THREE.VideoTexture;

  inputTextures: (THREE.Texture | undefined)[] = [
    undefined,
    undefined,
    undefined,
    undefined,
  ];

  constructor() {
    makeAutoObservable(this);
    this.material = new ShaderToyMaterial();
  }

  async init() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const constraints = {
        video: { width: 1280, height: 720, facingMode: "user" },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      const mediaStreamTrack = mediaStream.getVideoTracks()[0];
      let { width, height } = mediaStreamTrack.getSettings();

      const videoElement = document.createElement("video");
      videoElement.srcObject = mediaStream;
      videoElement.muted = true;
      videoElement.controls = false;
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.width = width!;
      videoElement.height = height!;
      videoElement.play();

      this.cameraTexture = new THREE.VideoTexture(videoElement);

      this.imageCapture = new ImageCapture(mediaStreamTrack);

      this.setInputTexture(0, this.cameraTexture);
    } catch (error) {
      console.error("enumerateDevices() error:", error);
    }
  }

  setShader(shader: Shader) {
    if (this.material) this.material.dispose();

    this.material = new ShaderToyMaterial(shader?.passes[0].code);
    this.material.updateInputTextures(this.inputTextures);
  }

  wait() {
    return new Promise((resolve) => {
      setTimeout(resolve);
    });
  }

  setViewport(viewport: Viewport, size: Size) {
    this.viewport = viewport;

    if (!this.isExporting) this.material?.resize(size.width, size.height);
  }

  setInputTexture(index: number, texture?: THREE.Texture) {
    this.inputTextures[index] = texture;
    this.material.updateInputTextures(this.inputTextures);
  }

  async takePicture(width: number, height: number) {
    if (!this.material) return;

    this.setExporting(true);
    this.exportProgress = 0;
    this.material.shouldUpdateUniforms = false;
    this.material.resize(width, height);
    const blob = await this.exportPng(width, height);
    this.saveData(blob);
    this.material.shouldUpdateUniforms = true;
    this.setExporting(false);
  }

  setExporting(isExporting: boolean) {
    this.isExporting = isExporting;
  }

  async exportPng(width: number, height: number) {
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;
    const scene = new THREE.Scene();
    const quad = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(2, 2, 1, 1),
      this.material
    );
    scene.add(quad);

    const renderer = new THREE.WebGLRenderer({ alpha: true });

    const pngRGBAWriter = new (window as any).dekapng.PNGRGBAWriter(
      width,
      height
    );

    for (let chunkY = 0; chunkY < height; chunkY += chunkHeight) {
      const rowChunks = [];
      const localHeight = Math.min(chunkHeight, height - chunkY);

      for (let chunkX = 0; chunkX < width; chunkX += chunkWidth) {
        const localWidth = Math.min(chunkWidth, width - chunkX);

        const data = this.drawArea(
          renderer,
          camera,
          scene,
          width,
          height,
          chunkX,
          chunkY,
          localWidth,
          localHeight
        );
        rowChunks.push(data);
      }

      for (let row = 0; row < localHeight; ++row) {
        rowChunks.forEach((chunk, ndx) => {
          const rowSize = chunk.width * 4;
          const chunkOffset = rowSize * row;
          pngRGBAWriter.addPixels(chunk.data, chunkOffset, chunk.width);
        });
      }

      this.exportProgress = (chunkY + chunkHeight) / height;

      await this.wait();
    }

    renderer.dispose();

    return pngRGBAWriter.finishAndGetBlob();
  }

  drawArea(
    renderer: THREE.WebGLRenderer,
    camera: THREE.OrthographicCamera,
    scene: THREE.Scene,
    width: number,
    height: number,
    chunkX: number,
    chunkY: number,
    chunkWidth: number,
    chunkHeight: number
  ) {
    renderer.setSize(chunkWidth, chunkHeight);

    camera.setViewOffset(
      width,
      height,
      chunkX,
      chunkY,
      chunkWidth,
      chunkHeight
    );
    camera.updateProjectionMatrix();

    renderer.render(scene, camera);

    const data = new Uint8Array(chunkWidth * chunkHeight * 4);
    const gl = renderer.getContext();

    gl.readPixels(
      0,
      0,
      chunkWidth,
      chunkHeight,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      data
    );

    // swap lines (should probably just fix code in makeBigPng to read backward
    const lineSize = chunkWidth * 4;
    const line = new Uint8Array(lineSize);
    const numLines = (chunkHeight / 2) | 0;
    for (let i = 0; i < numLines; ++i) {
      const topOffset = lineSize * i;
      const bottomOffset = lineSize * (chunkHeight - i - 1);
      line.set(data.slice(topOffset, topOffset + lineSize), 0);
      data.set(data.slice(bottomOffset, bottomOffset + lineSize), topOffset);
      data.set(line, bottomOffset);
    }
    return {
      width: chunkWidth,
      height: chunkHeight,
      data: data,
    };
  }

  saveData(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement<any>("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = URL.createObjectURL(blob);
    a.download = "test.png";
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export default new CameraManager();
