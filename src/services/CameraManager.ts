import * as THREE from "three";
import { Size, Viewport } from "@react-three/fiber";
import { makeAutoObservable } from "mobx";
import ShaderToyMaterial from "../components/renderer/ShaderToyMaterial";
import { Shader } from "./ShaderManager";
import App from "./App";

const chunkWidth = 1000;
const chunkHeight = 1000;

class CameraManager {
  material: ShaderToyMaterial;

  isExporting = false;
  exportProgress = 0;
  viewport!: Viewport;

  imageCapture?: ImageCapture;
  mediaStream?: MediaStream;
  cameraTexture?: THREE.VideoTexture;

  canvasWidth = 0;
  canvasHeight = 0;

  inputTextures: (THREE.Texture | undefined)[] = [
    undefined,
    undefined,
    undefined,
    undefined,
  ];

  activeCamera: "front" | "back" = "back";
  frontCameraDeviceId?: string;
  backCameraDeviceId?: string;

  constructor() {
    makeAutoObservable(this);
    this.material = new ShaderToyMaterial();
  }

  async init() {
    try {
      await this.detectCameras();
      await this.startVideoCapture();

      this.setInputTexture(0, this.cameraTexture);
    } catch (error) {
      console.error("enumerateDevices() error:", error);
    }
  }

  async detectCameras() {
    const tempStream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    const devices = await navigator.mediaDevices.enumerateDevices();
    let frontDeviceId;
    let backDeviceId;
    if (devices.length > 0) {
      /* defaults so all this will work on a desktop */
      frontDeviceId = devices[0].deviceId;
      backDeviceId = devices[0].deviceId;
    }
    /* look for front and back devices */
    devices.forEach((device) => {
      if (device.kind === "videoinput") {
        if (device.label && device.label.length > 0) {
          if (device.label.toLowerCase().indexOf("back") >= 0)
            backDeviceId = device.deviceId;
          else if (device.label.toLowerCase().indexOf("front") >= 0)
            frontDeviceId = device.deviceId;
        }
      }
    });

    this.frontCameraDeviceId = frontDeviceId;
    this.backCameraDeviceId = backDeviceId;

    tempStream.getTracks().forEach((track) => {
      track.stop();
    });
  }

  async startVideoCapture() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    if (this.cameraTexture) this.cameraTexture.dispose();

    const constraints = {
      audio: false,
      video: {
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
    let { width, height } = mediaStreamTrack.getSettings();

    const videoElement = document.createElement("video");
    videoElement.srcObject = this.mediaStream;
    videoElement.muted = true;
    videoElement.controls = false;
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    videoElement.width = width!;
    videoElement.height = height!;
    videoElement.play();

    const previousCameraTexture = this.cameraTexture;
    this.cameraTexture = new THREE.VideoTexture(videoElement);

    this.imageCapture = new ImageCapture(mediaStreamTrack);

    if (previousCameraTexture)
      this.inputTextures = this.inputTextures.map((texture) =>
        texture === previousCameraTexture ? this.cameraTexture : texture
      );

    if (this.material) this.material.updateInputTextures(this.inputTextures);
  }

  switchCamera() {
    this.activeCamera = this.activeCamera === "front" ? "back" : "front";
    this.startVideoCapture();
  }

  setShader(shader: Shader) {
    if (this.material) this.material.dispose();

    this.material = new ShaderToyMaterial(shader);
    this.material?.setSize(this.canvasWidth, this.canvasHeight);
    this.material.updateInputTextures(this.inputTextures);
  }

  wait() {
    return new Promise((resolve) => {
      setTimeout(resolve);
    });
  }

  setCanvasSize(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;

    if (!this.isExporting) this.material?.setSize(width, height);
  }

  setInputTexture(index: number, texture?: THREE.Texture) {
    this.inputTextures[index] = texture;
    this.material.updateInputTextures(this.inputTextures);
  }

  async takePicture() {
    if (!this.material) return;

    const outputSize = App.outputSize;

    this.setExporting(true);
    this.exportProgress = 0;

    this.cameraTexture?.image.pause();
    this.material.shouldUpdateUniforms = false;

    if (this.imageCapture) {
      const blob = await this.imageCapture.takePhoto();
      const photoImg = document.createElement("img");
      photoImg.src = URL.createObjectURL(blob);
      await photoImg.decode();

      outputSize.width = photoImg.width;
      outputSize.height = photoImg.height;

      const photoTexture = new THREE.Texture(photoImg);
      photoTexture.needsUpdate = true;

      const newInputTextures = this.inputTextures.map((tex) =>
        tex === this.cameraTexture ? photoTexture : tex
      );
      this.material.updateInputTextures(newInputTextures);
    }

    this.material.setSize(outputSize.width, outputSize.height);

    const blob = await this.exportPng(
      this.material,
      outputSize.width,
      outputSize.height
    );
    this.saveData(blob);

    this.cameraTexture?.image.play();
    this.material.shouldUpdateUniforms = true;
    this.material.setSize(this.canvasWidth, this.canvasHeight);
    this.material.updateInputTextures(this.inputTextures);
    this.setExporting(false);
  }

  setExporting(isExporting: boolean) {
    this.isExporting = isExporting;
  }

  async exportPng(material: THREE.Material, width: number, height: number) {
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;
    const scene = new THREE.Scene();
    const quad = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(2, 2, 1, 1),
      material
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
