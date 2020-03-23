import http from "http";
import path from "path";
import url from "url";
import querystring from "querystring";

import router from "./router.mjs";
import views from "./views.mjs";

export default class flummpress {
  constructor(opts) {
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
      
      !(r = router.routes.getRegex(req.url.pathname, req.method)) ? res.writeHead(404).end(`404 - ${req.url.pathname}`) : await r(req, res);
      console.log(`[${(new Date()).toLocaleTimeString()}] ${res.statusCode} ${req.method}\t${req.url.pathname}`);
    }).listen(...args);
  }
};
export { router, views };
