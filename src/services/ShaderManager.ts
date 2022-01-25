import { makeAutoObservable, runInAction } from "mobx";
import CameraManager from "./CameraManager";
import { isPersisting, makePersistable } from "mobx-persist-store";
import localForage from "localforage";

const supportedTypes = ["float"];

export type Parameter = {
  name: string;
  type: string;
  defaultValue: number;
  minValue: number;
  maxValue: number;
  value: number;
};

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
  parameters: { [name: string]: Parameter };
};

export type Shader = {
  id: string;
  name: string;
  description: string;
  author: string;
  passes: Pass[];
  thumbnailUrl?: string;
};
const parameterPattern =
  /(const)?\s+(\w+)\s+(\w+)\s+=\s+(.*);\s+\/\/\s*@param\s+(min\s+(.*)),\s*(max\s+(.*))/g;

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
    await makePersistable(this, {
      name: "Shaders",
      properties: ["shaders"],
      storage: localForage,
      stringify: false,
    });

    if (Object.keys(this.shaders).length === 0) {
      await Promise.all([
        this.addShaderToyShader("ftKSWz"),
        this.addShaderToyShader("NsfcWf"),
        this.addShaderToyShader("fdscD2"),
      ]);
    }
  }

  async addShaderToyShader(id: string) {
    const json = await (
      await fetch(`https://www.shadertoy.com/api/v1/shaders/${id}?key=fd8K4m`)
    ).json();

    if (json.Shader.renderpass.length > 1)
      throw "Multi-pass shaders not yet supported";

    runInAction(() => {
      const info = json.Shader.info;

      this.shaders[info.id] = {
        id: info.id,
        name: info.name,
        description: info.description,
        author: info.username,
        passes: json.Shader.renderpass.map((pass: any) => ({
          ...this.parseParameters(pass.code),
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
    });
  }

  deleteShader(id: string) {
    delete this.shaders[id];
  }

  setShader(shader: Shader) {
    this.activeShader = shader;
    CameraManager.setShader(this.activeShader);
  }

  parseParameters(code: string) {
    const matches = Array.from(code.matchAll(parameterPattern));

    const parameters: { [name: string]: Parameter } = {};

    for (const match of matches) {
      const type = match[2];
      const name = match[3];
      const defaultValue = parseFloat(match[4]);
      const value = defaultValue;
      const minValue = parseFloat(match[6]);
      const maxValue = parseFloat(match[8]);

      if (!supportedTypes.includes(type)) {
        console.error(`Unsupported parameter type: ${type}`);
        continue;
      }

      if (minValue === NaN) {
        console.error(`Badly formatter min value: ${match[6]}`);
        continue;
      }

      if (maxValue === NaN) {
        console.error(`Badly formatter max value: ${match[8]}`);
        continue;
      }

      parameters[name] = {
        type,
        name,
        defaultValue,
        value,
        minValue,
        maxValue,
      };
    }
    code = code.replaceAll(parameterPattern, "uniform $2 $3;");

    return { code, parameters };
  }
}

export default new ShaderManager();
