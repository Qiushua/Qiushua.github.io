/* 文章页脚本：目录生成与高亮、阅读进度、代码复制、图片灯箱 */
(function () {
  "use strict";

  var baseurl = (window.SITE && window.SITE.baseurl) || "";
  var body = document.getElementById("postBody");
  if (!body) return;

  var headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header-h"), 10) || 68;

  /* ---------- 1. 给标题加 id，并生成侧边目录 ---------- */
  var headings = body.querySelectorAll("h2, h3");
  var tocNav = document.getElementById("tocNav");

  if (tocNav) {
    if (headings.length === 0) {
      tocNav.innerHTML = '<p class="toc__empty">本文没有小标题</p>';
    } else {
      var frag = document.createDocumentFragment();
      Array.prototype.forEach.call(headings, function (h, i) {
        if (!h.id) {
          h.id = "heading-" + (i + 1);
        }
        var a = document.createElement("a");
        a.className = "toc__link" + (h.tagName === "H3" ? " toc__link--h3" : "");
        a.href = "#" + h.id;
        a.textContent = h.textContent.trim();
        a.dataset.target = h.id;
        frag.appendChild(a);
      });
      tocNav.appendChild(frag);
    }
  }

  /* 点击目录平滑滚动（避开吸顶的页头） */
  if (tocNav) {
    tocNav.addEventListener("click", function (e) {
      var link = e.target.closest("a");
      if (!link) return;
      var id = link.getAttribute("href").slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - headerH - 20;
      window.scrollTo({ top: top, behavior: "smooth" });
      history.replaceState(null, "", "#" + id);
    });
  }

  /* 滚动时高亮当前章节 */
  if (tocNav && headings.length > 0) {
    var tocLinks = tocNav.querySelectorAll(".toc__link");
    var setActive = function (id) {
      Array.prototype.forEach.call(tocLinks, function (l) {
        l.classList.toggle("is-active", l.dataset.target === id);
      });
    };
    var onScrollSpy = function () {
      var current = headings[0].id;
      for (var i = 0; i < headings.length; i++) {
        if (headings[i].getBoundingClientRect().top - headerH - 40 <= 0) {
          current = headings[i].id;
        }
      }
      setActive(current);
    };
    window.addEventListener("scroll", onScrollSpy, { passive: true });
    onScrollSpy();
  }

  /* ---------- 2. 阅读进度条 ---------- */
  var bar = document.getElementById("readingProgress");
  if (bar) {
    var update = function () {
      var rect = body.getBoundingClientRect();
      var total = body.offsetHeight - window.innerHeight + headerH;
      var scrolled = -rect.top + headerH;
      var pct = total > 0 ? (scrolled / total) * 100 : 0;
      bar.style.width = Math.max(0, Math.min(100, pct)) + "%";
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- 3. 代码块加语言标签与复制按钮 ---------- */
  var pres = body.querySelectorAll("pre");
  Array.prototype.forEach.call(pres, function (pre) {
    if (pre.closest(".code-block")) return;
    var code = pre.querySelector("code");
    if (!code) return;

    var lang = "";
    var cls = code.className || "";
    var m = cls.match(/language-([\w+-]+)/);
    if (m) lang = m[1];

    var wrap = document.createElement("div");
    wrap.className = "code-block";
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    var head = document.createElement("div");
    head.className = "code-block__head";
    var label = document.createElement("span");
    label.className = "code-block__lang";
    label.textContent = lang || "code";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "code-block__copy";
    btn.textContent = "复制";
    btn.addEventListener("click", function () {
      var text = code.innerText;
      var done = function () {
        btn.textContent = "已复制 ✓";
        btn.classList.add("is-copied");
        setTimeout(function () {
          btn.textContent = "复制";
          btn.classList.remove("is-copied");
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
      } else {
        fallbackCopy(text, done);
      }
    });
    head.appendChild(label);
    head.appendChild(btn);
    wrap.insertBefore(head, pre);
  });

  function fallbackCopy(text, done) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
    done();
  }

  /* ---------- 4. 图片点击放大 ---------- */
  var imgs = body.querySelectorAll("img");
  if (imgs.length === 0) return;

  var lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-label", "查看大图");
  lightbox.innerHTML = "<img alt=''>";
  document.body.appendChild(lightbox);
  var lbImg = lightbox.querySelector("img");

  Array.prototype.forEach.call(imgs, function (img) {
    img.classList.add("zoomable");
    img.addEventListener("click", function () {
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt || "";
      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";
    });
  });

  var close = function () {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
  };
  lightbox.addEventListener("click", close);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") close();
  });
})();
