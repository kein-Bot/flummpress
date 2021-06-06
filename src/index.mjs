import path from "path";
import fs from "fs";
import http from "http";
import { URL } from "url";
import querystring from "querystring";

import Router from "./router.mjs";
import Tpl from "./template.mjs";

export { Router, Tpl };

export default class flummpress {
  #mimes;
  #server;
  constructor() {
    this.router = new Router();
    this.tpl = new Tpl();

    return this;
  };

  use(obj) {
    if(obj instanceof Router) {
      this.router.routes = new Map([ ...this.router.routes, ...obj.routes ]);
      this.router.sortRoutes();
    }
    else if(obj instanceof Tpl) {
      this.tpl = obj;
    }
    return this;
  };

  static({ dir = path.resolve() + "/public", route = /^\/public/ }) {
    if(!this.#mimes) {
      this.#mimes = new Map();
      (fs.readFileSync("./mime.types", "utf-8"))
        .split("\n")
        .filter(e => !e.startsWith("#") && e)
        .map(e => e.split(/\s{2,}/))
        .filter(e => e.length > 1)
        .forEach(m => m[1].split(" ").forEach(ext => this.#mimes.set(ext, m[0])));
    }

    this.router.get(route, (req, res) => {
      try {
        const filename = req.url.pathname.replace(route, "") || "index.html";
        const mime = this.#mimes.get(filename.split(".").pop());
        const file = path.join(dir, filename);
        let stat;
        try {
          stat = fs.statSync(file);
        } catch {
          res.reply({
            code: 404,
            body: "404 - file not found."
          });
          return this;
        }

        if(!mime.startsWith("video") && !mime.startsWith("audio")) {
          res.reply({
            type: this.#mimes.get(filename.split(".").pop()).toLowerCase(),
            body: fs.readFileSync(path.join(dir, filename))
          });
          return this;
        }
        
        if(req.headers.range) {
          const parts = req.headers.range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
          res.writeHead(206, {
            "Content-Range": `bytes ${start}-${end}/${stat.size}`,
            "Accept-Ranges": "bytes",
            "Content-Length": (end - start) + 1,
            "Content-Type": mime,
          });
          const stream = fs.createReadStream(file, { start: start, end: end })
            .on("open", () => stream.pipe(res))
            .on("error", err => res.end(err));
        }
        else {
          res.writeHead(200, {
            "Content-Length": stat.size,
            "Content-Type": mime,
          });
          fs.createReadStream(file).pipe(res);
        }
      } catch(err) {
        console.error(err);
        res.reply({
          code: 500,
          body: "500 - f0ck hat keinen b0ck"
        });
      }
    });
    return this;
  };

  listen(...args) {
    this.#server = http.createServer(async (req, res) => {
      const t_start = process.hrtime();

      const _url = new URL(req.url.replace(/(?!^.)(\/+)?$/, ''), "relative:///");
      req.url = {
        pathname: _url.pathname,
        split: _url.pathname.split("/").slice(1),
        searchParams: _url.searchParams,
        qs: {...querystring.parse(_url.search.substring(1))} // legacy
      };

      const method = req.method.toLowerCase();
      const route = this.router.getRoute(req.url.pathname, req.method);

      if(route) { // 200
        const cb = route[1][method];
        const middleware = route[1][`${method}mw`];
        req.params = req.url.pathname.match(new RegExp(route[0]))?.groups;
        req.post = await this.readBody(req);

        const result = await this.processMiddleware(middleware, req, this.createResponse(res));
        if(result)
          cb(req, res);
      }
      else { // 404
        res
          .writeHead(404)
          .end(`404 - ${req.method} ${req.url.pathname}`);
      }

      console.log([
        `[${(new Date()).toLocaleTimeString()}]`,
        `${(process.hrtime(t_start)[1] / 1e6).toFixed(2)}ms`,
        `${req.method} ${res.statusCode}`,
        req.url.pathname
      ].map(e => e.toString().padEnd(15)).join(""));

    }).listen(...args);
    return this;
  };

  readBody(req) {
    return new Promise((resolve, _, data = "") => req
      .on("data", d => void (data += d))
      .on("end", () => {
        if(req.headers['content-type'] === "application/json") {
          try {
            return void resolve(JSON.parse(data));
          } catch(err) {}
        }
        void resolve(Object.fromEntries(Object.entries(querystring.parse(data)).map(([k, v]) => {
          try {
            return [k, decodeURIComponent(v)];
          } catch(err) {
            return [k, v];
          }
        })));
      }));
  };

  createResponse(res) {
    res.reply = ({
      code = 200,
      type = "text/html",
      body
    }) => res.writeHead(code, { "Content-Type": `${type}; charset=utf-8` }).end(body);
    res.json = msg => res.reply({ type: "application/json", body: msg });
    res.html = msg => res.reply({ type: "text/html", body: msg });
    return res;
  };

  processMiddleware(middleware, req, res) {
    if(!middleware)
      return new Promise(resolve => resolve(true));
    return new Promise(resolve => middleware(req, res, () => resolve(true)));
  };

};
