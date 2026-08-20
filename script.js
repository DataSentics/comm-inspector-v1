/* =================================================================
   AI Communication Inspector — minimal vanilla JS
   No frameworks, no libraries. Progressive enhancement only:
   the page is fully usable with JS disabled.
   ================================================================= */
(function () {
  "use strict";

  /* --- Current year in footer --- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* --- Sticky header: subtle shadow once scrolled --- */
  var header = document.getElementById("siteHeader");
  var onScroll = function () {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* --- Mobile nav toggle --- */
  var toggle = document.querySelector(".nav__toggle");
  var mobileNav = document.getElementById("mobileNav");
  if (toggle && header && mobileNav) {
    var setOpen = function (open) {
      header.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      mobileNav.hidden = !open;
    };
    toggle.addEventListener("click", function () {
      setOpen(!header.classList.contains("is-open"));
    });
    // Close the drawer after tapping any link inside it
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
  }

  /* --- Desktop nav dropdowns ("Modules", "Product") ---
     Same setOpen idiom as the mobile drawer: flip aria-expanded + an
     .is-open class (no inline styles). Each closes on: toggle again,
     click outside, Escape (returns focus to the button), or a link
     click. Opening one closes the others, so only ever one panel is
     open. Driven off every .nav__dropdown in the markup rather than a
     single hard-coded menu id, so adding a dropdown needs no JS change. */
  var navDropdowns = document.querySelectorAll(".nav__dropdown");
  if (navDropdowns.length) {
    var dropdowns = [];

    var closeDropdowns = function (except) {
      dropdowns.forEach(function (d) {
        if (d !== except) d.setOpen(false);
      });
    };

    navDropdowns.forEach(function (dropdown) {
      var toggle = dropdown.querySelector(".nav__dropdown-toggle");
      var menu = dropdown.querySelector(".nav__dropdown-menu");
      if (!toggle || !menu) return;

      var d = {
        dropdown: dropdown,
        toggle: toggle,
        isOpen: function () { return toggle.getAttribute("aria-expanded") === "true"; },
        setOpen: function (open) {
          dropdown.classList.toggle("is-open", open);
          toggle.setAttribute("aria-expanded", String(open));
        }
      };
      dropdowns.push(d);

      toggle.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = !d.isOpen();
        closeDropdowns(d);
        d.setOpen(open);
      });
      menu.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { d.setOpen(false); });
      });
    });

    document.addEventListener("click", function (e) {
      dropdowns.forEach(function (d) {
        if (!d.dropdown.contains(e.target)) d.setOpen(false);
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      dropdowns.forEach(function (d) {
        if (!d.isOpen()) return;
        d.setOpen(false);
        d.toggle.focus();
      });
    });
  }

  /* --- Scroll-reveal (IntersectionObserver), respects reduced-motion --- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* --- Animated metrics: count-up figures + hero coverage bars ---
     Reuses the same scroll-in idea as .reveal. Honours reduced-motion:
     when reduced, every value and bar is shown at its final state with no
     animation (the bars are filled purely by CSS via their --w target). */
  var counters = document.querySelectorAll("[data-count]");
  var coverageCard = document.querySelector(".coverage-card");

  var easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };

  var countUp = function (el) {
    var to = parseFloat(el.getAttribute("data-count-to"));
    if (isNaN(to)) return;
    var prefix = el.getAttribute("data-count-prefix") || "";
    var suffix = el.getAttribute("data-count-suffix") || "";
    var duration = 1150;
    var startTime = null;
    var step = function (now) {
      if (startTime === null) startTime = now;
      var p = Math.min((now - startTime) / duration, 1);
      el.textContent = prefix + Math.round(easeOutCubic(p) * to) + suffix;
      if (p < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  };

  if (reduceMotion || !("IntersectionObserver" in window)) {
    // Final state, no animation. Bars fill via CSS; values keep their markup.
    if (coverageCard) coverageCard.classList.add("is-in");
  } else {
    // Hold counters at zero until they scroll into view, then count up.
    counters.forEach(function (el) {
      var prefix = el.getAttribute("data-count-prefix") || "";
      var suffix = el.getAttribute("data-count-suffix") || "";
      el.textContent = prefix + "0" + suffix;
    });

    var mio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var t = entry.target;
        if (t === coverageCard) t.classList.add("is-in");
        if (t.hasAttribute("data-count")) countUp(t);
        mio.unobserve(t);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.25 });

    if (coverageCard) mio.observe(coverageCard);
    counters.forEach(function (el) { mio.observe(el); });
  }

  /* --- FAQ: per-question accordions + "view all" list disclosure ---
     Two independent layers. Each question toggles only its own answer
     (several can be open at once), and separately the list shows 4 of
     12 until expanded. Both are CSS-gated behind .js, so this script
     only flips classes and aria state. */
  var faq = document.getElementById("faq");
  if (faq) {
    faq.querySelectorAll(".faq__q").forEach(function (q) {
      q.addEventListener("click", function () {
        var item = q.closest(".faq__item");
        if (!item) return;
        var open = !item.classList.contains("is-open");
        item.classList.toggle("is-open", open);
        q.setAttribute("aria-expanded", String(open));
      });
    });

    var moreBtn = faq.querySelector("[data-faq-more]");
    var lessBtn = faq.querySelector("[data-faq-less]");
    if (moreBtn && lessBtn) {
      var setFaqExpanded = function (expanded) {
        faq.classList.toggle("faq--expanded", expanded);
        moreBtn.setAttribute("aria-expanded", String(expanded));
      };
      moreBtn.addEventListener("click", function () { setFaqExpanded(true); });
      lessBtn.addEventListener("click", function () {
        setFaqExpanded(false);
        // The collapse button sits far down the page; without this the
        // viewport would be left below the now-shorter section.
        moreBtn.scrollIntoView({ block: "center" });
      });
    }
  }

  /* --- Build vs. Partner vs. Buy: sync Build/Buy SaaS to equal height,
     excluding the (deliberately taller) featured card. CSS Grid has no
     way to match two siblings' height while excluding a third from the
     same row's height calculation, so this is a one-time static
     measurement, re-run on resize — not an animation. --- */
  var bpbGrid = document.querySelector(".bpb__grid");
  if (bpbGrid) {
    var syncBpbHeights = function () {
      var cards = bpbGrid.querySelectorAll(".bpb-card:not(.bpb-card--featured)");
      if (cards.length < 2) return;
      cards.forEach(function (c) { c.style.minHeight = ""; });
      if (window.matchMedia("(max-width: 860px)").matches) return; // single-column stack, nothing to sync
      var max = Math.max.apply(null, Array.prototype.map.call(cards, function (c) { return c.offsetHeight; }));
      cards.forEach(function (c) { c.style.minHeight = max + "px"; });
    };
    window.addEventListener("load", syncBpbHeights);
    window.addEventListener("resize", syncBpbHeights);
  }

  /* --- "Request a Demo" jumps to the form and focuses the first field --- */
  document.querySelectorAll("[data-demo-open]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      // Allow the default anchor jump to #demo, then focus the first input.
      window.setTimeout(function () {
        var first = document.getElementById("df-name");
        if (first) first.focus({ preventScroll: true });
      }, 420);
    });
  });

  /* --- Force English validation-bubble copy ---
     The native "Please fill in this field." bubble is localized by the
     browser/OS language, not by this page's lang="en" — so a Czech-locale
     browser shows Czech text regardless. Override with setCustomValidity
     so the bubble always reads in English, and clear it on input so the
     field still revalidates normally once corrected. */
  var validatedFields = document.querySelectorAll(
    "#demoForm input[required], #demoForm textarea[required], " +
    "#quoteForm input[required], #quoteForm textarea[required]"
  );
  validatedFields.forEach(function (field) {
    field.addEventListener("invalid", function () {
      if (field.validity.valueMissing) {
        field.setCustomValidity("Please fill in this field.");
      } else if (field.validity.typeMismatch && field.type === "email") {
        field.setCustomValidity("Please enter a valid email address.");
      }
    });
    field.addEventListener("input", function () {
      field.setCustomValidity("");
    });
  });

  /* --- Demo form handling ---
     Submits to Web3Forms via fetch so we can show the inline confirmation
     copy below instead of a page redirect. */
  var form = document.getElementById("demoForm");
  var note = document.getElementById("demoFormNote");
  var fields = document.getElementById("demoFormFields");
  var success = document.getElementById("demoFormSuccess");
  if (form && note && fields && success) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var submitBtn = form.querySelector("button[type=submit]");
      var data = {};
      new FormData(form).forEach(function (value, key) { data[key] = value; });

      note.textContent = "";
      note.className = "demo-form__note";
      if (submitBtn) submitBtn.disabled = true;

      fetch(form.getAttribute("action"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (res) { return res.json(); })
        .then(function (result) {
          if (result.success) {
            form.reset();
            fields.hidden = true;
            success.hidden = false;
          } else {
            note.textContent = "Something went wrong. Please try again or email us directly.";
            note.className = "demo-form__note is-err";
          }
        })
        .catch(function () {
          note.textContent = "Something went wrong. Please try again or email us directly.";
          note.className = "demo-form__note is-err";
        })
        .then(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  /* --- Custom quote form handling (pricing.html) — mirrors the demo
     form's Web3Forms fetch submit above. Distinct var names
     (quoteForm/quoteNote rather than reusing form/note) so the two
     submit closures never share state. --- */
  var quoteForm = document.getElementById("quoteForm");
  var quoteNote = document.getElementById("quoteFormNote");
  var quoteFields = document.getElementById("quoteFormFields");
  var quoteSuccess = document.getElementById("quoteFormSuccess");
  if (quoteForm && quoteNote && quoteFields && quoteSuccess) {
    quoteForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!quoteForm.checkValidity()) {
        quoteForm.reportValidity();
        return;
      }

      var quoteSubmitBtn = quoteForm.querySelector("button[type=submit]");
      var quoteData = {};
      new FormData(quoteForm).forEach(function (value, key) {
        if (key === "modules") {
          quoteData.modules = quoteData.modules ? quoteData.modules + ", " + value : value;
        } else {
          quoteData[key] = value;
        }
      });

      quoteNote.textContent = "";
      quoteNote.className = "demo-form__note";
      if (quoteSubmitBtn) quoteSubmitBtn.disabled = true;

      fetch(quoteForm.getAttribute("action"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(quoteData)
      })
        .then(function (res) { return res.json(); })
        .then(function (result) {
          if (result.success) {
            quoteForm.reset();
            quoteFields.hidden = true;
            quoteSuccess.hidden = false;
          } else {
            quoteNote.textContent = "Something went wrong. Please try again or email us directly.";
            quoteNote.className = "demo-form__note is-err";
          }
        })
        .catch(function () {
          quoteNote.textContent = "Something went wrong. Please try again or email us directly.";
          quoteNote.className = "demo-form__note is-err";
        })
        .then(function () {
          if (quoteSubmitBtn) quoteSubmitBtn.disabled = false;
        });
    });
  }

  /* --- Call Inspector demo video facade (ai-call-inspector.html) ---
     No iframe, and so no request to Google, until the visitor clicks.
     This page covers GDPR compliance and the site carries no cookie
     banner, so a standard youtube.com/embed firing on page load would
     set cookies without consent. youtube-nocookie.com only loads once
     the visitor explicitly asks for the video. */
  var videoPlay = document.getElementById("callInspectorVideoPlay");
  var videoFrame = document.getElementById("callInspectorVideoFrame");
  if (videoPlay && videoFrame) {
    videoPlay.addEventListener("click", function () {
      videoFrame.innerHTML =
        '<iframe src="https://www.youtube-nocookie.com/embed/Rx2tAZUPuXI?autoplay=1" ' +
        'title="Call Inspector demo" allowfullscreen loading="lazy"></iframe>';
    });
  }

  /* --- Ecosystem diagram: one-shot outline trace (architecture.html) ---
     Draws an orange line around each card and straight on along its
     outgoing connector into the next one, following the data flow. Each
     hop is a single <path> — perimeter then connector, so there is no seam
     where one becomes the other — revealed with the usual
     stroke-dasharray/dashoffset draw-on technique.

     Geometry is measured from the live layout rather than hard-coded, so it
     survives the grid reflowing (below 860px the horizontal connectors
     stand up and become vertical) and is re-measured on resize. The layer
     is decorative only: aria-hidden, pointer-events none, and card text
     never waits on it — content still appears via .reveal like everywhere
     else. It plays once per visit, so there is no perpetual animation over
     five seconds that would need a pause control (WCAG 2.2 SC 2.2.2), and
     it is skipped outright under prefers-reduced-motion. */
  var eco = document.querySelector(".eco");
  var ecoPrimary = eco && eco.querySelector(".eco__primary");
  var ecoSupport = eco && eco.querySelector(".eco__support");
  if (eco && ecoPrimary && ecoSupport && !reduceMotion) {
    var SVGNS = "http://www.w3.org/2000/svg";
    var HOP_MS = 2800;    // one card outline plus its outgoing connector
    var HOP_GAP = 200;    // beat between sequential hops
    var FORK_MS = 400;    // offset between the two feeds into the product card

    // Direct children only — nested cards (the Customer 360 sub-card) and
    // the cards inside .eco__support must not be picked up here.
    var kids = function (parent, selector) {
      return Array.prototype.filter.call(parent.children, function (el) {
        return el.matches(selector);
      });
    };

    var pCards = kids(ecoPrimary, ".eco__card");
    var pLinks = kids(ecoPrimary, ".eco__link");
    var feed = function (i) {
      var item = kids(ecoSupport, ".eco__support-item")[i];
      return item
        ? { card: kids(item, ".eco__card")[0], link: kids(item, ".eco__link")[0] }
        : {};
    };

    /* Data-flow order, with each hop's start time spelled out. The two
       supporting feeds (t2/t3) land on the same card, so they trace
       together — offset by FORK_MS — instead of queueing, which keeps the
       whole run to ~12s rather than dragging it past 15s. */
    var t0 = 0;                            // contact centre -> into the boundary
    var t1 = HOP_MS + HOP_GAP;             // communication  -> product
    var t2 = t1 + HOP_MS + HOP_GAP;        // data warehouse -> product
    var t3 = t2 + FORK_MS;                 // knowledge base -> product
    var t4 = t3 + HOP_MS + HOP_GAP;        // product        -> database

    var hops = [
      { card: kids(eco, ".eco__card")[0], link: kids(eco, ".eco__link")[0], at: t0 },
      { card: pCards[0],    link: pLinks[0],    at: t1 },
      { card: feed(0).card, link: feed(0).link, at: t2 },
      { card: feed(1).card, link: feed(1).link, at: t3 },
      { card: pCards[1],    link: pLinks[1],    at: t4 }
    ].filter(function (h) { return h.card && h.link; });

    var svg = null, drawn = [], played = false, ready = false;
    var n = function (v) { return Math.round(v * 10) / 10; };
    var relRect = function (el, origin) {
      var r = el.getBoundingClientRect();
      return { x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height };
    };

    /* Card perimeter, clockwise, starting and finishing at the exact point
       where the outgoing connector meets the edge, so the connector can be
       appended to the same path. */
    var perimeter = function (b, rad, side, at) {
      var x = b.x, y = b.y, x2 = b.x + b.w, y2 = b.y + b.h;
      var r = Math.max(0, Math.min(rad, Math.min(b.w, b.h) / 2));
      var arc = function (ex, ey) {
        return "A " + n(r) + " " + n(r) + " 0 0 1 " + n(ex) + " " + n(ey);
      };
      var aTR = arc(x2, y + r), aBR = arc(x2 - r, y2),
          aBL = arc(x, y2 - r), aTL = arc(x + r, y);
      var cx = Math.min(Math.max(at, x + r), x2 - r);
      var cy = Math.min(Math.max(at, y + r), y2 - r);
      if (side === "top") {
        return ["M " + n(cx) + " " + n(y), "L " + n(x2 - r) + " " + n(y), aTR,
                "L " + n(x2) + " " + n(y2 - r), aBR, "L " + n(x + r) + " " + n(y2), aBL,
                "L " + n(x) + " " + n(y + r), aTL, "L " + n(cx) + " " + n(y)].join(" ");
      }
      if (side === "right") {
        return ["M " + n(x2) + " " + n(cy), "L " + n(x2) + " " + n(y2 - r), aBR,
                "L " + n(x + r) + " " + n(y2), aBL, "L " + n(x) + " " + n(y + r), aTL,
                "L " + n(x2 - r) + " " + n(y), aTR, "L " + n(x2) + " " + n(cy)].join(" ");
      }
      if (side === "bottom") {
        return ["M " + n(cx) + " " + n(y2), "L " + n(x + r) + " " + n(y2), aBL,
                "L " + n(x) + " " + n(y + r), aTL, "L " + n(x2 - r) + " " + n(y), aTR,
                "L " + n(x2) + " " + n(y2 - r), aBR, "L " + n(cx) + " " + n(y2)].join(" ");
      }
      return ["M " + n(x) + " " + n(cy), "L " + n(x) + " " + n(y + r), aTL,
              "L " + n(x2 - r) + " " + n(y), aTR, "L " + n(x2) + " " + n(y2 - r), aBR,
              "L " + n(x + r) + " " + n(y2), aBL, "L " + n(x) + " " + n(cy)].join(" ");
    };

    var build = function () {
      var origin = eco.getBoundingClientRect();
      if (!origin.width) return false;
      if (!svg) {
        svg = document.createElementNS(SVGNS, "svg");
        svg.setAttribute("class", "eco__trace");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("focusable", "false");
        eco.appendChild(svg);
      }
      svg.setAttribute("width", n(origin.width));
      svg.setAttribute("height", n(origin.height));
      svg.setAttribute("viewBox", "0 0 " + n(origin.width) + " " + n(origin.height));
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      drawn = [];

      hops.forEach(function (hop) {
        var c = relRect(hop.card, origin);
        var l = relRect(hop.link, origin);
        var lcx = l.x + l.w / 2, lcy = l.y + l.h / 2;

        /* Which edge the connector leaves from is derived from where the
           connector actually sits, which is what lets the mobile reflow
           (arrows rotating from horizontal to vertical) work with no
           special-casing. */
        var side, at, endX, endY;
        if (lcx > c.x + c.w)      { side = "right";  at = lcy; endX = l.x + l.w; endY = lcy; }
        else if (lcx < c.x)       { side = "left";   at = lcy; endX = l.x;       endY = lcy; }
        else if (lcy > c.y + c.h) { side = "bottom"; at = lcx; endX = lcx; endY = l.y + l.h; }
        else                      { side = "top";    at = lcx; endX = lcx; endY = l.y; }

        var radius = parseFloat(getComputedStyle(hop.card).borderTopLeftRadius) || 0;
        var path = document.createElementNS(SVGNS, "path");
        path.setAttribute("d", perimeter(c, radius, side, at) + " L " + n(endX) + " " + n(endY));
        svg.appendChild(path);

        var len = path.getTotalLength();
        path.style.strokeDasharray = len;
        // A rebuild after the run (resize) comes back already drawn rather
        // than replaying the whole sequence.
        path.style.strokeDashoffset = played ? 0 : len;
        drawn.push({ el: path, len: len, at: hop.at });
      });
      return true;
    };

    var play = function () {
      played = true;
      drawn.forEach(function (p) {
        if (typeof p.el.animate !== "function") { p.el.style.strokeDashoffset = 0; return; }
        p.el.animate(
          [{ strokeDashoffset: p.len }, { strokeDashoffset: 0 }],
          { duration: HOP_MS, delay: p.at, easing: "ease-in-out", fill: "forwards" }
        );
      });
    };

    /* Measured at the moment it is needed rather than up front, so web
       fonts have settled and the card boxes are at their final size. */
    var startTrace = function () {
      if (played || !build()) return;
      ready = true;
      play();
    };

    if ("IntersectionObserver" in window) {
      var traceIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || played) return;
          traceIO.unobserve(entry.target);   // one shot, never a loop
          startTrace();
        });
      }, { threshold: 0.15 });
      traceIO.observe(eco);
    } else {
      window.addEventListener("load", startTrace);
    }

    var traceResize = null;
    window.addEventListener("resize", function () {
      if (!ready) return;
      window.clearTimeout(traceResize);
      traceResize = window.setTimeout(build, 150);
    });
  }
})();
