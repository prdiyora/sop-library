/* SOP Library search + dropdown menus.
   Fuzzy: exact word > word-start > substring > edit-distance-1 typo of a known word.
   Works on every page; set window.SOP_BASE to the site-root relative path. */
(function () {
  var BASE = window.SOP_BASE || "./";
  var indexPromise = null;
  var vocabByLetter = {};

  function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetch(BASE + "search-index.json")
        .then(function (r) { return r.json(); })
        .then(function (data) {
          data.forEach(function (e) {
            e.w = {};
            (e.t + " " + e.x).toLowerCase().split(/[^a-z0-9]+/).forEach(function (w) {
              if (w.length >= 2) e.w[w] = true;
              if (w.length >= 3) {
                var c = w[0];
                (vocabByLetter[c] = vocabByLetter[c] || {})[w] = true;
              }
            });
          });
          return data;
        })
        .catch(function () { indexPromise = null; return []; });
    }
    return indexPromise;
  }

  function editDist(a, b, maxD) {
    // bounded Levenshtein; transposition counts as 2 (no Damerau)
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > maxD) return false;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= lb; j++) prev[j] = j;
    for (i = 1; i <= la; i++) {
      cur[0] = i;
      var rowMin = cur[0];
      for (j = 1; j <= lb; j++) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
        if (cur[j] < rowMin) rowMin = cur[j];
      }
      if (rowMin > maxD) return false;
      var t = prev; prev = cur; cur = t;
    }
    return prev[lb] <= maxD;
  }

  function scoreEntry(e, terms) {
    var total = 0;
    var titleWords = {};
    e.t.toLowerCase().split(/[^a-z0-9]+/).forEach(function (w) { titleWords[w] = true; });
    for (var i = 0; i < terms.length; i++) {
      var term = terms[i], best = 0;
      for (var w in e.w) {
        if (w === term) { best = 4; break; }
        if (w.indexOf(term) === 0) { if (best < 2.5) best = 2.5; }
        else if (w.indexOf(term) > 0) { if (best < 1) best = 1; }
      }
      if (best === 0 && term.length >= 4) {
        var maxD = term.length >= 7 ? 2 : 1;
        var bucket = vocabByLetter[term[0]] || {};
        for (var vw in bucket) {
          if (Math.abs(vw.length - term.length) <= maxD && editDist(term, vw, maxD) && e.w[vw]) {
            best = 2; break;
          }
        }
      }
      if (best === 0) return 0;
      total += best * (titleWords[term] ? 1.6 : 1);
    }
    return total;
  }

  function snippet(e, terms) {
    var x = e.x, low = x.toLowerCase(), pos = -1;
    for (var i = 0; i < terms.length; i++) {
      var p = low.indexOf(terms[i]);
      if (p !== -1 && (pos === -1 || p < pos)) pos = p;
    }
    if (pos === -1) pos = 0;
    var start = Math.max(0, pos - 50);
    var s = (start > 0 ? "…" : "") + x.substr(start, 170);
    terms.forEach(function (t) {
      var re = new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[a-z0-9]*)", "ig");
      s = s.replace(re, "<mark>$1</mark>");
    });
    return s;
  }

  function runSearch(box, q) {
    var out = box.querySelector(".search-results");
    var terms = q.toLowerCase().split(/[^a-z0-9]+/).filter(function (t) { return t.length >= 2; });
    if (!terms.length) { out.hidden = true; out.innerHTML = ""; return; }
    loadIndex().then(function (data) {
      var scored = [];
      data.forEach(function (e) {
        var sc = scoreEntry(e, terms);
        if (sc > 0) scored.push([sc, e]);
      });
      scored.sort(function (a, b) { return b[0] - a[0]; });
      var top = scored.slice(0, 25);
      if (!top.length) {
        out.innerHTML = '<div class="sr-none">Kai maliyu nahi — bija shabd try karo (spelling off pan chale).</div>';
        out.hidden = false;
        return;
      }
      var html = "";
      top.forEach(function (pair) {
        var e = pair[1];
        html += '<a class="sr-row" href="' + BASE + e.u + '">' +
          '<span class="sr-page">' + e.p + '</span>' +
          '<span class="sr-title">' + e.t + '</span>' +
          '<span class="sr-snip">' + snippet(e, terms) + '</span></a>';
      });
      out.innerHTML = html;
      out.hidden = false;
    });
  }

  document.querySelectorAll(".searchbox").forEach(function (box) {
    var input = box.querySelector(".search-input");
    var out = box.querySelector(".search-results");
    var timer = null;
    input.addEventListener("input", function () {
      clearTimeout(timer);
      var q = input.value;
      timer = setTimeout(function () { runSearch(box, q); }, 140);
    });
    input.addEventListener("focus", function () {
      loadIndex();
      if (out.innerHTML) out.hidden = false;
    });
    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { out.hidden = true; input.blur(); }
      if (ev.key === "Enter") {
        var first = out.querySelector(".sr-row");
        if (first) { window.location.href = first.getAttribute("href"); }
      }
    });
  });

  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest(".menu-btn");
    document.querySelectorAll(".menu-panel").forEach(function (p) {
      if (btn && btn.nextElementSibling === p) return;
      p.hidden = true;
    });
    if (btn) {
      var panel = btn.nextElementSibling;
      panel.hidden = !panel.hidden;
      ev.preventDefault();
    }
    if (!ev.target.closest(".searchbox")) {
      document.querySelectorAll(".search-results").forEach(function (r) { r.hidden = true; });
    }
  });
})();
