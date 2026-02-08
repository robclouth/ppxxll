import { configure, makeAutoObservable } from "mobx";
import CameraManager from "./camera-manager";
import ShaderManager from "./shader-manager";
import TextureManager from "./texture-manager";
import { Cache } from "three";

Cache.enabled = true;
configure({
  enforceActions: "never",
});

class App {
  isPointerDown = false;
  pointerPosition = {
    x: 0,
    y: 0,
  };
  pointerDownPosition = {
    x: 0,
    y: 0,
  };

  exportSize = {
    width: 4000,
    height: 4000,
  };

  outputFps = 30;

  constructor() {
    makeAutoObservable(this);
  }

  async init() {
    await Promise.all([ShaderManager.init(), TextureManager.init()]);
    await CameraManager.init();
  }

  setPointerDown(x: number, y: number) {
    this.isPointerDown = true;
    this.pointerDownPosition = {
      x,
      y,
    };
    this.pointerPosition = {
      x,
      y,
    };

    CameraManager.material.updateMouseUniforms(
      this.isPointerDown,
      this.pointerPosition,
      this.pointerDownPosition
    );
  }

  setPointerUp(x: number, y: number) {
    this.isPointerDown = false;

    CameraManager.material.updateMouseUniforms(
      this.isPointerDown,
      this.pointerPosition,
      this.pointerDownPosition
    );
  }

  setPointerPosition(x: number, y: number) {
    this.pointerPosition = {
      x,
      y,
    };

    CameraManager.material.updateMouseUniforms(
      this.isPointerDown,
      this.pointerPosition,
      this.pointerDownPosition
    );
  }
}

export default new App();
