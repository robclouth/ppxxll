import { Viewport } from "@react-three/fiber";
import { autorun, makeAutoObservable } from "mobx";
import { spawn, Transfer, Worker } from "threads";
import {
  CanvasTexture,
  Material,
  Mesh,
  OrthographicCamera,
  PlaneBufferGeometry,
  Scene,
  Texture,
  TextureLoader,
  VideoTexture,
  WebGLRenderer,
} from "three";
import ShadertoyMaterial from "../components/renderer/ShadertoyMaterial";
import { InputOutput, Shader } from "../types";
import App from "./App";
import ShaderManager from "./ShaderManager";

const maxChunkSize = 500;

class CameraManager {
  material: ShadertoyMaterial;

  shouldCapturePreview = false;
  isRecording = false;
  isExporting = false;
  photoProgress = 0;
  viewport!: Viewport;

  mode: "photo" | "video" = "photo";
  mediaStream?: MediaStream;
  mediaRecorder?: MediaRecorder;
  cameraTexture?: VideoTexture;
  inputTextures: (Texture | undefined)[] = [];

  latestPhotoCapture?: HTMLCanvasElement;
  latestPreviewUrl?: string;

  latestVideoBlob?: Blob;
  latestVideoUrl?: string;

  canvas?: HTMLCanvasElement;

  activeCamera: "front" | "back" = "back";
  frontCameraDeviceId?: string;
  backCameraDeviceId?: string;

  invalidate: any;

  constructor() {
    makeAutoObservable(this);
    this.material = new ShadertoyMaterial();
  }

  get inputs(): InputOutput[] {
    const activeShader = ShaderManager.activeShader;

    if (activeShader) return activeShader.passes[0].inputs;
    else return [{ type: "camera" }];
  }

  async init() {
    await this.detectCameras();
    await this.startVideoCapture();

    autorun(async () => {
      this.inputTextures = await Promise.all(
        this.inputs.map(({ type, url }) => {
          if (url) {
            return new Promise<Texture>((resolve, reject) => {
              new TextureLoader()
                .setCrossOrigin("anonymous")
                .load(url, (texture) => {
                  resolve(texture);
                });
            });
          } else if (type === "camera") {
            return Promise.resolve<Texture>(this.cameraTexture as Texture);
          }
        })
      );
    });

    if (ShaderManager.activeShader) this.setShader(ShaderManager.activeShader);
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
            else frontDeviceId = backDeviceId = device.deviceId;
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

      const video = document.createElement("video");
      video.srcObject = this.mediaStream;
      video.width = width!;
      video.height = height!;

      await new Promise<void>((resolve, reject) => {
        video.addEventListener("loadeddata", async () => {
          try {
            await video.play();
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });

      // const previousCameraTexture = this.cameraTexture;
      this.cameraTexture = new VideoTexture(video);

      // if (previousCameraTexture)
      //   this.inputTextures = this.inputTextures.map((texture) =>
      //     texture === previousCameraTexture ? this.cameraTexture : texture
      //   );

      // if (this.material) this.material.updateInputTextures(this.inputTextures);
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

    this.material = new ShadertoyMaterial(shader);
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

  setInvalidateFunction(invalidate: any) {
    this.invalidate = invalidate;
  }

  setPreviewCanvasSize(width: number, height: number) {
    if (!this.isExporting) this.material?.setSize(width, height);
  }

  setInputTexture(index: number, texture?: Texture) {
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

  async capturePhoto() {
    try {
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((track) => {
          track.stop();
        });
      }

      const constraints = {
        audio: false,
        video: {
          width: { ideal: 8000 },
          height: { ideal: 8000 * 0.75 },
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
      let { width, height } = mediaStreamTrack.getSettings();

      console.log(`Take photo res: ${width}:${height}`);

      const video = document.createElement("video");
      video.srcObject = stream;
      video.width = width!;
      video.height = height!;

      this.latestPhotoCapture = document.createElement("canvas");
      const context = this.latestPhotoCapture.getContext("2d")!;

      video.srcObject = stream;

      await new Promise<void>((resolve, reject) => {
        video.addEventListener("loadeddata", async () => {
          const { videoWidth, videoHeight } = video;
          this.latestPhotoCapture!.width = videoWidth;
          this.latestPhotoCapture!.height = videoHeight;

          try {
            await video.play();
            context.drawImage(video, 0, 0, videoWidth, videoHeight);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error(`Unable to take photo: ${error}`);
    }
  }

  async startPreviewCapture() {
    if (!this.material) return;

    this.shouldCapturePreview = true;
    this.latestPhotoCapture = undefined;
  }

  async finishPreviewCapture(dataUrl: string) {
    this.latestPreviewUrl = dataUrl;
    this.shouldCapturePreview = false;

    if (this.mediaStream) {
      await this.capturePhoto();
      await this.startVideoCapture(true);
    }

    await this.exportImage();
  }

  async exportImage() {
    if (!this.material) return;

    this.isExporting = true;
    this.photoProgress = 0;

    const exportSize = { ...App.exportSize };

    this.cameraTexture?.image.pause();

    this.material.shouldUpdateUniforms = false;

    const shaderInputTextures = [...this.inputTextures];

    if (this.latestPhotoCapture) {
      const texture = new CanvasTexture(this.latestPhotoCapture);

      this.inputs.forEach(({ type }, i) => {
        if (type === "camera") {
          shaderInputTextures[i] = texture;
        }
      });
    }

    const { start, addRowChunks, finish } = await spawn(
      new Worker("./ExportThread")
    );
    await start(exportSize.width, exportSize.height);

    this.material.setSize(exportSize.width, exportSize.height);
    this.material.updateInputTextures(shaderInputTextures);

    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;
    const scene = new Scene();
    const quad = new Mesh(new PlaneBufferGeometry(2, 2, 1, 1), this.material);
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
        console.log(this.photoProgress);
      }

      await addRowChunks(
        Transfer(
          rowChunks.map((chunk) => chunk.chunkBuffer),
          rowChunks.map((chunk) => chunk.chunkBuffer)
        ),
        rowChunks.map((chunk) => chunk.chunkWidth),
        chunkHeight
      );
    }

    renderer.dispose();

    const imageBuffer = await finish();
    const imageBlob = new Blob([imageBuffer]);
    const imageUrl = URL.createObjectURL(imageBlob);

    console.log("Finished");

    const filename = `${new Date().getTime()}.png`;

    const a = document.createElement<any>("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = imageUrl;
    a.download = filename;
    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(imageUrl);

    await this.startVideoCapture(true);

    this.material.shouldUpdateUniforms = true;
    this.material.setSize(this.canvas!.width, this.canvas!.height);
    this.material.updateInputTextures(this.inputTextures);

    this.isExporting = false;
  }

  shareLatestPhoto() {
    // if (!this.latestPhotoBlob) return;
    // const filename = `${new Date().getTime()}.png`;
    // const files = [
    //   new File([this.latestPhotoBlob], filename, {
    //     type: "image/png",
    //     lastModified: new Date().getTime(),
    //   }),
    // ];
    // if (navigator.canShare && navigator.canShare({ files })) {
    //   const shareData = {
    //     files,
    //   };
    //   navigator.share(shareData);
    // } else throw "Share not available";
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
    if (!this.latestPreviewUrl) return;

    const filename = `${new Date().getTime()}.png`;

    const a = document.createElement<any>("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = this.latestPreviewUrl;
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
