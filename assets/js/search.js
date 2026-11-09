/* 搜索页脚本：读取 /search.json，在前端完成检索与摘要高亮 */
(function () {
  "use strict";

  var baseurl = (window.SITE && window.SITE.baseurl) || "";
  var input = document.getElementById("searchInput");
  var results = document.getElementById("searchResults");
  var status = document.getElementById("searchStatus");
  var tips = document.getElementById("searchTips");
  if (!input || !results) return;

  var index = [];
  var cacheKey = "blog-search-index-v1";

  /* 转义，避免把 HTML 注入页面 */
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeReg(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function normalize(s) {
    return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  /* 在正文里截取关键词附近的片段 */
  function snippet(text, q) {
    var t = (text || "").replace(/\s+/g, " ");
    var lower = t.toLowerCase();
    var idx = lower.indexOf(q);
    if (idx === -1) return t.slice(0, 120) + (t.length > 120 ? "…" : "");
    var start = Math.max(0, idx - 40);
    var end = Math.min(t.length, idx + q.length + 80);
    return (start > 0 ? "…" : "") + t.slice(start, end) + (end < t.length ? "…" : "");
  }

  function highlight(text, q) {
    var safe = escapeHtml(text);
    if (!q) return safe;
    try {
      return safe.replace(new RegExp("(" + escapeReg(escapeHtml(q)) + ")", "gi"), "<mark>$1</mark>");
    } catch (e) {
      return safe;
    }
  }

  function load() {
    var cached = null;
    try { cached = sessionStorage.getItem(cacheKey); } catch (e) {}
    if (cached) {
      try {
        index = JSON.parse(cached);
        return Promise.resolve(index);
      } catch (e) {}
    }
    return fetch(baseurl + "/search.json", { credentials: "same-origin" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        index = Array.isArray(data) ? data : [];
        try { sessionStorage.setItem(cacheKey, JSON.stringify(index)); } catch (e) {}
        return index;
      });
  }

  function render(list, q) {
    results.innerHTML = "";
    if (q && list.length === 0) {
      status.textContent = "没有找到与「" + q + "」相关的文章，换个关键词试试。";
      return;
    }
    if (!q) {
      status.textContent = "输入关键词开始搜索，共 " + index.length + " 篇文章可供检索。";
      return;
    }
    status.textContent = "找到 " + list.length + " 篇相关文章";

    var frag = document.createDocumentFragment();
    list.slice(0, 30).forEach(function (item) {
      var art = document.createElement("article");
      art.className = "result";
      var text = item.content || "";
      var body = snippet(text, q);
      if (body.toLowerCase().indexOf(q) === -1 && item.description) {
        body = item.description;
      }
      var cats = (item.categories || []).join(" · ");
      art.innerHTML =
        '<p class="result__meta">' +
          (cats ? '<span class="card__cat">' + escapeHtml(cats) + "</span><span>·</span>" : "") +
          "<time>" + escapeHtml(item.date) + "</time>" +
        "</p>" +
        '<h3 class="result__title"><a href="' + escapeHtml(item.url) + '">' +
          highlight(item.title, q) +
        "</a></h3>" +
        '<p class="result__excerpt">' + highlight(body, q) + "</p>";
      frag.appendChild(art);
    });
    results.appendChild(frag);
  }

  function search(q) {
    q = normalize(q);
    if (!q) { render([], ""); return; }
    var scored = [];
    index.forEach(function (item) {
      var title = normalize(item.title);
      var desc = normalize(item.description);
      var tags = normalize((item.tags || []).join(" "));
      var content = normalize(item.content);
      var score = 0;
      if (title.indexOf(q) !== -1) score += 12;
      if (desc.indexOf(q) !== -1) score += 6;
      if (tags.indexOf(q) !== -1) score += 4;
      if (content.indexOf(q) !== -1) score += 2;
      if (score > 0) scored.push({ item: item, score: score });
    });
    scored.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return String(b.item.date).localeCompare(String(a.item.date));
    });
    render(scored.map(function (s) { return s.item; }), q);
  }

  var timer = null;
  input.addEventListener("input", function () {
    clearTimeout(timer);
    var value = input.value;
    timer = setTimeout(function () { search(value); }, 120);
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { clearTimeout(timer); search(input.value); }
    if (e.key === "Escape") { input.value = ""; search(""); }
  });

  if (tips) {
    tips.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-q]");
      if (!btn) return;
      input.value = btn.getAttribute("data-q") || "";
      search(input.value);
      input.focus();
    });
  }

  load().then(function () {
    var params = new URLSearchParams(window.location.search);
    var q = params.get("q");
    if (q) {
      input.value = q;
      search(q);
    } else {
      input.focus();
      render([], "");
    }
  }).catch(function (err) {
    status.textContent = "搜索索引加载失败（" + err.message + "），请刷新页面重试。";
  });
})();
