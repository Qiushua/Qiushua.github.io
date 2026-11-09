/**
 * 发布前自检脚本（不依赖 Ruby / Jekyll）
 * 用法：node scripts/check.js
 *
 * 检查内容：
 *   1. 每篇文章的 front matter 是否齐全（title / date）
 *   2. 文件名与日期是否匹配（YYYY-MM-DD-xxx.md）
 *   3. 站内链接指向的目标是否存在
 *   4. 文章里引用的图片是否存在
 *   5. 图片是否过大（> 500KB 给出提醒）
 *   6. 文章网址是否重复
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "_posts");
const errors = [];
const warnings = [];
let checkedPosts = 0;
let checkedLinks = 0;

/* ---------- 工具 ---------- */
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["_site", "_preview", "node_modules", ".git", "vendor", ".jekyll-cache", "docs"].includes(entry.name)) continue;
      walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join("/");
}

function existsUrlPath(url) {
  // 去掉锚点和查询串
  let clean = url.split("#")[0].split("?")[0];
  if (!clean) return true;
  // Jekyll 生成的地址（permalink / 插件产出）
  if (PERMALINKS.has(clean)) return true;
  if (["/feed.xml", "/sitemap.xml", "/search.json"].includes(clean)) return true;

  if (clean.endsWith("/")) clean += "index.html";
  const target = path.join(ROOT, clean.replace(/^\//, ""));
  if (fs.existsSync(target)) return true;
  // 无扩展名的页面：允许 xxx.md / xxx.html / xxx/index.html
  const noExt = target.replace(/\.html$/, "");
  if (
    fs.existsSync(noExt + ".md") ||
    fs.existsSync(noExt + ".html") ||
    fs.existsSync(path.join(noExt, "index.html")) ||
    fs.existsSync(path.join(noExt, "index.md"))
  ) {
    return true;
  }
  return false;
}

/* 扫描所有页面的 permalink，构建"线上地址 → 源码文件"映射 */
const PERMALINKS = new Set();
(function collectPermalinks() {
  const candidates = fs
    .readdirSync(ROOT)
    .filter((f) => /\.(md|html)$/.test(f) && f !== "404.html")
    .map((f) => path.join(ROOT, f));
  for (const file of candidates) {
    const text = fs.readFileSync(file, "utf8");
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!m) continue;
    const perm = (m[1].match(/^permalink:\s*(\S+)/m) || [])[1];
    if (perm) PERMALINKS.add(perm);
  }
})();

function stripCode(md) {
  return md.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
}

/* ---------- 1. 文章检查 ---------- */
if (!fs.existsSync(POSTS_DIR)) {
  console.error("找不到 _posts 目录");
  process.exit(1);
}

const seenUrls = new Map();
const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));

for (const name of files) {
  const full = path.join(POSTS_DIR, name);
  const raw = fs.readFileSync(full, "utf8");
  const isTemplate = /^0000-00-00/.test(name);

  // 文件名格式
  const nameMatch = name.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
  if (!nameMatch && !isTemplate) {
    errors.push(`[文件名] ${name} 不符合 YYYY-MM-DD-英文短名.md 格式`);
    continue;
  }

  // front matter
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!fm) {
    errors.push(`[front matter] ${name} 缺少开头的 --- 配置块`);
    continue;
  }
  const meta = fm[1];

  if (isTemplate) {
    if (!/published:\s*false/.test(meta)) {
      errors.push(`[模板] ${name} 是模板文件，必须保留 published: false，否则会被发布`);
    }
    continue;
  }

  checkedPosts++;

  if (!/^title:\s*\S+/m.test(meta)) errors.push(`[front matter] ${name} 缺少 title`);
  if (!/^date:\s*\S+/m.test(meta)) warnings.push(`[front matter] ${name} 缺少 date，将按文件名日期处理`);

  const dateInName = nameMatch[1];
  const dateInMeta = (meta.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m) || [])[1];
  if (dateInMeta && dateInMeta !== dateInName) {
    warnings.push(`[日期] ${name} 文件名日期 ${dateInName} 与 front matter 日期 ${dateInMeta} 不一致，以 front matter 为准`);
  }

  // 未来日期
  if (dateInMeta && new Date(dateInMeta) > new Date()) {
    warnings.push(`[日期] ${name} 的日期在未来，Jekyll 默认不会把它构建出来`);
  }

  // 网址重复
  const slug = name.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, "");
  const url = "/posts/" + slug + "/";
  PERMALINKS.add(url);
  if (seenUrls.has(url)) {
    errors.push(`[网址] ${name} 与 ${seenUrls.get(url)} 生成相同网址 ${url}（文件名重复）`);
  } else {
    seenUrls.set(url, name);
  }

  const body = stripCode(raw.slice(fm[0].length));

  // 内部链接
  const linkRe = /\]\((\/[^)\s]+)\)/g;
  let m;
  while ((m = linkRe.exec(body)) !== null) {
    const target = m[1];
    checkedLinks++;
    if (!existsUrlPath(target)) {
      errors.push(`[链接] ${name} 中的 ${target} 找不到对应文件`);
    }
  }

  // 图片
  const imgRe = /!\[[^\]]*\]\(([^)\s]+)\)|<img[^>]+src=["']([^"']+)["']/g;
  while ((m = imgRe.exec(body)) !== null) {
    const src = m[1] || m[2];
    if (!src || /^https?:\/\//.test(src) || src.startsWith("data:")) continue;
    checkedLinks++;
    const imgPath = path.join(ROOT, src.replace(/^\//, "").split("?")[0]);
    if (!fs.existsSync(imgPath)) {
      errors.push(`[图片] ${name} 引用的 ${src} 不存在`);
    } else if (fs.statSync(imgPath).size > 500 * 1024) {
      warnings.push(`[图片] ${src} 大小 ${(fs.statSync(imgPath).size / 1024).toFixed(0)}KB，建议压缩到 500KB 以内`);
    }
  }
}

/* ---------- 2. 配置检查 ---------- */
const config = fs.readFileSync(path.join(ROOT, "_config.yml"), "utf8");
if (/url:\s*""/.test(config)) {
  warnings.push("[配置] _config.yml 里的 url 还是空的，上线并绑定域名后记得填写，否则社交分享图片会失效");
}
if (!fs.existsSync(path.join(ROOT, "index.html")) && !fs.existsSync(path.join(ROOT, "index.md"))) {
  errors.push("[页面] 缺少首页 index.html");
}

/* ---------- 3. 全站文件里的站内链接 ---------- */
for (const file of walk(ROOT)) {
  const ext = path.extname(file).toLowerCase();
  if (![".md", ".html"].includes(ext)) continue;
  if (rel(file).startsWith("_posts/")) continue;
  const text = stripCode(fs.readFileSync(file, "utf8"));
  const linkRe = /\]\((\/[^)\s]+)\)/g;
  let m;
  while ((m = linkRe.exec(text)) !== null) {
    const target = m[1];
    if (target.startsWith("/assets/")) {
      checkedLinks++;
      if (!fs.existsSync(path.join(ROOT, target.replace(/^\//, "")))) {
        errors.push(`[链接] ${rel(file)} 中的 ${target} 不存在`);
      }
    }
  }
}

/* ---------- 4. 样式与脚本的基本健康检查 ---------- */
const cssFile = path.join(ROOT, "assets", "css", "style.css");
if (!fs.existsSync(cssFile)) {
  errors.push("[样式] 缺少 assets/css/style.css");
} else {
  const css = fs.readFileSync(cssFile, "utf8");
  const open = (css.match(/{/g) || []).length;
  const close = (css.match(/}/g) || []).length;
  if (open !== close) {
    errors.push(`[样式] style.css 花括号不配对（{ ${open} 个，} ${close} 个），可能是删代码时漏了一半`);
  }
}

for (const jsName of ["site.js", "post.js", "list.js", "search.js"]) {
  const jsFile = path.join(ROOT, "assets", "js", jsName);
  if (!fs.existsSync(jsFile)) {
    errors.push(`[脚本] 缺少 assets/js/${jsName}`);
    continue;
  }
  const code = fs.readFileSync(jsFile, "utf8");
  try {
    new Function(code); // 只做语法检查，不执行
  } catch (e) {
    errors.push(`[脚本] ${jsName} 语法错误：${e.message}`);
  }
}

/* ---------- 输出结果 ---------- */
console.log("");
console.log("  博客自检报告");
console.log("  ------------------------------");
console.log(`  文章：${checkedPosts} 篇    检查链接/资源：${checkedLinks} 处`);
console.log("");

if (warnings.length) {
  console.log("  提醒（不影响发布）：");
  warnings.forEach((w) => console.log("   · " + w));
  console.log("");
}

if (errors.length) {
  console.log("  错误（会导致发布后出问题）：");
  errors.forEach((e) => console.log("   ✗ " + e));
  console.log("");
  console.log(`  共 ${errors.length} 个错误，请修复后再推送。`);
  process.exit(1);
} else {
  console.log("  ✓ 没有发现错误，可以放心发布。");
}
