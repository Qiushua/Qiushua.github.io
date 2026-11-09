/**
 * 真实内容静态预览（开发用，不会被部署）
 *
 * 它做的是「半个 Jekyll」：读取真实文章 → 渲染 layout → 输出到 _preview/。
 * 目的是不装 Ruby 也能看到接近线上的效果，用来检查排版和交互。
 *
 * 用法：
 *   npm install liquidjs marked --no-save --cache .npm-cache   # 只装一次
 *   node scripts/build-preview.js
 *   node scripts/preview-server.js 8766 _preview
 *
 * 注意：正式发布请以 GitHub Pages 的构建为准，本脚本只用于本地检查。
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "_preview");

let Liquid, marked;
try {
  ({ Liquid } = require("liquidjs"));
  ({ marked } = require("marked"));
} catch (e) {
  console.error("缺少依赖。请先执行：npm install liquidjs marked js-yaml --no-save --cache .npm-cache");
  process.exit(2);
}

/* ---------------- front matter ---------------- */
const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

const yaml = require("js-yaml");

function parseFrontMatter(text) {
  const m = text.match(FM_RE);
  if (!m) return { data: {}, body: text };
  let data = {};
  try {
    data = yaml.load(m[1]) || {};
  } catch (e) {
    console.error("YAML 解析失败：" + e.message);
  }
  return { data, body: text.slice(m[0].length) };
}
function parseDate(s) {
  if (!s) return new Date();
  // "2026-11-08 21:00:00 +0800" → ISO
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?(?:\s*([+-]\d{2}:?\d{2}))?/);
  if (!m) return new Date(s);
  const [, y, mo, d, h = "00", mi = "00", se = "00", tz] = m;
  const zone = tz ? (tz.includes(":") ? tz : tz.slice(0, 3) + ":" + tz.slice(3)) : "+08:00";
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${se}${zone}`);
}

/* ---------------- 读取站点数据 ---------------- */
const config = yaml.load(fs.readFileSync(path.join(ROOT, "_config.yml"), "utf8")) || {};

const pages = [];
const posts = [];

function readPage(file, url, layout) {
  const { data, body } = parseFrontMatter(fs.readFileSync(file, "utf8"));
  // front matter 里的 layout 优先，没有时才用调用方给的默认值
  const page = Object.assign({ url, content: body }, { layout }, data);
  page.date = data.date ? parseDate(data.date) : new Date();
  pages.push(page);
  return page;
}

const postsDir = path.join(ROOT, "_posts");
for (const name of fs.readdirSync(postsDir).sort()) {
  if (!name.endsWith(".md")) continue;
  const { data, body } = parseFrontMatter(fs.readFileSync(path.join(postsDir, name), "utf8"));
  if (data.published === false) continue;
  const slug = name.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, "");
  const post = Object.assign({}, data, {
    url: "/posts/" + slug + "/",
    date: parseDate(data.date),
    categories: data.categories || [],
    tags: data.tags || [],
    content: marked.parse(body),
    excerpt: marked.parse(body.split(/\r?\n\r?\n/)[0] || ""),
    file: name,
  });
  posts.push(post);
}
posts.sort((a, b) => b.date - a.date);
posts.forEach((p, i) => {
  p.previous = posts[i + 1] || null;
  p.next = posts[i - 1] || null;
});

const site = Object.assign({}, config, {
  url: config.url || "https://example.com",
  baseurl: "",
  time: new Date(),
  lang: config.lang || "zh-CN",
  posts: posts,
  categories: posts.reduce((acc, p) => {
    for (const c of p.categories) (acc[c] = acc[c] || []).push(p);
    return acc;
  }, {}),
  tags: posts.reduce((acc, p) => {
    for (const t of p.tags) (acc[t] = acc[t] || []).push(p);
    return acc;
  }, {}),
});

readPage(path.join(ROOT, "about.md"), "/about/", "page");
readPage(path.join(ROOT, "posts.md"), "/posts/", "posts");
readPage(path.join(ROOT, "archive.md"), "/archive/", "archive");
readPage(path.join(ROOT, "categories.md"), "/categories/", "categories");
readPage(path.join(ROOT, "search.md"), "/search/", "search");
readPage(path.join(ROOT, "index.html"), "/", "home");

/* ---------------- Liquid ---------------- */
const liquid = new Liquid({
  root: [ROOT],
  partials: path.join(ROOT, "_includes"),
  extname: ".html",
  jekyllInclude: true,
  dynamicPartials: false,
  strictFilters: false,
  jsTruthy: false,
  cache: false,
});

Object.assign(liquid.filters, {
  relative_url: (u) => (u == null ? "" : String(u)),
  absolute_url: (u) => site.url + String(u || ""),
  jsonify: (o) => JSON.stringify(o),
  // Jekyll 的 divided_by 在整数相除时返回整数，这里对齐
  divided_by: (a, b) => { const x = Number(a), y = Number(b); return Number.isInteger(x) && Number.isInteger(y) ? Math.floor(x / y) : x / y; },
  plus: (a, b) => Number(a) + Number(b),
  default: (v, d) => (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0) ? d : v),
  slugify: (s) => String(s || "").toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, "-").replace(/^-|-$/g, ""),
  markdownify: (s) => marked.parse(String(s || "")).trim(),
  strip_html: (s) => String(s || "").replace(/<[^>]*>/g, ""),
  strip_newlines: (s) => String(s || "").replace(/[\r\n]+/g, " "),
  truncate: (s, n = 50, end = "...") => {
    s = String(s == null ? "" : s);
    return s.length > n ? s.slice(0, n - end.length) + end : s;
  },
  number_of_words: (s) =>
    String(s || "")
      .replace(/<[^>]*>/g, "")
      .replace(/[\u4e00-\u9fa5]/g, " word ")
      .split(/\s+/)
      .filter(Boolean).length,
  date_to_xmlschema: (d) => new Date(d).toISOString(),
  date: (d, fmt) => {
    const dt = new Date(d);
    const pad = (n) => String(n).padStart(2, "0");
    const WEEK = ["日", "一", "二", "三", "四", "五", "六"];
    const tokens = {
      "%Y": String(dt.getFullYear()),
      "%y": String(dt.getFullYear()).slice(-2),
      "%m": pad(dt.getMonth() + 1),
      "%-m": String(dt.getMonth() + 1),
      "%d": pad(dt.getDate()),
      "%-d": String(dt.getDate()),
      "%H": pad(dt.getHours()),
      "%M": pad(dt.getMinutes()),
      "%S": pad(dt.getSeconds()),
      "%b": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][dt.getMonth()],
      "%B": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][dt.getMonth()],
      "%a": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dt.getDay()],
      "%A": ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][dt.getDay()],
      "%w": WEEK[dt.getDay()],
      "%j": String(Math.floor((dt - new Date(dt.getFullYear(), 0, 0)) / 86400000)).padStart(3, "0"),
      "%e": String(dt.getDate()).padStart(2, " "),
      "%p": dt.getHours() < 12 ? "AM" : "PM",
      "%z": "+0800",
      "%Z": "CST",
      "%%": "%",
    };
    return String(fmt).replace(/%-?[a-zA-Z%]/g, (t) => (tokens[t] != null ? tokens[t] : t));
  },
  where_exp: (arr, varName, expr) => {
    const m = String(expr).match(/^\s*\w+\.([\w.]+)\s*==\s*(.+)\s*$/);
    if (!m) return [];
    const [, prop, rawVal] = m;
    const val = rawVal.trim().replace(/^["']|["']$/g, "");
    return (arr || []).filter((item) => {
      const v = prop.split(".").reduce((o, k) => (o == null ? o : o[k]), item);
      return String(v) === val;
    });
  },
});

liquid.registerTag("seo", {
  parse() {},
  render(ctx) {
    const page = ctx.environments.page || {};
    const title = (page.title ? page.title + " · " : "") + site.title;
    const desc = page.description || site.description || "";
    const abs = page.url ? site.url + page.url : site.url + "/";
    return [
      `<meta name="description" content="${String(desc).replace(/"/g, "&quot;")}">`,
      `<link rel="canonical" href="${abs}">`,
      `<meta property="og:title" content="${title}">`,
    ].join("\n");
  },
});

/* ---------------- 渲染 ---------------- */
function renderLayoutChain(layoutName, page, content) {
  let html = content;
  let current = layoutName;
  let guard = 0;
  while (current && guard++ < 6) {
    const file = path.join(ROOT, "_layouts", current + ".html");
    const raw = fs.readFileSync(file, "utf8");
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    const fmText = fm ? fm[1] : "";
    const body = fm ? raw.slice(fm[0].length) : raw;
    let parent = (fmText.match(/^layout:\s*(\S+)/m) || [])[1] || null;
    if (current === "default" && !fm) parent = "base";
    // 与 Jekyll 一致：page.layout 在整条布局链里始终是页面自己的 layout
    html = liquid.parseAndRenderSync(body, { site, page, content: html, layout: current });
    current = parent;
  }
  return html;
}

function write(url, html) {
  let file = path.join(OUT, url.replace(/^\//, ""));
  if (url.endsWith("/")) file = path.join(file, "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

fs.rmSync(OUT, { recursive: true, force: true });

for (const page of pages) {
  const content = page.url === "/" ? "" : page.content;
  write(page.url, renderLayoutChain(page.layout || "page", page, content));
}

for (const post of posts) {
  const postPage = Object.assign({}, post, { layout: "post" });
  write(post.url, renderLayoutChain("post", postPage, post.content));
}

/* search.json */
const index = posts.map((p) => ({
  title: p.title,
  url: p.url,
  date: p.date.toISOString().slice(0, 10),
  categories: p.categories,
  tags: p.tags,
  description: p.description || String(p.excerpt || "").replace(/<[^>]*>/g, "").slice(0, 200),
  content: String(p.content).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").slice(0, 3000),
}));
write("/search.json", JSON.stringify(index, null, 2));

/* 404 */
const notFound = fs.readFileSync(path.join(ROOT, "404.html"), "utf8");
write("/404.html", liquid.parseAndRenderSync(notFound.replace(FM_RE, ""), { site, page: { layout: null, url: "/404.html" }, content: "" }));

/* 静态资源复制 */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
copyDir(path.join(ROOT, "assets"), path.join(OUT, "assets"));

console.log("");
console.log("  预览已生成：_preview/");
console.log(`  文章 ${posts.length} 篇，页面 ${pages.length} 个`);
console.log("  启动预览：node scripts/preview-server.js 8766 _preview");
