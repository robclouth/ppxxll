import { makeAutoObservable } from "mobx";
import CameraManager from "./CameraManager";
import ShaderManager from "./ShaderManager";
import TextureManager from "./TextureManager";

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

  outputSize = {
    width: 1000,
    height: 1000,
  };

  constructor() {
    makeAutoObservable(this);
  }

  async init() {
    await Promise.all([
      ShaderManager.init(),
      CameraManager.init(),
      TextureManager.init(),
    ]);
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
