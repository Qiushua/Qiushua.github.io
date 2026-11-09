---
title: 从零把这个博客放到互联网上：GitHub Pages + 自定义域名
date: 2026-11-08 21:00:00 +0800
description: 把仓库推到 GitHub、开通 Pages、配置 DNS、绑定域名、开启 HTTPS，一步一步走完，中途的坑和排查方法也一并记下。
categories: [指南]
tags: [GitHub Pages, Jekyll, DNS, 部署]
featured: true
cover: /assets/images/og.png
---

这篇是给"已经拿到域名、但还没上线"的自己写的操作手册。整体分五步，每一步都有验证方法，**上一步没验证通过，不要急着做下一步**。

## 全貌：三条腿

先建立一个正确的心理模型：

1. **代码仓库**：文章和模板存在 GitHub 的仓库里
2. **构建服务**：GitHub Pages 把仓库里的 Jekyll 源码编译成静态 HTML
3. **域名解析**：把 `你的域名` 指向 GitHub Pages 的服务器

三者缺一不可。常见故障大多是"仓库推了但 Pages 没开"或者"Pages 开了但 DNS 没生效"。

> **前提**：本文假设你把站点放在**用户主页仓库**里，仓库名必须是 `你的用户名.github.io`。这样博客直接占用根路径，域名配置最简单。

## 第一步：把文件推上 GitHub

先在 GitHub 网页上新建一个**空仓库**，名字填 `你的用户名.github.io`，**不要**勾选"添加 README"。然后在本机执行：

```bash
cd 你的博客目录
git init
git add .
git commit -m "初始化博客"
git branch -M main
git remote add origin https://github.com/你的用户名/你的用户名.github.io.git
git push -u origin main
```

验证：刷新仓库页面，能看到 `_config.yml`、`_posts`、`index.html` 这些文件。

## 第二步：开启 Pages

进入仓库的 **Settings → Pages**：

1. **Source** 选择 `Deploy from a branch`
2. **Branch** 选择 `main`，目录选 `/ (root)`
3. 点击 **Save**

等 1~3 分钟，Pages 页面顶部会出现 `Your site is live at https://你的用户名.github.io/`。

这时先用 GitHub 给的地址访问一次。**这一步能打开，说明仓库和构建没问题**，后面再折腾域名才有意义。

> 如果 5 分钟还没好，去 **Actions** 标签页看 `pages build and deployment` 的状态；红色叉号点进去看日志，最常见的原因是 `_config.yml` 语法错误。

## 第三步：配置 DNS

先明确你要用哪种地址。两种都配是最稳的做法：

### 方案 A：主域名 `example.com`（推荐）

在域名服务商的 DNS 管理页面，添加 4 条 **A 记录**，主机记录都填 `@`：

| 类型 | 主机记录 | 记录值 |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

### 方案 B：子域名 `www.example.com` 或 `blog.example.com`

添加 1 条 **CNAME 记录**：

| 类型 | 主机记录 | 记录值 |
| --- | --- | --- |
| CNAME | www | 你的用户名.github.io |

> **注意**：CNAME 的记录值只写到 `你的用户名.github.io`，末尾不要加 `.`，也不要加 `https://`。

### 顺手加一条 www 跳转

如果你用主域名，通常会再加一条 `www` 的 CNAME 指向 `你的用户名.github.io`，然后在 Pages 设置里勾选强制跳转。GitHub 会自动把 `www.example.com` 301 到 `example.com`（或反过来，取决于你在 Pages 里填的主域名）。

配置完成后，用命令检查是否生效（DNS 一般 10 分钟到 1 小时）：

```bash
nslookup example.com
nslookup www.example.com
```

## 第四步：绑定域名

1. 仓库根目录新建一个文件 `CNAME`（没有后缀），**只写一行**：

```text
example.com
```

2. 回到 **Settings → Pages → Custom domain**，填 `example.com`，点 **Save**

保存后，GitHub 会自动把 `CNAME` 文件改写一遍（所以你本地看到的可能被覆盖，这是正常的）。

3. 等 DNS 检查通过，勾选 **Enforce HTTPS**

验证顺序：

- [ ] `http://example.com` 能打开
- [ ] `https://example.com` 能打开，且地址栏有小锁
- [ ] `https://www.example.com` 会跳转到主站
- [ ] 手机 4G 网络也能打开（排除本地缓存干扰）

## 第五步：把域名写进 `_config.yml`

这一步最容易被忘，忘了也不会报错，但分享到社交平台时缩略图会挂掉。

```yaml
url: "https://example.com"
baseurl: ""
```

改完提交：

```bash
git add _config.yml
git commit -m "配置正式域名"
git push
```

## 常见问题排查

### 打开是 404

- 仓库是不是叫 `用户名.github.io`？拼写是否完全一致？
- Pages 的 Source 是不是选了 `main` 分支的 `/ (root)`？
- 仓库里有没有 `index.html` 或 `index.md`？

### 打开显示的是 README

Jekyll 会把仓库根目录的 `README.md` 当成首页，除非你已经有了 `index.html`。本站就带了 `index.html`，如果它不在，检查是不是被误删了。

### 域名打不开，GitHub 地址正常

几乎都是 DNS 问题。用 `nslookup` 看解析结果对不对；如果服务商支持，把 TTL 调小（比如 600 秒）再等一会儿。

### 提示 "Domain is not properly formatted"

`CNAME` 文件里只能有一行纯域名，不能有 `https://`、不能有路径、不能有逗号。

### HTTPS 选项是灰的

说明 GitHub 还没完成域名验证，通常再等几十分钟即可。如果超过 24 小时，检查 DNS 里有没有多余的 AAAA 记录或冲突的 CNAME。

## 上线之后

- 每推送一次 `main` 分支，GitHub 会自动重新构建，通常 1 分钟内生效
- 在 **Settings → Pages** 页面可以看到每次构建的状态
- 提交文章前建议先本地预览（见 `docs/部署指南.md` 的"本地预览"一节）

写完这些，网站就算是真正属于你了。
