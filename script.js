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

  /* --- Desktop "Modules" dropdown ---
     Same setOpen idiom as the mobile drawer: flip aria-expanded + an
     .is-open class (no inline styles). Closes on: toggle again, click
     outside, Escape (returns focus to the button), or a link click. */
  var moduleToggle = document.querySelector(".nav__dropdown-toggle");
  var moduleMenu = document.getElementById("modulesMenu");
  var moduleDropdown = moduleToggle ? moduleToggle.closest(".nav__dropdown") : null;
  if (moduleToggle && moduleMenu && moduleDropdown) {
    var setModulesOpen = function (open) {
      moduleDropdown.classList.toggle("is-open", open);
      moduleToggle.setAttribute("aria-expanded", String(open));
    };
    moduleToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      setModulesOpen(moduleToggle.getAttribute("aria-expanded") !== "true");
    });
    moduleMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setModulesOpen(false); });
    });
    document.addEventListener("click", function (e) {
      if (!moduleDropdown.contains(e.target)) setModulesOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && moduleToggle.getAttribute("aria-expanded") === "true") {
        setModulesOpen(false);
        moduleToggle.focus();
      }
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

  /* --- Demo form handling ---
     If TODO_FORM_ENDPOINT has not been wired to a real endpoint, we
     intercept the submit and show a friendly placeholder confirmation
     instead of posting to a non-existent URL. Once the endpoint is set,
     remove the guard below (or it will simply pass through). */
  var form = document.getElementById("demoForm");
  var note = document.getElementById("demoFormNote");
  if (form && note) {
    form.addEventListener("submit", function (e) {
      // Native validation first.
      if (!form.checkValidity()) {
        return; // let the browser show its messages
      }

      var endpointWired = form.getAttribute("action") !== "TODO_FORM_ENDPOINT";
      if (!endpointWired) {
        e.preventDefault();
        note.textContent =
          "Thank you — this is a demo placeholder. Wire TODO_FORM_ENDPOINT to send this request.";
        note.className = "demo-form__note is-ok";
        form.reset();
      }
      // If the endpoint IS wired, we do nothing and let the form post normally.
    });
  }
})();
