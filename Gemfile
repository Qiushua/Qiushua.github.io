# 本地预览用的依赖清单。
# 用 github-pages 这个 gem，可以保证本地构建结果和 GitHub Pages 线上完全一致。
source "https://rubygems.org"

gem "github-pages", group: :jekyll_plugins

# Ruby 3.x 不再内置 webrick，本地 jekyll serve 需要它
gem "webrick", "~> 1.8"

# Windows 上文件监听需要这个（macOS / Linux 不需要，但装了也无害）
gem "wdm", "~> 0.1.1", platforms: [:mingw, :x64_mingw, :mswin]
