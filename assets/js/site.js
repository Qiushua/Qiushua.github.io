/* 全站通用脚本：主题切换、移动端菜单、回到顶部、外链处理 */
(function () {
  "use strict";

  var root = document.documentElement;
  var THEME_KEY = "theme";

  /* ---------- 主题切换 ---------- */
  var toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      toggle.setAttribute("aria-label", next === "dark" ? "切换到明亮主题" : "切换到暗色主题");
    });
  }

  /* ---------- 移动端菜单：点链接或点空白处自动收起 ---------- */
  var navToggle = document.getElementById("navToggle");
  if (navToggle) {
    var nav = document.querySelector(".site-nav");
    document.addEventListener("click", function (e) {
      if (!navToggle.checked) return;
      var clickedInsideNav = nav && nav.contains(e.target);
      if (!clickedInsideNav || (e.target.closest && e.target.closest(".site-nav__link"))) {
        navToggle.checked = false;
      }
    });
  }

  /* ---------- 回到顶部 ---------- */
  var backToTop = document.getElementById("backToTop");
  if (backToTop) {
    var onScroll = function () {
      var show = window.scrollY > 640;
      backToTop.hidden = !show;
      backToTop.style.opacity = show ? "1" : "0";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- 站外链接自动加新窗口打开 ---------- */
  var links = document.querySelectorAll(".prose a[href^='http']");
  for (var i = 0; i < links.length; i++) {
    var a = links[i];
    if (a.hostname && a.hostname !== window.location.hostname) {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    }
  }

  /* ---------- 404 页面小彩蛋：按键盘回首页 ---------- */
  var notFound = document.querySelector("[data-404]");
  if (notFound) {
    document.addEventListener("keydown", function (e) {
      if (e.key === "Enter") window.location.href = (window.SITE && window.SITE.baseurl || "") + "/";
    });
  }
})();
