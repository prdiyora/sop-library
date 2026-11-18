(function () {
  var root = document.documentElement;

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem("sop-theme", theme); } catch (e) {}
    var btn = document.querySelector(".theme-btn");
    if (btn) {
      btn.textContent = theme === "dark" ? "☀" : "☾";
      btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }
  }

  var forced = new URLSearchParams(location.search).get("theme");
  var saved = null;
  try { saved = localStorage.getItem("sop-theme"); } catch (e) {}
  var initial = forced || saved ||
    (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  apply(initial);

  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest(".theme-btn");
    if (!btn) return;
    apply(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
  });
})();
