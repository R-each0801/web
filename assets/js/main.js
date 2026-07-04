/* R-each site — language toggle, nav, scroll reveal */
(function () {
  "use strict";

  /* ---- language ---- */
  var stored = null;
  try { stored = localStorage.getItem("reach-lang"); } catch (e) {}
  var lang = stored || ((navigator.language || "ja").toLowerCase().indexOf("ja") === 0 ? "ja" : "en");
  setLang(lang, false);

  function setLang(l, persist) {
    document.documentElement.setAttribute("data-l", l);
    document.documentElement.setAttribute("lang", l);
    document.querySelectorAll(".lang-toggle button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-lang") === l);
    });
    if (persist) {
      try { localStorage.setItem("reach-lang", l); } catch (e) {}
    }
  }

  document.addEventListener("click", function (ev) {
    var b = ev.target.closest(".lang-toggle button");
    if (b) setLang(b.getAttribute("data-lang"), true);
  });

  /* ---- header scroll state ---- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- mobile nav ---- */
  var burger = document.querySelector(".nav-burger");
  if (burger) {
    burger.addEventListener("click", function () {
      document.body.classList.toggle("nav-open");
    });
    document.querySelectorAll(".site-nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
      });
    });
  }

  /* ---- scroll reveal ---- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("vis");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".rv").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".rv").forEach(function (el) { el.classList.add("vis"); });
  }
})();
