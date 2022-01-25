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
  title: string;
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
      properties: ["shaders", "activeShader"],
      storage: localForage,
      stringify: false,
    });

    if (Object.keys(this.shaders).length === 0) {
      await Promise.all([
        this.addShaderToyShader("NsfcWf"),
        this.addShaderToyShader("fdscD2"),
        this.addShaderToyShader("Ns2cz1"),
        this.addShaderToyShader("tlyBDG"),
      ]);
    }
  }

  async addShaderToyShader(id: string) {
    try {
      const json = await (
        await fetch(`https://www.shadertoy.com/api/v1/shaders/${id}?key=fd8K4m`)
      ).json();

      if (json.Error) throw json.Error;

      if (json.Shader.renderpass.length > 1)
        throw "Multi-pass shaders not yet supported";

      runInAction(() => {
        const info = json.Shader.info;

        const { title, author } = this.extractMetadata(
          json.Shader.renderpass[0].code
        );

        this.shaders[info.id] = {
          id: info.id,
          title: title || info.name,
          description: info.description,
          author: author || info.username,
          passes: json.Shader.renderpass.map((pass: any) => ({
            ...this.extractParameters(pass.code),
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
    } catch (err) {
      console.error(err);
    }
  }

  deleteShader(id: string) {
    delete this.shaders[id];
  }

  setShader(shader: Shader) {
    this.activeShader = shader;
    CameraManager.setShader(this.activeShader);
  }

  extractMetadata(code: string) {
    const titleMatch = code.match(/@title (.+)/);
    const authorMatch = code.match(/@author (.+)/);

    return { title: titleMatch?.[1], author: authorMatch?.[1] };
  }

  extractParameters(code: string) {
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
