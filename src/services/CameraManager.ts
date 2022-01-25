import * as THREE from "three";
import { Size, Viewport } from "@react-three/fiber";
import { makeAutoObservable } from "mobx";
import ShaderToyMaterial from "../components/renderer/ShaderToyMaterial";
import { Shader } from "./ShaderManager";
import App from "./App";

const chunkWidth = 500;
const chunkHeight = 500;

class CameraManager {
  material: ShaderToyMaterial;

  isTakingPicture = false;
  isRecording = false;
  photoProgress = 0;
  viewport!: Viewport;

  mode: "photo" | "video" = "photo";
  mediaStream?: MediaStream;
  mediaRecorder?: MediaRecorder;
  cameraTexture?: THREE.VideoTexture;
  latestPhotoBlob?: Blob;
  latestPhotoUrl?: string;
  latestVideoBlob?: Blob;
  latestVideoUrl?: string;

  canvas?: HTMLCanvasElement;

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
    await this.detectCameras();
    await this.startVideoCapture();

    if (this.cameraTexture) this.setInputTexture(0, this.cameraTexture);
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
    } catch (error) {
      console.error(`Unable to get cameras: ${error}`);
    }
  }

  async startVideoCapture(preview = true) {
    try {
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((track) => {
          track.stop();
        });
      }

      if (this.cameraTexture) this.cameraTexture.dispose();

      const constraints = {
        audio: false,
        video: {
          width: { ideal: preview ? 1200 : 4000 },
          height: { ideal: preview ? 1200 * 0.75 : 3000 },
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

      console.log(`Stream res: ${width}:${height}`);

      const videoElement = document.createElement("video");
      videoElement.srcObject = this.mediaStream;
      videoElement.muted = true;
      videoElement.controls = false;
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.width = width!;
      videoElement.height = height!;
      await videoElement.play();

      const previousCameraTexture = this.cameraTexture;
      this.cameraTexture = new THREE.VideoTexture(videoElement);

      if (previousCameraTexture)
        this.inputTextures = this.inputTextures.map((texture) =>
          texture === previousCameraTexture ? this.cameraTexture : texture
        );

      if (this.material) this.material.updateInputTextures(this.inputTextures);
    } catch (error) {
      console.error(`Unable to start camera: ${error}`);
    }
  }

  setPreviewActive(active: boolean) {
    if (this.cameraTexture?.image) {
      if (active) this.cameraTexture.image.play();
      else this.cameraTexture.image.pause();
    }
  }

  switchCamera() {
    this.activeCamera = this.activeCamera === "front" ? "back" : "front";
    this.startVideoCapture();
  }

  setShader(shader: Shader) {
    if (this.material) this.material.dispose();

    this.material = new ShaderToyMaterial(shader);
    this.material?.setSize(this.canvas!.width, this.canvas!.height);
    this.material.updateInputTextures(this.inputTextures);
  }

  wait(ms = 0) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  setPreviewCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  setPreviewCanvasSize(width: number, height: number) {
    if (!this.isTakingPicture) this.material?.setSize(width, height);
  }

  setInputTexture(index: number, texture?: THREE.Texture) {
    this.inputTextures[index] = texture;
    this.material.updateInputTextures(this.inputTextures);
  }

  startRecording() {
    if (!this.canvas) return;

    try {
      const stream = this.canvas.captureStream(App.outputFps);
      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.addEventListener("dataavailable", (e) => {
        const videoData = [e.data];
        this.latestVideoBlob = new Blob(videoData, { type: "video/webm" });
        this.latestVideoUrl = URL.createObjectURL(this.latestVideoBlob);
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

  async takePicture() {
    if (!this.material) return;

    const outputSize = App.outputSize;

    this.isTakingPicture = true;
    this.photoProgress = 0;

    this.cameraTexture?.image.pause();
    this.material.shouldUpdateUniforms = false;

    if (this.mediaStream) {
      await this.startVideoCapture(false);
      await this.wait(500);
      this.cameraTexture?.image.pause();

      const mediaStreamTrack = this.mediaStream.getVideoTracks()[0];
      let { width, height } = mediaStreamTrack.getSettings();
      outputSize.width = width!;
      outputSize.height = height!;
    }

    this.material.setSize(outputSize.width, outputSize.height);
    const blob = await this.exportPng(
      this.material,
      outputSize.width,
      outputSize.height
    );
    this.latestPhotoBlob = blob;
    this.latestPhotoUrl = URL.createObjectURL(blob);

    await this.startVideoCapture(true);

    this.material.shouldUpdateUniforms = true;
    this.material.setSize(this.canvas!.width, this.canvas!.height);
    this.material.updateInputTextures(this.inputTextures);

    this.isTakingPicture = false;
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

      this.photoProgress = (chunkY + chunkHeight) / height;
      console.log(this.photoProgress);

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

  shareLatestPhoto() {
    if (!this.latestPhotoBlob) return;

    const filename = `${new Date().getTime()}.png`;
    const files = [
      new File([this.latestPhotoBlob], filename, {
        type: "image/png",
        lastModified: new Date().getTime(),
      }),
    ];

    if (navigator.canShare && navigator.canShare({ files })) {
      const shareData = {
        files,
      };
      navigator.share(shareData);
    } else throw "Share not available";
  }

  shareLatestVideo() {
    if (!this.latestVideoBlob) return;

    const filename = `${new Date().getTime()}.webm`;
    const files = [
      new File([this.latestVideoBlob], filename, {
        type: "video/webm",
        lastModified: new Date().getTime(),
      }),
    ];

    if (navigator.canShare && navigator.canShare({ files })) {
      const shareData = {
        files,
      };
      navigator.share(shareData);
    } else throw "Share not available";
  }

  downloadLatestPhoto() {
    if (!this.latestPhotoUrl) return;

    const filename = `${new Date().getTime()}.png`;

    const a = document.createElement<any>("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = this.latestPhotoUrl;
    a.download = filename;
    a.click();

    document.body.removeChild(a);
  }

  downloadLatestVideo() {
    if (!this.latestVideoUrl) return;

    const filename = `${new Date().getTime()}.webm`;

    const a = document.createElement<any>("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = this.latestVideoUrl;
    a.download = filename;
    a.click();

    document.body.removeChild(a);
  }
}

export default new CameraManager();
