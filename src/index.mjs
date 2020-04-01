import http from "http";
import url from "url";
import querystring from "querystring";

import router from "./router.mjs";
import views from "./views.mjs";

export default class flummpress {
  constructor() {
    this.router = new router();
    this.views = new views();
  }

  use(item) {
    switch(item.type) {
      case "route":
        item.data.forEach((v, k) => this.router.routes.set(k, v));
      break;
      case "view":
        item.data.forEach((v, k) => this.views.set(k, v));
      break;
    }
  }

  listen(...args) {
    this.router.routes.forEach((v, k) => console.log("route set", v.method, k));
    return http.createServer(async (req, res, r) => {
      req.url = url.parse(req.url.replace(/(?!^.)(\/+)?%/, ''));
      req.url.qs = querystring.parse(req.url.query);

      req.post = new Promise((resolve, _, data = "") => req
        .on("data", d => void (data += d))
        .on("end", () => void resolve(Object.fromEntries(Object.entries(querystring.parse(data)).map(([k, v]) => [k, decodeURIComponent(v)])))));
      
      res.reply = ({
        code = 200,
        type = "text/html",
        body
      }) => res.writeHead(code, { "Content-Type": `${type}; charset=utf-8` }).end(body);
      
      !(r = this.router.routes.getRegex(req.url.pathname, req.method)) ? res.writeHead(404).end(`404 - ${req.url.pathname}`) : await r(req, res);
      console.log(`[${(new Date()).toLocaleTimeString()}] ${res.statusCode} ${req.method}\t${req.url.pathname}`);
    }).listen(...args);
  }
};
export { router, views };
