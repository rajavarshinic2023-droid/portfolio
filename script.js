(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Smooth scroll for in-page links ---------- */
  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = this.getAttribute("href");
      var target = id.length > 1 ? $(id) : null;
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
        closeMenu();
      }
    });
  });

  /* ---------- Mobile menu ---------- */
  var navbar = $("#navbar"), menuBtn = $("#menuBtn");
  function closeMenu() {
    navbar.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  }
  menuBtn.addEventListener("click", function () {
    var open = navbar.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });

  /* ---------- Theme toggle ---------- */
  var root = document.documentElement;
  $("#themeToggle").addEventListener("click", function () {
    var current = root.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    var next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });

  /* ---------- Scroll progress, navbar state, back-to-top ---------- */
  var progress = $("#progress"), toTop = $("#toTop");
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    progress.style.transform = "scaleX(" + (max > 0 ? h.scrollTop / max : 0) + ")";
    navbar.classList.toggle("scrolled", h.scrollTop > 10);
    toTop.classList.toggle("show", h.scrollTop > 700);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });

  /* ---------- Active nav link ---------- */
  var links = $$(".nav-links a");
  var sections = ["home", "about", "activities", "contact"].map(function (id) { return document.getElementById(id); });
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) {
            a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id);
          });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { s && spy.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = $$(".reveal, .activity-card");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("visible");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el, i) {
      if (el.classList.contains("activity-card")) el.style.transitionDelay = (i % 3) * 80 + "ms";
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- Count-up numbers ---------- */
  $$("[data-count]").forEach(function (el) {
    var end = parseInt(el.dataset.count, 10);
    if (reduce || !("IntersectionObserver" in window)) return;
    var done = false;
    new IntersectionObserver(function (en, obs) {
      if (en[0].isIntersecting && !done) {
        done = true; obs.disconnect();
        var start = performance.now(), dur = 900;
        (function tick(now) {
          var p = Math.min((now - start) / dur, 1);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        })(start);
      }
    }).observe(el);
  });


  /* ---------- Google Drive links for audio and video ---------- */
  var driveLinks = window.PORTFOLIO_DRIVE_LINKS || {};
  $$("[data-drive-link]").forEach(function (link) {
    var key = link.getAttribute("data-drive-link");
    var url = driveLinks[key];
    if (url && /^https:\/\/drive\.google\.com\//i.test(url)) {
      link.href = url;
    } else {
      link.href = "#";
      link.addEventListener("click", function (e) {
        e.preventDefault();
        alert("Add the Google Drive sharing link in drive-links.js before publishing this portfolio.");
      });
    }
  });

  /* ---------- Clean up images / videos that fail to load ---------- */
  $$(".card-image img, .image-frame img").forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) img.dispatchEvent(new Event("error"));
  });

  /* ---------- Filters ---------- */
  var chips = $$(".chip"), cards = $$(".activity-card"), empty = $("#empty");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      chips.forEach(function (c) { c.classList.remove("active"); });
      chip.classList.add("active");
      var f = chip.dataset.filter, shown = 0;
      cards.forEach(function (card) {
        var match = f === "all" || card.dataset.cat === f;
        card.classList.toggle("hide", !match);
        if (match) { shown++; card.classList.add("visible"); }
      });
      empty.hidden = shown > 0;
    });
  });

  /* ---------- Card spotlight following the cursor ---------- */
  cards.forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- Subtle 3D tilt on the profile frame ---------- */
  var frame = $("#tiltFrame");
  if (frame && !reduce && window.matchMedia("(hover: hover)").matches) {
    var wrap = frame.parentElement;
    wrap.addEventListener("pointermove", function (e) {
      var r = wrap.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      frame.style.transform = "rotateY(" + x * 10 + "deg) rotateX(" + -y * 8 + "deg)";
    });
    wrap.addEventListener("pointerleave", function () { frame.style.transform = ""; });
  }

  /* ---------- Lightbox for image links ---------- */
  var lb = $("#lightbox"), lbImg = $("img", lb);
  function closeLb() { lb.hidden = true; document.body.classList.remove("no-scroll"); }
  $$("[data-lightbox]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var card = a.closest(".activity-card");
      var img = card && $(".card-image img", card);
      if (!img) return;          // no real image yet → fall back to normal link
      e.preventDefault();
      lbImg.src = a.getAttribute("href");
      lbImg.alt = img.alt;
      lb.hidden = false;
      document.body.classList.add("no-scroll");
    });
  });
  lb.addEventListener("click", closeLb);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeLb(); closeMenu(); } });
})();

/* ============================================================
   Round 2 — extra polish
   ============================================================ */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hover = window.matchMedia("(hover: hover)").matches;

  /* Typewriter */
  var typed = $("#typed");
  if (typed && !reduce) {
    var words = ["Learning Python", "Creating projects", "Exploring ideas", "Learning · Creating · Exploring"];
    var w = 0, c = 0, del = false;
    (function loop() {
      var word = words[w];
      typed.textContent = word.slice(0, c);
      if (!del && c === word.length) { del = true; return setTimeout(loop, 1700); }
      if (del && c === 0) { del = false; w = (w + 1) % words.length; return setTimeout(loop, 300); }
      c += del ? -1 : 1;
      setTimeout(loop, del ? 28 : 70);
    })();
  }

  if (reduce || !hover) return;

  /* Cursor glow */
  var glow = $("#cursorGlow"), gx = 0, gy = 0, tx = 0, ty = 0;
  window.addEventListener("pointermove", function (e) { tx = e.clientX; ty = e.clientY; glow.classList.add("on"); });
  document.addEventListener("pointerleave", function () { glow.classList.remove("on"); });
  (function follow() {
    gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
    glow.style.transform = "translate(" + gx + "px," + gy + "px)";
    requestAnimationFrame(follow);
  })();

  /* Magnetic buttons */
  $$(".primary-btn, .nav-button").forEach(function (btn) {
    btn.addEventListener("pointermove", function (e) {
      var r = btn.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) * 0.25;
      var y = (e.clientY - r.top - r.height / 2) * 0.35;
      btn.style.transform = "translate(" + x + "px," + (y - 3) + "px)";
    });
    btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
  });

  /* Card 3D tilt */
  $$(".activity-card").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty("--ry", (x * 7).toFixed(2) + "deg");
      card.style.setProperty("--rx", (-y * 6).toFixed(2) + "deg");
    });
    card.addEventListener("pointerleave", function () {
      card.style.setProperty("--ry", "0deg");
      card.style.setProperty("--rx", "0deg");
    });
  });

  /* Parallax on scroll */
  var orbit = $(".orbit"), blobs = $$(".aurora i");
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    if (orbit) orbit.style.marginTop = (-200 + y * 0.08) + "px";
    blobs.forEach(function (b, i) { b.style.translate = "0 " + (-y * (0.04 + i * 0.03)) + "px"; });
  }, { passive: true });
})();
