import * as THREE from "three";

class CameraManager {
  renderer: any;
  camera: any;
  scene: any;

  wait() {
    return new Promise((resolve) => {
      setTimeout(resolve);
    });
  }

  setRenderParams(renderer: any, camera: any, scene: any) {
    this.renderer = renderer;
    this.camera = camera;
    this.scene = scene;
  }

  async takePicture() {
    const blob = await this.makeBigPng(8000, 8000);
    this.saveData(blob);
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

  async makeBigPng(width: number, height: number) {
    const pngRGBAWriter = new (window as any).dekapng.PNGRGBAWriter(
      width,
      height
    );

    const chunkWidth = 500;
    const chunkHeight = 500;

    // const progress = document.querySelector("#progress");
    function setProgress(p: number) {
      // progress.textContent = `${p * 100 | 0}%`;
    }

    setProgress(0);

    for (let chunkY = 0; chunkY < height; chunkY += chunkHeight) {
      const rowChunks = [];
      const localHeight = Math.min(chunkHeight, height - chunkY);

      for (let chunkX = 0; chunkX < width; chunkX += chunkWidth) {
        const localWidth = Math.min(chunkWidth, width - chunkX);

        const data = this.drawArea(
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

      setProgress(Math.min(1, (chunkY + chunkHeight) / height));
      await this.wait();
    }

    return pngRGBAWriter.finishAndGetBlob();
  }

  drawArea(
    width: number,
    height: number,
    chunkX: number,
    chunkY: number,
    chunkWidth: number,
    chunkHeight: number
  ) {
    this.renderer.setSize(chunkWidth, chunkHeight);

    this.camera.setViewOffset(
      width,
      height,
      chunkX,
      chunkY,
      chunkWidth,
      chunkHeight
    );
    this.camera.updateProjectionMatrix();

    this.renderer.render(this.scene, this.camera);

    const data = new Uint8Array(chunkWidth * chunkHeight * 4);
    const gl = this.renderer.context;
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
}

export default new CameraManager();
