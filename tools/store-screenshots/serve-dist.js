/* Static server matching Expo web export semantics:
 * /x → x.html, /x/ → x/index.html, unknown → +not-found.html */
const http = require("http");
const fs = require("fs");
const path = require("path");
const ROOT = "/home/user/work/peprep-app/expo/dist";
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".ico": "image/x-icon", ".json": "application/json", ".ttf": "font/ttf", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".map": "application/json" };

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  const candidates = [
    path.join(ROOT, url),
    path.join(ROOT, url + ".html"),
    path.join(ROOT, url, "index.html"),
  ];
  let file = candidates.find((f) => {
    try { return fs.statSync(f).isFile(); } catch { return false; }
  });
  if (!file) file = path.join(ROOT, "+not-found.html");
  try {
    const data = fs.readFileSync(file);
    res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404); res.end("nf");
  }
}).listen(4173, "127.0.0.1", () => console.log("up"));
