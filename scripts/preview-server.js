/* 本地预览用的极简静态服务器（仅开发时使用，不会被部署）
   用法：node scripts/preview-server.js [端口] [根目录]
   例：  node scripts/preview-server.js 8765          → 预览源码目录
         node scripts/preview-server.js 8766 _preview → 预览构建产物（推荐） */
const http = require("http");
const fs = require("fs");
const path = require("path");

const base = path.resolve(__dirname, "..");
const argRoot = process.argv[3] || ".";
const root = path.resolve(base, argRoot);
const port = Number(process.argv[2] || 8765);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";
    let file = path.join(root, urlPath);
    if (!file.startsWith(root)) {
      res.writeHead(403);
      return res.end("403");
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      file = path.join(file, "index.html");
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        return res.end("<h1>404</h1><p>" + urlPath + " 不存在（本地预览不经过 Jekyll 构建）</p>");
      }
      res.writeHead(200, {
        "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(data);
    });
  })
  .listen(port, "127.0.0.1", () => {
    console.log("预览服务已启动：http://127.0.0.1:" + port);
  });
