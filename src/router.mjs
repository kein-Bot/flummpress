import { promises as fs } from "fs";
import path from "path";

export default new class {
  #mimes;
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
  async static({ dir = path.resolve() + "/public", route = /^\/public/ }) {
    if(!this.#mimes) {
      this.#mimes = new Map();
      (await fs.readFile("/etc/mime.types", "utf-8"))
        .split("\n")
        .filter(e => !e.startsWith("#") && e)
        .map(e => e.split(/\s{2,}/))
        .filter(e => e.length > 1)
        .forEach(m => m[1].split(" ").forEach(ext => this.#mimes.set(ext, m[0])));
    }

    this.get(route, async (req, res) => {
      try {
        return res.reply({
          type: this.#mimes.get(req.url.path.split(".").pop()).toLowerCase(),
          body: await fs.readFile(path.join(dir, req.url.path.replace(route, "")), "utf-8")
        });
      } catch {
        return res.reply({
          code: 404,
          body: "404 - file not found"
        });
      }
    });
  }
};

Map.prototype.getRegex = function(path, method) {
  return [...this.entries()].filter(r => r[0].exec(path) && r[1].method.includes(method))[0]?.[1].f;
};
