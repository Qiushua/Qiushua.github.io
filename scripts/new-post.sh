#!/usr/bin/env bash
# 新建一篇文章（macOS / Linux）
# 用法：bash scripts/new-post.sh "我的文章标题" [分类]
#   例：bash scripts/new-post.sh "读《人类简史》" 读书

set -euo pipefail

TITLE="${1:-}"
CATEGORY="${2:-随笔}"

if [ -z "$TITLE" ]; then
  echo "用法：bash scripts/new-post.sh \"文章标题\" [分类]"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"
DATE_YMD="$(date +%Y-%m-%d)"
DATE_FULL="$(date +"%Y-%m-%d %H:%M:%S %z")"

# 生成英文短名：小写、空格转连字符、只保留字母数字和连字符
SLUG="$(printf '%s' "$TITLE" | tr '[:upper:]' '[:lower:]' \
  | sed -e 's/[[:space:]]\+/-/g' -e 's/[^a-z0-9-]//g' -e 's/-\+/-/g')"
if [ -z "$SLUG" ]; then
  SLUG="post-$DATE_YMD"
fi

FILE="$ROOT/_posts/$DATE_YMD-$SLUG.md"
if [ -e "$FILE" ]; then
  echo "文件已存在：$FILE"
  exit 1
fi

cat > "$FILE" <<EOF
---
title: $TITLE
date: $DATE_FULL
description: 一句话摘要，会显示在列表卡片和搜索结果里。
categories: [$CATEGORY]
tags: []
---

这里开始写正文。

## 第一个小标题

正文内容……
EOF

echo "已创建：$FILE"
if [ "$SLUG" = "post-$DATE_YMD" ]; then
  echo "提示：标题里没有英文，文件名用了日期占位。建议把文件名后半段改成英文短名。"
fi
echo "接下来：写完后执行  git add . && git commit -m \"新文章：$TITLE\" && git push"
