/* AI Comms Inspector: analytics layer (GA4 via gtag). No framework, no build step.
   Loaded synchronously on every page, right after the Cookiebot script (which must stay first).
   gtag() is defined by the inline snippet that follows, and every call below is wrapped so a missing
   or blocked gtag (no cookie consent yet) never breaks the page.

   What it does
   1. homepage_variant: "v1" (index.html), "v2" (index-v2.html, or any page opened with ?hp=v2),
      otherwise "none". Exposed as window.ciVariant() so the GA snippet can put it on page_view, and
      added to every custom event below.
   2. Keeps V2 visitors on V2: on V2 pages, internal links get ?hp=v2, links to index.html become
      index-v2.html, and the homepage-only anchors are mapped (#demo > #contact, #delivers > #questions,
      #faq > #webinar, #stack > architecture.html). Internal links never carry utm_* (that would reset
      the traffic source in GA4); hp is the only internal marker.
   3. Events: scroll_depth (10/25/50/75/90/100 %), section_view ([data-section] blocks), scroll_summary
      (furthest point, on exit), cta_click, internal_click, form_start. generate_lead stays where it was.
   4. Lead attribution: before a form is submitted, hidden fields with utm_*, gclid/gbraid/wbraid (Google), fbclid (Meta), li_fat_id (LinkedIn), landing page,
      referrer and homepage_variant are added, so each lead e-mail names its source even when GA4 saw nothing.
      Across pages the first-touch values are kept in sessionStorage only after Cookiebot statistics consent.

   Section markup: <section data-section="faq" data-step="faq">. data-step is the comparable journey step
   (hero, proof, problem, offer, how, evidence, fit, people, faq, webinar, mission, contact, footer). */
(function () {
  "use strict";

  var params;
  try { params = new URLSearchParams(window.location.search); } catch (e) { params = { get: function () { return null; } }; }
  var file = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();

  var VARIANT = "none";
  if (/^index-v2(\.html)?$/.test(file) || params.get("hp") === "v2") VARIANT = "v2";
  else if (file === "index.html") VARIANT = "v1";
  window.ciVariant = function () { return VARIANT; };

  var send = function (name, extra) {
    var p = { homepage_variant: VARIANT };
    for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) p[k] = extra[k];
    try { if (typeof window.gtag === "function") window.gtag("event", name, p); } catch (e) {}
  };
  window.ciTrack = send;

  var locationOf = function (el) {
    if (el.closest(".sticky-cta")) return "sticky";
    if (el.closest("header")) return "header";
    if (el.closest("footer")) return "footer";
    var s = el.closest("[data-section]");
    return s ? s.getAttribute("data-section") : "page";
  };
  var fileOf = function (href) {
    try { return (new URL(href, window.location.href).pathname.split("/").pop() || "index.html").toLowerCase(); }
    catch (e) { return ""; }
  };

  /* ---- 2. Keep V2 visitors on V2 ---- */
  var HASH_MAP = { "#demo": "#contact", "#delivers": "#questions", "#faq": "#webinar" };
  var rewriteLinks = function () {
    if (VARIANT !== "v2") return;
    var links = document.querySelectorAll("a[href]");
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var raw = a.getAttribute("href");
      if (!raw || raw.charAt(0) === "#") continue;
      if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^https?:/i.test(raw)) continue;
      var url;
      try { url = new URL(raw, window.location.href); } catch (e) { continue; }
      if (url.origin !== window.location.origin) continue;
      var f = (url.pathname.split("/").pop() || "index.html").toLowerCase();
      var dir = !/\.html?$/.test(f) && url.pathname.slice(-1) === "/";
      if (!/\.html?$/.test(f) && !dir) continue;
      var prefix = raw.replace(/[?#].*$/, "");
      var hash = url.hash;
      var search = url.search;
      if (f === "index.html" || dir) {
        if (hash === "#stack") {
          prefix = prefix.replace(/index\.html$/i, "architecture.html");
          if (dir) prefix += "architecture.html";
          hash = "";
          url.searchParams.set("hp", "v2");
          search = url.search;
        } else {
          prefix = dir ? prefix + "index-v2.html" : prefix.replace(/index\.html$/i, "index-v2.html");
          hash = HASH_MAP[hash] || hash;
        }
      } else if (/^index-v2(\.html)?$/.test(f)) {
        continue;
      } else {
        url.searchParams.set("hp", "v2");
        search = url.search;
      }
      a.setAttribute("href", prefix + search + hash);
    }
  };

  /* ---- 3. Lead attribution (hidden form fields) ---- */
  var KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "gbraid", "wbraid", "fbclid", "li_fat_id"];
  var STORE = "ci_attr";
  var fromUrl = function () {
    var o = {};
    for (var i = 0; i < KEYS.length; i++) {
      var v = params.get(KEYS[i]);
      if (v) o[KEYS[i]] = String(v).slice(0, 200);
    }
    return o;
  };
  var hasStatsConsent = function () {
    try { return !!(window.Cookiebot && window.Cookiebot.consent && window.Cookiebot.consent.statistics); }
    catch (e) { return false; }
  };
  var strip = function (u) { return String(u || "").replace(/[?#].*$/, "").slice(0, 200); };
  var remember = function () {
    if (!hasStatsConsent()) return;
    try {
      if (window.sessionStorage.getItem(STORE)) return;
      var o = fromUrl();
      o.landing_page = window.location.pathname;
      o.referrer = strip(document.referrer);
      o.landing_variant = VARIANT;
      window.sessionStorage.setItem(STORE, JSON.stringify(o));
    } catch (e) {}
  };
  var attribution = function () {
    var o = {};
    try {
      var s = window.sessionStorage.getItem(STORE);
      if (s && hasStatsConsent()) o = JSON.parse(s) || {};
    } catch (e) {}
    var u = fromUrl();
    for (var k in u) if (Object.prototype.hasOwnProperty.call(u, k)) o[k] = u[k];
    if (!o.landing_page) o.landing_page = window.location.pathname;
    if (!o.referrer) o.referrer = strip(document.referrer);
    o.homepage_variant = VARIANT;
    o.page_url = window.location.pathname + (VARIANT === "v2" && file !== "index-v2.html" ? "?hp=v2" : "");
    return o;
  };
  var setHidden = function (form, name, value) {
    if (!value) return;
    var el = form.querySelector('input[name="' + name + '"]');
    if (!el) {
      el = document.createElement("input");
      el.type = "hidden";
      el.name = name;
      form.appendChild(el);
    }
    el.value = value;
  };
  /* Capture phase: runs before the page's own submit handlers read FormData. */
  document.addEventListener("submit", function (e) {
    var form = e.target;
    if (!form || !form.getAttribute || !/web3forms\.com/.test(form.getAttribute("action") || "")) return;
    var o = attribution();
    for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) setHidden(form, k, o[k]);
  }, true);
  window.addEventListener("CookiebotOnAccept", remember);

  /* ---- 3. Engagement events ---- */
  var FORM_IDS = { demoForm: "demo_walkthrough", quoteForm: "quote_request", contactForm: "demo_walkthrough" };
  var formIdOf = function (form) {
    if (form.id && FORM_IDS[form.id]) return FORM_IDS[form.id];
    var root = form.closest("[data-vid-root]");
    if (root) return root.getAttribute("data-vid-form-id") || "video_gate";
    if (form.classList.contains("gate")) return "webinar_gate_v2";
    return form.id || "form";
  };
  var startedForms = [];
  document.addEventListener("focusin", function (e) {
    var t = e.target;
    if (!t || !/^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
    var form = t.closest("form");
    if (!form || startedForms.indexOf(form) !== -1) return;
    startedForms.push(form);
    send("form_start", { form_id: formIdOf(form), form_location: locationOf(form) });
  });

  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    var href = a.getAttribute("href") || "";
    var type = "";
    if (a.hasAttribute("data-demo-open") || /#(demo|contact)$/.test(href)) type = "book";
    else if (/webinar/i.test(href)) type = "webinar";
    else if (/linkedin\.com/i.test(href)) type = "linkedin";
    var where = locationOf(a);
    if (type) {
      send("cta_click", {
        cta_type: type,
        cta_location: where,
        cta_text: (a.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60),
        transport_type: "beacon"
      });
      return;
    }
    var target = fileOf(a.href);
    if (/\.html?$/.test(target) && target !== file && !(file === "index.html" && target === "index.html")) {
      send("internal_click", { target_page: target, link_location: where, transport_type: "beacon" });
    }
  });

  var scrolled = false;
  var maxPct = 0;
  var fired = {};
  var THRESHOLDS = [10, 25, 50, 75, 90, 100];
  var ticking = false;
  var measure = function () {
    ticking = false;
    var doc = document.documentElement;
    var h = Math.max(doc.scrollHeight, document.body ? document.body.scrollHeight : 0);
    if (!h) return;
    var pct = ((window.pageYOffset || doc.scrollTop || 0) + window.innerHeight) / h * 100;
    if (pct > maxPct) maxPct = Math.min(100, pct);
    for (var i = 0; i < THRESHOLDS.length; i++) {
      var t = THRESHOLDS[i];
      if (!fired[t] && pct >= t - 0.5) {
        fired[t] = true;
        send("scroll_depth", { percent: t, page_height: h });
      }
    }
  };
  window.addEventListener("scroll", function () {
    scrolled = true;
    if (!ticking) { ticking = true; window.requestAnimationFrame(measure); }
  }, { passive: true });

  var seen = {};
  var furthest = null;
  var sectionEls;
  var observeSections = function () {
    sectionEls = document.querySelectorAll("[data-section]");
    if (!sectionEls.length || !("IntersectionObserver" in window)) return;
    var order = {};
    for (var i = 0; i < sectionEls.length; i++) order[sectionEls[i].getAttribute("data-section")] = i + 1;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var big = en.intersectionRatio >= 0.25 || en.intersectionRect.height >= window.innerHeight * 0.5;
        if (!big) return;
        var id = en.target.getAttribute("data-section");
        if (seen[id]) return;
        seen[id] = true;
        var info = { section_id: id, section_step: en.target.getAttribute("data-step") || id, section_order: order[id] };
        if (!furthest || info.section_order > furthest.section_order) furthest = info;
        send("section_view", info);
        io.unobserve(en.target);
      });
    }, { threshold: [0, 0.1, 0.25, 0.5] });
    for (var j = 0; j < sectionEls.length; j++) io.observe(sectionEls[j]);
  };

  var summarySent = false;
  var summary = function () {
    if (summarySent || (!scrolled && !furthest)) return;
    summarySent = true;
    var p = { max_percent: Math.round(maxPct), time_on_page_ms: Math.round(window.performance && performance.now ? performance.now() : 0), transport_type: "beacon" };
    if (furthest) { p.section_id = furthest.section_id; p.section_step = furthest.section_step; p.section_order = furthest.section_order; }
    send("scroll_summary", p);
  };
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") summary(); });
  window.addEventListener("pagehide", summary);

  var ready = function () {
    rewriteLinks();
    observeSections();
    remember();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();
