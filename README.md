# flummpress

## Usage Example
```javascript
import path from "path";
import flummpress, { router, views } from "flummpress";

(async () => {
  const port = 8080;
  (await new flummpress())
    .listen(port)
    .on("listening", () => {
      console.log(`flummpress is listening on port ${port}`);

      // new route GET
      router.get(/^\/$/, (req, res) => {
        res.reply({
          body: "hello world!"
        });
      });

      // new route POST
      router.post(/^\/$/, async (req, res) => {
        const postdata = await req.post;
        console.log(postdata);
        res.reply({
          body: "hello post!"
        });
      });

      // public folder
      router.static({
        dir: path.resolve() + "/public",
        route: /^\/public/
      });
    });
})();
```

## documentation

coming soon