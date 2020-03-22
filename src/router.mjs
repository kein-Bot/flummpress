import { promises as fs } from "fs";

export default new class {
  constructor() {
    this.routes = new Map();
  }
  async loadRoutes(path) {
    await Promise.all(
      (await fs.readdir(path))
        .filter(f => f.endsWith(".mjs"))
        .map(async route => await import(`${path}/${route}`))
    );
  }
  route(method, args) {
    this.routes.set(args[0], { method: method, f: args[1] });
    console.log("route set", method, args[0]);
  }
  get() {
    this.route("GET", arguments);
  }
  post() {
    this.route("POST", arguments);
  }
};

Map.prototype.getRegex = function(path, method) {
  return [...this.entries()].filter(r => r[0].exec(path) && r[1].method.includes(method))[0]?.[1].f;
};
