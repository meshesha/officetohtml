/* officetohtml.js.org - shared page behaviour: theme toggle, mobile menu, copy buttons, tabs, light syntax colouring. */
(function () {
  "use strict";
  var root = document.documentElement;
  var KEY = "oth-site-theme";

  function storedTheme() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function isDark() {
    var t = root.getAttribute("data-theme");
    if (t) return t === "dark";
    return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
  }
  var saved = storedTheme();
  if (saved === "dark" || saved === "light") root.setAttribute("data-theme", saved);

  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

  function paintThemeButton(btn) {
    var dark = isDark();
    btn.innerHTML = dark ? SUN : MOON;
    btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    btn.title = btn.getAttribute("aria-label");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) {
      paintThemeButton(themeBtn);
      themeBtn.addEventListener("click", function () {
        var next = isDark() ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try { localStorage.setItem(KEY, next); } catch (e) { /* private mode */ }
        paintThemeButton(themeBtn);
        document.dispatchEvent(new CustomEvent("site-theme", { detail: next }));
      });
    }

    var menuBtn = document.getElementById("menu-toggle");
    var nav = document.getElementById("site-nav");
    if (menuBtn && nav) {
      menuBtn.addEventListener("click", function () {
        var open = nav.classList.toggle("open");
        menuBtn.setAttribute("aria-expanded", String(open));
      });
    }

    // copy buttons + light syntax colouring for <div class="code"><pre><code>
    document.querySelectorAll(".code").forEach(function (box) {
      var code = box.querySelector("code");
      if (!code) return;
      var raw = code.textContent;
      if (!box.hasAttribute("data-plain")) code.innerHTML = colour(raw, box.getAttribute("data-lang") || "js");
      var btn = document.createElement("button");
      btn.className = "copy";
      btn.type = "button";
      btn.textContent = "Copy";
      btn.addEventListener("click", function () {
        var done = function () {
          btn.textContent = "Copied";
          setTimeout(function () { btn.textContent = "Copy"; }, 1500);
        };
        if (navigator.clipboard) navigator.clipboard.writeText(raw).then(done, function () {});
      });
      box.appendChild(btn);
    });

    // tabs: <div class="tabs" data-tabs="group"> buttons with data-tab="id", panels with id
    document.querySelectorAll(".tabs").forEach(function (tabs) {
      var buttons = tabs.querySelectorAll("button[data-tab]");
      buttons.forEach(function (b) {
        b.setAttribute("role", "tab");
        b.addEventListener("click", function () {
          buttons.forEach(function (o) {
            var on = o === b;
            o.setAttribute("aria-selected", String(on));
            var panel = document.getElementById(o.getAttribute("data-tab"));
            if (panel) panel.hidden = !on;
          });
        });
      });
    });

    // docs: highlight the current section in the table of contents
    var tocLinks = document.querySelectorAll(".toc a[href^='#']");
    if (tocLinks.length && "IntersectionObserver" in window) {
      var map = {};
      tocLinks.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          tocLinks.forEach(function (a) { a.classList.remove("active"); });
          var a = map[e.target.id];
          if (a) a.classList.add("active");
        });
      }, { rootMargin: "-80px 0px -70% 0px" });
      Object.keys(map).forEach(function (id) {
        var el = document.getElementById(id);
        if (el) io.observe(el);
      });
    }
  });

  /** Very small syntax colouring (escapes first, then wraps tokens). */
  function colour(src, lang) {
    var esc = src.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    if (lang === "sh") return esc.replace(/(^|\n)(#[^\n]*)/g, '$1<span class="c-c">$2</span>');
    if (lang === "html") {
      // attributes first: the tag pass below only matches "&lt;", never the spans added here
      return esc
        .replace(/([\w-]+)="([^"\n]*)"/g, '<span class="c-a">$1</span>=<span class="c-s">"$2"</span>')
        .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="c-c">$1</span>')
        .replace(/(&lt;\/?)([a-zA-Z][\w-]*)/g, '$1<span class="c-t">$2</span>');
    }
    return esc.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(import|from|export|const|let|var|new|await|async|function|return|if|else|default|class|extends|true|false|null|undefined|this|type|interface)\b/g,
      function (m, c, s, k) {
        if (c) return '<span class="c-c">' + c + "</span>";
        if (s) return '<span class="c-s">' + s + "</span>";
        return '<span class="c-k">' + k + "</span>";
      });
  }
})();
