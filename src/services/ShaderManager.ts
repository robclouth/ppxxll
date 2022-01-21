import { makeAutoObservable } from "mobx";
import CameraManager from "./CameraManager";

export type InputType = "camera" | "image";

export type InputOutput = {
  id: string;
  src: string;
  type: InputType;
};

export type Pass = {
  code: string;
  inputs: InputOutput[];
  outputs: InputOutput[];
};

export type Shader = {
  id: string;
  name: string;
  description: string;
  author: string;
  passes: Pass[];
  thumbnailUrl?: string;
};

const ctypeToType: { [ctype: string]: string } = {
  webcam: "camera",
  image: "image",
};

class ShaderManager {
  shaders: { [id: string]: Shader } = {};

  activeShader?: Shader;

  constructor() {
    makeAutoObservable(this);
  }

  async init() {
    await Promise.all([
      this.addShaderToyShader("ftKSWz"),
      this.addShaderToyShader("XsjGDt"),
      this.addShaderToyShader("XdcXzn"),
    ]);
  }

  async addShaderToyShader(id: string) {
    const json = await (
      await fetch(`https://www.shadertoy.com/api/v1/shaders/${id}?key=fd8K4m`)
    ).json();

    if (json.Shader.renderpass.length > 1)
      throw "Multi-pass shaders not yet supported";

    const info = json.Shader.info;

    this.shaders[info.id] = {
      id: info.id,
      name: info.name,
      description: info.description,
      author: info.username,
      passes: json.Shader.renderpass.map((pass: any) => ({
        code: pass.code,
        inputs: pass.inputs.map((input: any) => ({
          id: input.id.toString(),
          type: ctypeToType[input.ctype],
          src: input.src,
        })),
        outputs: pass.outputs.map((input: any) => ({
          id: input.id.toString(),
          type: [input.ctype],
          src: input.src,
        })),
      })),
    };
  }

  setShader(shader: Shader) {
    this.activeShader = shader;
    CameraManager.setShader(this.activeShader);
  }
}

export default new ShaderManager();
