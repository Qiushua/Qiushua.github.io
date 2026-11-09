/* 列表页脚本：按关键词和分类即时筛选（文章页、归档页、分类页共用） */
(function () {
  "use strict";

  var input = document.getElementById("listSearch");
  var select = document.getElementById("catFilter");
  var countEl = document.getElementById("listCount");
  var emptyEl = document.getElementById("listEmpty");
  if (!input && !select) return;

  var items = Array.prototype.slice.call(document.querySelectorAll("[data-post]"));
  if (items.length === 0) return;

  var total = items.length;

  function normalize(s) {
    return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function apply() {
    var q = normalize(input ? input.value : "");
    var cat = select ? select.value : "";
    var shown = 0;

    items.forEach(function (el) {
      var title = normalize(el.getAttribute("data-title"));
      var elCat = el.getAttribute("data-cat") || "";
      var textHit = !q || title.indexOf(q) !== -1;
      var catHit = !cat || elCat === cat;
      var ok = textHit && catHit;
      el.classList.toggle("is-hidden", !ok);
      if (ok) shown++;
    });

    /* 分类页：整组都为空时把标题也藏起来 */
    var sections = document.querySelectorAll(".cat-section");
    Array.prototype.forEach.call(sections, function (sec) {
      var visible = sec.querySelector("[data-post]:not(.is-hidden)");
      sec.style.display = visible ? "" : "none";
    });

    if (countEl) {
      countEl.textContent = q || cat
        ? "筛选到 " + shown + " / " + total + " 篇"
        : "共 " + total + " 篇";
    }
    if (emptyEl) emptyEl.hidden = shown !== 0;
  }

  if (input) input.addEventListener("input", apply);
  if (select) select.addEventListener("change", apply);

  /* 支持 URL 参数，例如 /posts/?cat=读书 */
  try {
    var params = new URLSearchParams(window.location.search);
    var qp = params.get("q");
    var cp = params.get("cat");
    if (qp && input) input.value = qp;
    if (cp && select) select.value = cp;
  } catch (e) {}

  apply();
})();
