/**
 * 模板冒烟测试（开发用，不参与部署）
 * 用 liquidjs 模拟 Jekyll 渲染全部 layout / include / 页面，捕获语法与错误用法。
 *
 * 用法：
 *   cd D:\workbase\github-blog
 *   npm install liquidjs --no-save --cache .npm-cache   # 只装一次
 *   node scripts/validate-liquid.js
 *
 * 说明：这个脚本只用来做开发期检查，不会被部署到网站。
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
let Liquid;
try {
  ({ Liquid } = require("liquidjs"));
} catch (e) {
  console.error("缺少 liquidjs。请先执行：npm install liquidjs --no-save --cache .npm-cache");
  process.exit(2);
}

/* ---------------- 模拟 Jekyll 过滤器 ---------------- */
const filters = {
  relative_url: (u) => {
    if (u == null) return "";
    return String(u);
  },
  absolute_url: (u) => "https://example.com" + String(u || ""),
  date_to_xmlschema: (d) => new Date(d).toISOString(),
  date_to_string: (d) => new Date(d).toDateString(),
  date_to_long_string: (d) => new Date(d).toDateString(),
  number_of_words: (s) =>
    String(s || "")
      .replace(/[\u4e00-\u9fa5]/g, " word ")
      .split(/\s+/)
      .filter(Boolean).length,
  markdownify: (s) => String(s || ""),
  jsonify: (o) => JSON.stringify(o),
  slugify: (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
      .replace(/^-|-$/g, ""),
  where_exp: (arr, varName, expr) => {
    const m = String(expr).match(/^\s*\w+\.([\w.]+)\s*==\s*(.+)\s*$/);
    if (!m) return [];
    const [, prop, rawVal] = m;
    const val = rawVal.trim().replace(/^["']|["']$/g, "");
    return (arr || []).filter((item) => {
      const v = prop.split(".").reduce((o, k) => (o == null ? o : o[k]), item);
      return v instanceof Date ? String(v.getFullYear()) === val : String(v) === val;
    });
  },
  truncate: (s, n = 50, end = "...") => {
    s = String(s == null ? "" : s);
    return s.length > n ? s.slice(0, n - end.length) + end : s;
  },
  strip_html: (s) => String(s || "").replace(/<[^>]*>/g, ""),
  strip_newlines: (s) => String(s || "").replace(/[\r\n]+/g, " "),
  divided_by: (a, b) => { const x = Number(a), y = Number(b); return Number.isInteger(x) && Number.isInteger(y) ? Math.floor(x / y) : x / y; },
  plus: (a, b) => Number(a) + Number(b),
};

const liquid = new Liquid({
  root: [ROOT],
  layouts: path.join(ROOT, "_layouts"),
  partials: path.join(ROOT, "_includes"),
  extname: ".html",
  jekyllInclude: true,
  dynamicPartials: false,
  strictFilters: true,
  strictVariables: false,
  jsTruthy: false,
  cache: false,
});
Object.assign(liquid.filters, filters);

/* Jekyll 插件 {% seo %} 的替身：测试时只需保证标签能解析 */
liquid.registerTag("seo", {
  parse() {},
  render(ctx) {
    return "";
  },
});

/* ---------------- 测试数据 ---------------- */
function post(over) {
  return Object.assign(
    {
      title: "示例文章",
      url: "/posts/example/",
      date: new Date("2026-11-08T21:00:00+08:00"),
      description: "这是摘要",
      categories: ["指南"],
      tags: ["标签"],
      cover: "/assets/images/posts/hello-cover.jpg",
      content: "<h2>小节</h2><p>正文</p>",
      excerpt: "<p>摘要</p>",
      featured: false,
      layout: "post",
    },
    over
  );
}

const posts = [
  post({ title: "从零部署", url: "/posts/deploy/", date: new Date("2026-11-08T21:00:00+08:00"), featured: true }),
  post({ title: "欢迎", url: "/posts/hello/", date: new Date("2026-11-08T09:00:00+08:00"), featured: true, categories: ["随笔"] }),
  post({ title: "Markdown 速查", url: "/posts/md/", date: new Date("2026-11-08T08:00:00+08:00"), cover: null }),
];

const site = {
  title: "我的博客",
  tagline: "记录、思考与折腾",
  description: "这是站点描述",
  url: "https://example.com",
  baseurl: "",
  lang: "zh-CN",
  time: new Date("2026-11-08T20:00:00+08:00"),
  words_per_minute: 300,
  home_post_limit: 6,
  header_pages: [
    { title: "首页", url: "/" },
    { title: "文章", url: "/posts/" },
    { title: "分类", url: "/categories/" },
    { title: "归档", url: "/archive/" },
    { title: "关于", url: "/about/" },
    { title: "搜索", url: "/search/" },
  ],
  author: {
    name: "你的名字",
    bio: "前端工程师 / 长期主义者",
    avatar: "/assets/images/avatar.svg",
    location: "中国 · 杭州",
    email: "hello@example.com",
    links: [
      { label: "GitHub", url: "https://github.com/yourname" },
      { label: "RSS", url: "/feed.xml" },
    ],
  },
  hero: { kicker: "欢迎", title: "你好，我是你的名字", subtitle: "记录读过的书。\n欢迎聊聊。" },
  posts: posts,
  categories: { 指南: [posts[0], posts[2]], 随笔: [posts[1]] },
};

/* ---------------- 执行检查 ---------------- */
const results = [];
function check(label, fn) {
  try {
    fn();
    results.push({ label, ok: true });
  } catch (e) {
    results.push({ label, ok: false, err: String(e.message).split("\n")[0] });
  }
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (/\.(html|md|xml|json)$/.test(e.name)) out.push(full);
  }
  return out;
}

/* 1. 语法解析 */
for (const file of [...walk(path.join(ROOT, "_layouts")), ...walk(path.join(ROOT, "_includes"))]) {
  check("parse " + path.relative(ROOT, file).replace(/\\/g, "/"), () => liquid.parse(fs.readFileSync(file, "utf8")));
}

/* 去掉开头的 front matter（注意：必须锚定文件开头，否则会误删正文里的 ---） */
function stripFrontMatter(raw) {
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

/* 2. 渲染 layout */
function page(over) {
  return Object.assign({ title: "页面", url: "/about/", layout: "page", description: "页面描述", content: "<h2>标题</h2><p>内容</p>" }, over);
}

const layoutCases = [
  ["home", { layout: "home", title: "首页", url: "/" }, ""],
  ["page", page({}), "<h2>标题</h2><p>内容</p>"],
  ["post", post({ previous: posts[1], next: posts[2] }), "<h2>小节</h2><p>正文</p>"],
  ["post", post({ previous: null, next: null, categories: [], tags: [], description: null, updated: "2026-11-12" }), "<p>正文</p>"],
  ["posts", page({ layout: "posts", url: "/posts/" }), ""],
  ["archive", page({ layout: "archive", url: "/archive/" }), ""],
  ["categories", page({ layout: "categories", url: "/categories/" }), ""],
  ["search", page({ layout: "search", url: "/search/", search: true }), ""],
];

let idx = 0;
for (const [layout, pg, content] of layoutCases) {
  idx++;
  check(`render ${layout} #${idx}（含 base 外壳）`, () => {
    const html = renderFullPage(layout, pg, content);
    // 结果里不应该残留未解析的 Liquid
    if (/\{\{|\{%/.test(html)) throw new Error("输出里残留了未解析的 Liquid 标记");
    // 基本结构检查
    if (!html.includes("<!DOCTYPE html>")) throw new Error("缺少 <!DOCTYPE html>");
    if (!html.includes("</html>")) throw new Error("缺少 </html>");
    if (!/assets\/css\/style\.css/.test(html)) throw new Error("缺少样式表引用");
    if (!/<header class="site-header"/.test(html)) throw new Error("缺少页头");
    if (!/<footer class="site-footer"/.test(html)) throw new Error("缺少页脚");
    return html;
  });
}

/**
 * 模拟 Jekyll 的 layout 链：page 内容 → layout → 父 layout → … 
 * 用 liquidjs 的布局（{% layout %}）没有 Jekyll 那么灵活，这里手动一层层套。
 */
function renderFullPage(layoutName, pageData, content) {
  let html = content;
  let current = layoutName;
  let guard = 0;
  while (current && guard++ < 5) {
    const file = path.join(ROOT, "_layouts", current + ".html");
    const raw = fs.readFileSync(file, "utf8");
    const fmMatch = raw.match(/^---\r?\n((?:(?!\r?\n---)[\s\S])*)\r?\n---\r?\n?/);
    const fm = fmMatch ? fmMatch[1] : "";
    // 没有 front matter 的 layout（如 base.html）视为布局链终点；
    // default.html 是本项目所有 layout 的父级，这里显式接上 base.html，模拟 Jekyll 的隐式套用。
    let parent = (fm.match(/^layout:\s*(\S+)/m) || [])[1] || null;
    if (current === "default" && !fmMatch) parent = "base";
    const body = fmMatch ? raw.slice(fmMatch[0].length) : raw;
    html = liquid.parseAndRenderSync(body, {
      site,
      page: pageData,
      content: html,
      layout: current,
    });
    current = parent;
  }
  return html;
}

/* 3. 页面正文语法 */
for (const file of ["index.html", "about.md", "posts.md", "archive.md", "categories.md", "search.md", "404.html", "search.json"]) {
  check("parse page " + file, () => {
    const raw = fs.readFileSync(path.join(ROOT, file), "utf8");
    const body = stripFrontMatter(raw);
    liquid.parse(body);
  });
}

/* 4. 完整渲染 404 */
check("render 404.html", () => {
  const raw = fs.readFileSync(path.join(ROOT, "404.html"), "utf8");
  const body = stripFrontMatter(raw);
  const html = liquid.parseAndRenderSync(body, { site, page: { layout: null, url: "/404.html" }, content: "" });
  if (!html.includes("404")) throw new Error("404 页面缺少标识");
  return html;
});

/* 5. search.json 必须是合法 JSON */
check("render search.json → valid JSON", () => {
  const raw = fs.readFileSync(path.join(ROOT, "search.json"), "utf8");
  const body = stripFrontMatter(raw);
  const out = liquid.parseAndRenderSync(body, { site, page: { layout: null }, content: "" });
  JSON.parse(out);
  return out;
});

/* ---------------- 报告 ---------------- */
let failed = 0;
console.log("");
console.log("  模板渲染测试");
console.log("  ------------------------------");
for (const r of results) {
  if (r.ok) console.log("  ✓ " + r.label);
  else {
    failed++;
    console.log("  ✗ " + r.label);
    console.log("      " + r.err);
  }
}
console.log("");
console.log(`  ${results.length - failed}/${results.length} 通过`);
process.exit(failed ? 1 : 0);
