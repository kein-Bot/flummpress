import http from "http";
import path from "path";
import url from "url";
import querystring from "querystring";

import router from "./router.mjs";
import views from "./views.mjs";

export default class flummpress {
  constructor(opts) {
    this.Router = router;
    this.views = views;
    this.opts = { ...{
      views: path.resolve() + "/src/views",
      routes: path.resolve() + "/src/routes"
    }, ...opts };
    return (async () => {
      await router.loadRoutes(this.opts.routes);
      await views.loadViews(this.opts.views);
      return this;
    })();
  }
  listen(...args) {
    return http.createServer((req, res, r) => {
      req.url = url.parse(req.url.replace(/(?!^.)(\/+)?%/, ''));
      req.url.qs = querystring.parse(req.url.query);

      req.post = new Promise((resolve, _, data = "") => req
        .on("data", d => void (data += d))
        .on("end", () => void resolve(Object.fromEntries(Object.entries(querystring.parse(data)).map(([k, v]) => [k, decodeURIComponent(v)])))));
      
      console.log(`[${(new Date()).toLocaleTimeString()}] ${req.method} ${req.url.pathname}`);

      !(r = router.routes.getRegex(req.url.pathname, req.method)) ? res.writeHead(404).end(`404 - ${req.url.pathname}`) : r(req, res);
    }).listen(...args);
  }
};
