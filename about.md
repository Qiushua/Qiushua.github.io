---
title: 关于
layout: page
permalink: /about/
description: 关于我和这个博客
---

<div class="about-card">
  <img class="about-card__avatar" src="{{ site.author.avatar | default: '/assets/images/avatar.svg' | relative_url }}" alt="{{ site.author.name }} 的头像" width="132" height="132">
  <div>
    <h2 class="about-card__name">{{ site.author.name }}</h2>
    <p class="about-card__bio">{{ site.author.bio }}</p>
    <ul class="about-links">
      {%- for link in site.author.links %}
      <li>
        <a class="chip" href="{% if link.url contains '://' %}{{ link.url }}{% else %}{{ link.url | relative_url }}{% endif %}" rel="noopener">
          {{ link.label }}
        </a>
      </li>
      {%- endfor %}
    </ul>
  </div>
</div>

## 我是谁

这里是自我介绍的第一段。写清楚三件事就够了：**你是谁**、**你在做什么**、**这个博客写什么**。

比如：我是一名后端开发工程师，平时主要写 Go 和 Python，业余喜欢拍照和跑步。这个博客是我的公开笔记本，用来记录工作中的坑、读过的书，以及一些还没有结论的思考。

## 这个博客

- **主题**：技术、读书、生活随笔
- **更新频率**：尽量每周一篇，随缘但不放弃
- **技术栈**：Jekyll + GitHub Pages，文章全部用 Markdown 写作
- **设计**：从零手写的样式，没有套用现成主题

## 联系我

- 邮箱：[{{ site.author.email }}](mailto:{{ site.author.email }})
- GitHub：[{{ site.author.links[0].url }}]({{ site.author.links[0].url }})
- RSS 订阅：[{{ '/feed.xml' | relative_url }}]({{ '/feed.xml' | relative_url }})

## 关于转载

本站文章除特别注明外，均采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh) 许可协议。
欢迎非商业转载，注明作者和原文链接即可。

> 所有内容仅代表个人观点，与所在公司无关。
