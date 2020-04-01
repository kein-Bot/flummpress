import { promises as fs } from "fs";

export default class ViewController {
  #views;
  constructor() {
    this.#views = new Map();
  }
  get(name) {
    return this.#views.get(name) || false;
  }
  set(name, view) {
    return {
      type: "view",
      data: this.#views.set(name, view)
    };
  }
  async loadViews(path) {
    return await Promise.all((await fs.readdir(path))
      .filter(view => view.endsWith(".html"))
      .map(async view => this.set(view.slice(0, -5), await fs.readFile(`${path}/${view}`))));
  }
};
