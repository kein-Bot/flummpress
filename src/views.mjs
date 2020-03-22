import { promises as fs } from "fs";

export default new class {
  constructor() {
    this.views = new Map();
  }
  get(view) {
    return this.views.get(view) || false;
  }
  async loadViews(path) {
    (await fs.readdir(path))
      .filter(view => view.endsWith(".html"))
      .forEach(async view => this.views.set(view.slice(0, -5), await fs.readFile(`${path}/${view}`)));
  }
};
