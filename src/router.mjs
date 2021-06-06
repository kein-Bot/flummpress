export default class Router {
  constructor() {
    this.routes = new Map();
    return this;
  };

  group(path, cb) {
    const methods = {
      get:  this.get.bind(this),
      post: this.post.bind(this),
    };
    const target = {
      path: new RegExp(path),
    };
    const handler = {
      get: (opt, method) => (p, ...args) => methods[method](
        new RegExp([ opt.path, new RegExp(p === "/" ? "$": p) ]
          .map(regex => regex.source)
          .join("")
          .replace(/(\\\/){1,}/g, "/")),
        ...args,
      )
    };
    cb(new Proxy(target, handler));
    return this;
  };

  get(path, ...args) {
    if(args.length === 1)
      this.registerRoute(path, args[0], "get");
    else
      this.registerRoute(path, args[1], "get", args[0]);
    return this;
  };

  post(path, ...args) {
    if(args.length === 1)
      this.registerRoute(path, args[0], "post");
    else
      this.registerRoute(path, args[1], "post", args[0]);
    return this;
  };

  registerRoute(path, cb, method, middleware) {
    if(!this.routes.has(path))
      this.routes.set(path, {});
    this.routes.set(path, {
      ...this.routes.get(path),
      [method]: cb,
      [method + "mw"]: middleware,
    });
    console.log("route set:", method.toUpperCase(), path);
    this.sortRoutes();
    return this;
  };
  
  getRoute(path, method) {
    method = method.toLowerCase();
    return [...this.routes.entries()].filter(r => {
      return (r[0] === path || r[0].exec?.(path)) && r[1].hasOwnProperty(method);
    })[0];
  };

  sortRoutes() {
    this.routes = new Map([...this.routes.entries()].sort().reverse());
    return this;
  };
};
