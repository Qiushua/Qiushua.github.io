# 新建一篇文章（Windows PowerShell 5.1+）
# 用法：powershell -ExecutionPolicy Bypass -File scripts\new-post.ps1 "我的文章标题" "分类"

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Title,

    [Parameter(Position = 1)]
    [string]$Category = "随笔"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$dateYmd = Get-Date -Format "yyyy-MM-dd"
$dateFull = Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"

# 英文短名：小写、空格转连字符、只保留字母数字和连字符
$slug = ($Title.ToLower() -replace '\s+', '-') -replace '[^a-z0-9\-]', ''
$slug = $slug.Trim('-') -replace '-{2,}', '-'
$placeholder = $false
if ([string]::IsNullOrWhiteSpace($slug)) {
    $slug = "post-$dateYmd"
    $placeholder = $true
}

$file = Join-Path $root "_posts\$dateYmd-$slug.md"
if (Test-Path $file) {
    Write-Host "文件已存在：$file" -ForegroundColor Yellow
    exit 1
}

$lines = @(
    '---',
    ('title: ' + $Title),
    ('date: ' + $dateFull),
    'description: 一句话摘要，会显示在列表卡片和搜索结果里。',
    ('categories: [' + $Category + ']'),
    'tags: []',
    '---',
    '',
    '这里开始写正文。',
    '',
    '## 第一个小标题',
    '',
    '正文内容……'
)

$content = ($lines -join "`r`n") + "`r`n"

# 用 UTF-8（无 BOM）写入，避免中文乱码
[System.IO.File]::WriteAllText($file, $content, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "已创建：$file" -ForegroundColor Green
if ($placeholder) {
    Write-Host "提示：标题里没有英文，文件名用了日期占位。建议把文件名后半段改成英文短名。" -ForegroundColor Yellow
}
Write-Host ('接下来：写完后执行  git add . ; git commit -m "新文章：' + $Title + '" ; git push')
