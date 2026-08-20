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
})();
