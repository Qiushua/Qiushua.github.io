# 我的博客 · GitHub Pages 个人博客模板

一套完整、可直接部署的个人博客源码：**Jekyll + GitHub Pages + 自定义域名**，无需服务器、无需数据库、无需第三方主题。

**明亮主题**

![明亮主题首页](docs/images/preview-light.png)

**暗色主题**

![暗色主题首页](docs/images/preview-dark.png)

> 上面是模板的真实渲染效果（示例内容待你替换）。

## 这个模板有什么

| 能力 | 说明 |
| --- | --- |
| 文章系统 | Markdown 写作，文件名即网址，支持分类、标签、精选、草稿、更新时间 |
| 页面 | 首页、文章列表、分类、归档、搜索、关于、404 |
| 搜索 | 纯前端全文检索（标题 + 摘要 + 正文），构建时自动生成索引 |
| 阅读体验 | 自动目录 + 滚动高亮、阅读进度条、阅读时长、上一篇/下一篇 |
| 明暗主题 | 跟随系统，可手动切换并记住选择 |
| 代码块 | 语法高亮、语言标签、一键复制 |
| 图片 | 封面、灯箱放大、懒加载 |
| SEO | 自动生成 title / description / Open Graph / sitemap / RSS |
| 响应式 | 手机、平板、桌面自适应 |
| 零依赖构建 | 不依赖任何第三方 Jekyll 插件，GitHub Pages 原生构建即可 |

## 三步开始

### 1. 看文档

- **[部署指南](docs/部署指南.md)** —— 从建仓库到绑定域名，每一步都有验证方法
- **[写文章指南](docs/写文章指南.md)** —— 怎么新增、修改、删除文章

### 2. 改配置

打开 `_config.yml`，把这几项换成你自己的：

```yaml
title: 我的博客
author:
  name: 你的名字
  email: hello@example.com
url: "https://example.com"
```

同时把 `CNAME` 文件里的一行改成你的域名。

### 3. 推送

```bash
git add .
git commit -m "初始化博客"
git push
```

GitHub Pages 会自动构建，1~2 分钟后访问 `https://你的用户名.github.io/`。

## 写一篇新文章

```bash
# Windows
powershell -ExecutionPolicy Bypass -File scripts\new-post.ps1 "文章标题" "分类"

# macOS / Linux
bash scripts/new-post.sh "文章标题" 分类
```

或者直接复制 `_posts/0000-00-00-template.md`，重命名为 `YYYY-MM-DD-英文短名.md`，删掉 `published: false` 后开始写。

文章头部格式：

```yaml
---
title: 文章标题
date: 2026-11-10 20:00:00 +0800
description: 一句话摘要
categories: [随笔]
tags: [标签1, 标签2]
---
```

## 本地预览

### 完整预览（最准确，需要 Ruby）

```bash
bundle install
bundle exec jekyll serve
# 打开 http://127.0.0.1:4000
```

Windows 用户先装 [RubyInstaller](https://rubyinstaller.org/downloads/)（勾选 Devkit），详见[部署指南第 9 节](docs/部署指南.md#9-本地预览环境可选强烈推荐)。

### 不装 Ruby 的预览（需要 Node.js，推荐）

```bash
npm install
npm run preview
# 打开 http://127.0.0.1:8766
```

用真实文章渲染出静态页面，能检查排版、目录、搜索、明暗主题。

### 发布前自检

```bash
node scripts/check.js      # 检查 front matter、链接、图片、网址重复
npm run validate           # 检查模板语法（Liquid）
```

## 目录结构

```text
.
├── _config.yml          全站配置（站名、作者、导航、域名）
├── _posts/              文章目录 ★
├── _layouts/            页面骨架
├── _includes/           可复用组件
├── assets/
│   ├── css/style.css    全部样式（含明暗主题）
│   ├── js/              交互脚本
│   └── images/          图片、头像、图标、分享封面
├── docs/                使用文档（不会被发布）
├── scripts/             新建文章、自检、本地预览脚本
├── index.html           首页
├── about.md             关于页
├── posts.md             文章列表
├── archive.md           归档
├── categories.md        分类
├── search.md            搜索
├── search.json          搜索索引
├── 404.html             404 页面
├── CNAME                自定义域名
└── robots.txt
```

## 常见自定义

### 改主色调

打开 `assets/css/style.css`，修改文件开头的 `--accent`（主色）、`--bg`（背景）、`--ink`（文字色）：

```css
:root {
  --accent: #b04a2a;   /* 主色：链接、强调、标签 */
  --bg: #faf7f2;       /* 页面背景 */
  --ink: #1b1a17;      /* 正文颜色 */
}
```

暗色主题的对应颜色在下面的 `[data-theme="dark"]` 里。

### 改导航

`_config.yml` 的 `header_pages`，想加页面就加一行。

### 改字体

`style.css` 顶部的 `--font-serif`（正文）、`--font-sans`（界面）。

### 换头像和图标

- 头像：替换 `assets/images/avatar.svg`，或改 `_config.yml` 的 `author.avatar`
- 图标：替换 `assets/images/favicon.svg`
- 分享封面：替换 `assets/images/og.png`（建议 1200×630）

## 技术说明

- 构建：GitHub Pages 内置 Jekyll 3.10（构建时自动套用，无需 Actions 配置）
- 插件：仅使用 Pages 官方支持的 `jekyll-feed`、`jekyll-seo-tag`、`jekyll-sitemap`
- 前端：原生 JavaScript，无框架、无构建步骤
- 样式：单个 CSS 文件，CSS 变量控制主题，无 Sass 依赖
- 字体：系统字体栈，不加载外部字体（首屏更快，也避免字体版权问题）

## 许可

- 模板代码：MIT，随意使用和修改
- 示例文章内容：仅作演示，请替换成你自己的内容
- 图片素材：示例封面由 AI 生成，可自由使用

---

如果这套模板帮到了你，欢迎在文章里留个链接 🙂
