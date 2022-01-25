import localForage from "localforage";
import { makeAutoObservable } from "mobx";
import { makePersistable } from "mobx-persist-store";

class TextureManager {
  textures: string[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  async init() {
    await makePersistable(this, {
      name: "Textures",
      properties: ["textures"],
      storage: localForage,
      stringify: false,
    });
  }

  async addTextureFromUrl(url: string) {
    this.textures.push(url);
  }

  async addTextureFromFile(file: File) {}
}

export default new TextureManager();
