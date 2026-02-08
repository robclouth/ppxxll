import localForage from "localforage";
import { makeAutoObservable, runInAction } from "mobx";
import { makePersistable } from "mobx-persist-store";
import { Parameter, Shader } from "../types";
import RenderManager from "./render-manager";

const supportedTypes = ["float"];

const parameterPattern =
  /(const)?\s+(\w+)\s+(\w+)\s+=\s+(.*);\s+\/\/\s*@param\s+(min\s+(.*)),\s*(max\s+(.*))/g;

class ShaderManager {
  shaders: { [id: string]: Shader } = {};

  activeShaderId?: string;

  constructor() {
    makeAutoObservable(this);
  }

  async init() {
    await makePersistable(this, {
      name: "Shaders",
      properties: ["shaders", "activeShaderId"],
      storage: localForage,
      stringify: false,
    });

    if (Object.keys(this.shaders).length === 0) {
      await Promise.all([
        this.addShadertoyShader("NsfcWf"),
        this.addShadertoyShader("fdscD2"),
        this.addShadertoyShader("Ns2cz1"),
        this.addShadertoyShader("tlyBDG"),
      ]);
    }
  }

  async addShadertoyShader(id: string) {
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
              type: "camera" as const,
            })),
            outputs: pass.outputs.map((output: any) => ({
              id: output.id.toString(),
              type: "camera" as const,
            })),
          })),
        };
      });
    } catch (err) {
      console.error(err);
    }
  }

  get activeShader() {
    return this.activeShaderId ? this.shaders[this.activeShaderId] : undefined;
  }

  deleteShader(id: string) {
    delete this.shaders[id];
  }

  setShader(shader: Shader) {
    this.activeShaderId = shader.id;
    RenderManager.setShader(this.activeShader!);
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

      if (Number.isNaN(minValue)) {
        console.error(`Badly formatter min value: ${match[6]}`);
        continue;
      }

      if (Number.isNaN(maxValue)) {
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
