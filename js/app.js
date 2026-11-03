(function () {
  "use strict";
  var S = window.SITE;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var img = function (n) { return "img/" + n + ".webp"; };
  var rub = function (n) { return Math.round(n).toLocaleString("ru-RU").replace(/[ ,]/g, " ") + " ₽"; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var PAGES = ["home", "dom", "biznes", "partneram", "o-nas", "politika"];
  var KVIZ = { home: "home-kviz", dom: "dom-kviz", biznes: "biz-kviz", partneram: "p-kviz", "o-nas": "home-kviz", politika: "home-kviz" };
  var DEMO_NOTE = "Форма работает в тестовом режиме, заявка пока не отправляется. Позвоните или напишите нам: +7 (937) 276-07-26.";

  /* Leads: no backend on the prototype yet. Replace this function to connect a CRM or Google Sheets. */
  function saveLead(data) { return Promise.resolve(false); }

  /* ---------- router ---------- */
  var currentPage = null;
  function scrollToY(y) { try { window.scrollTo(0, y); } catch (e) {} }
  function scrollToEl(el) {
    if (!el) return;
    var hdr = $(".hdr"), off = (hdr ? hdr.offsetHeight : 0);
    scrollToY(Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - off));
  }
  function show(page, anchor) {
    if (PAGES.indexOf(page) < 0) page = "home";
    var changed = page !== currentPage;
    currentPage = page;
    document.body.dataset.page = page;
    $$(".page").forEach(function (p) { p.hidden = p.dataset.page !== page; });
    $$("[data-nav]").forEach(function (a) {
      if (a.dataset.nav === page) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    var sec = $('.page[data-page="' + page + '"]');
    if (sec && sec.dataset.title) document.title = sec.dataset.title;
    closeMenu();
    if (changed) document.dispatchEvent(new CustomEvent("pagechange", { detail: page }));
    if (anchor) setTimeout(function () { scrollToEl(document.getElementById(anchor)); }, changed ? 60 : 0);
    else if (changed) scrollToY(0);
  }
  function go(target) {
    if (target === "@kviz") target = currentPage + "#" + KVIZ[currentPage];
    var parts = target.split("#"), page = parts[0], anchor = parts[1];
    if (page !== currentPage) { try { history.pushState(null, "", "#" + page); } catch (e) {} }
    show(page, anchor);
  }
  window.addEventListener("popstate", function () { show((location.hash || "#home").slice(1)); });
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-go]");
    if (t) { e.preventDefault(); go(t.dataset.go); return; }
    var a = e.target.closest('a[href^="#"]');
    if (a) { var h = a.getAttribute("href").slice(1); if (PAGES.indexOf(h) > -1) { e.preventDefault(); go(h); } }
  });

  /* ---------- header ---------- */
  var burger = $(".burger"), nav = $("#nav"), hdr = $(".hdr");
  function closeMenu() { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); }
  burger.addEventListener("click", function () {
    var open = !nav.classList.contains("open");
    nav.classList.toggle("open", open); burger.setAttribute("aria-expanded", String(open));
  });

  /* ---------- renderers ---------- */
  function priceLabel(p) { return p ? "от " + rub(p) + " / м²" : "Цена по расчёту"; }
  function renderDirs(el) {
    var seg = el.dataset.seg;
    el.innerHTML = S.dirs[seg].map(function (g) {
      var cards = g.items.map(function (d) {
        return '<article class="dir" id="dir-' + d.id + '"><div class="dir-img"><img src="' + img(d.img) + '" alt="' + esc(d.t) + '" loading="lazy"></div>' +
          '<h4>' + esc(d.t) + '</h4><p>' + esc(d.d) + '</p><span class="dir-p">' + priceLabel(d.p) + "</span></article>";
      }).join("");
      var note = g.note ? '<div class="dir-note"><div><h4>' + esc(g.note.t) + "</h4><p>" + esc(g.note.d) + '</p></div><button class="btn btn-line" type="button" data-go="' + g.note.go + '">' + esc(g.note.btn) + "</button></div>" : "";
      return '<div class="dir-group"><h3 class="dir-group-h">' + esc(g.group) + '</h3><div class="dir-grid" style="--n:' + Math.min(g.items.length, 5) + '">' + cards + "</div>" + note + "</div>";
    }).join("");
  }
  function renderRouteLinks(el) {
    var seg = el.dataset.seg, pg = seg === "dom" ? "dom" : "biznes";
    el.innerHTML = S.routeLinks[seg].map(function (l) {
      return '<li><a href="#' + pg + '" data-go="' + pg + "#dir-" + l[0] + '">' + esc(l[1]) + "</a></li>";
    }).join("");
  }
  function renderPrices(el, seg) {
    seg = seg || el.dataset.seg;
    el.innerHTML = S.prices[seg].map(function (p) {
      return '<article class="price"><div class="price-img"><img src="' + img(p.img) + '" alt="" loading="lazy"></div><h3>' + esc(p.t) + "</h3><p>" + esc(p.s) + '</p><p class="price-v">' +
        (p.p ? "от " + rub(p.p) + "<small>за м²</small>" : "<small>по замеру</small>") + "</p></article>";
    }).join("");
  }
  function renderExamples(el) {
    el.innerHTML = S.examples.map(function (x) {
      return '<article class="ex"><div class="ex-img"><img src="' + img(x.img) + '" alt="' + esc(x.t) + '" loading="lazy"></div><h3>' + esc(x.t) + "</h3><dl>" +
        x.rows.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") +
        "<dt>За м²</dt><dd>от " + rub(x.p) + '</dd></dl><p class="ex-v">от ' + rub(x.area * x.p) + "</p></article>";
    }).join("");
  }
  function renderFaq(el) {
    el.innerHTML = S.faq[el.dataset.seg].map(function (f) { return "<details><summary>" + esc(f[0]) + "</summary><p>" + esc(f[1]) + "</p></details>"; }).join("");
  }

  /* cases */
  function byId(id) { return S.cases.filter(function (c) { return c.id === id; })[0]; }
  function scopeCases(scope) {
    if (scope === "featured") return S.featured.map(byId).filter(Boolean);
    return S.cases.filter(function (c) {
      if (scope === "dom") return c.cat === "dom" || c.cat === "spa";
      if (scope === "biz") return c.cat !== "dom";
      return true;
    });
  }
  function caseCard(c) {
    return '<button class="case" type="button" data-case="' + c.id + '"><span class="case-img"><img src="' + img(c.imgs[0]) + '" alt="' + esc(c.t + ", " + c.type) + '" loading="lazy">' +
      (c.imgs.length > 1 ? '<span class="case-n">' + c.imgs.length + " фото</span>" : "") + '</span><span class="case-t">' + esc(c.t) + '</span><span class="case-s">' + esc(c.type) + "</span></button>";
  }
  function renderCases(el) {
    var list = scopeCases(el.dataset.scope), f = el.dataset.filter;
    if (f && f !== "all") list = (el.dataset.scope === "featured" ? S.cases : list).filter(function (c) { return c.cat === f; });
    var lim = parseInt(el.dataset.limit || "999", 10), expanded = el.dataset.expanded === "1";
    el.innerHTML = (expanded ? list : list.slice(0, lim)).map(caseCard).join("");
    var more = el.parentElement.querySelector("[data-more]");
    if (more) more.hidden = expanded || list.length <= lim;
    if (el.classList.contains("rail")) el.scrollLeft = 0;
  }
  function renderFilters(el) {
    var cats = el.dataset.filters === "biz" ? ["fasad", "office", "prom", "spa"] : ["dom", "fasad", "office", "prom", "spa"];
    el.innerHTML = '<button type="button" aria-pressed="true" data-f="all">Все</button>' + cats.map(function (c) {
      return '<button type="button" aria-pressed="false" data-f="' + c + '">' + S.catNames[c] + "</button>";
    }).join("");
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-f]"); if (!b) return;
      $$("button", el).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      var grid = el.closest(".wrap").querySelector(".cases");
      grid.dataset.filter = b.dataset.f; grid.dataset.expanded = "0"; renderCases(grid);
    });
  }
  $$("[data-rail]").forEach(function (b) {
    b.addEventListener("click", function () {
      var r = b.closest(".wrap").querySelector(".rail");
      r.scrollBy({ left: (b.dataset.rail === "next" ? 1 : -1) * r.clientWidth * 0.8, behavior: "smooth" });
    });
  });

  /* case modal */
  var modal = $("#caseModal");
  function openCase(id) {
    var c = byId(id); if (!c) return;
    $("#cm-title").textContent = c.t;
    $("#cm-type").textContent = c.type;
    $("#cm-did").innerHTML = c.did.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("");
    var main = $("#cm-img");
    function pick(i) {
      main.src = img(c.imgs[i]); main.alt = c.t + ", фото " + (i + 1);
      $$("#cm-thumbs button").forEach(function (b, j) { b.setAttribute("aria-current", String(i === j)); });
    }
    $("#cm-thumbs").innerHTML = c.imgs.length > 1 ? c.imgs.map(function (s, i) { return '<button type="button" aria-label="Фото ' + (i + 1) + '"><img src="' + img(s) + '" alt=""></button>'; }).join("") : "";
    $$("#cm-thumbs button").forEach(function (b, i) { b.addEventListener("click", function () { pick(i); }); });
    pick(0);
    $("#cm-cta").onclick = function () { modal.close(); go(c.cat === "dom" ? "dom#dom-kviz" : currentPage === "home" ? "home#home-kviz" : "@kviz"); };
    if (modal.showModal) modal.showModal(); else modal.setAttribute("open", "");
  }
  modal.addEventListener("click", function (e) { if (e.target === modal || e.target.closest("[data-close]")) modal.close(); });
  document.addEventListener("click", function (e) {
    var c = e.target.closest("[data-case]"); if (c) openCase(c.dataset.case);
    var m = e.target.closest("[data-more]");
    if (m) { var g = m.closest(".wrap").querySelector(".cases"); g.dataset.expanded = "1"; renderCases(g); }
  });

  /* tabs */
  $$(".tabs").forEach(function (tabs) {
    tabs.addEventListener("click", function (e) {
      var b = e.target.closest("[data-tab]"); if (!b) return;
      $$("[data-tab]", tabs).forEach(function (x) { x.setAttribute("aria-selected", String(x === b)); });
      renderPrices(tabs.closest(".wrap").querySelector(".prices"), b.dataset.tab);
    });
  });

  /* ---------- forms ---------- */
  function phoneOk(v) { return v.replace(/\D/g, "").length >= 10; }
  function emailOk(v) { return /.+@.+\..+/.test(v); }
  function contactOk(v) { return phoneOk(v) || emailOk(v); }
  $$(".lead-form").forEach(function (f) {
    var msg = $(".form-msg", f);
    f.addEventListener("input", function (e) { e.target.classList.remove("err"); msg.textContent = ""; msg.className = "form-msg"; });
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var ph = f.elements.phone, cons = f.elements.consent;
      if (!(ph.type === "tel" ? phoneOk(ph.value) : contactOk(ph.value))) { ph.classList.add("err"); msg.className = "form-msg bad"; msg.textContent = "Укажите телефон: не меньше 10 цифр."; ph.focus(); return; }
      if (!cons.checked) { msg.className = "form-msg bad"; msg.textContent = "Отметьте согласие на обработку данных, без него не сможем связаться."; return; }
      var data = { source: f.dataset.src };
      $$("input,select", f).forEach(function (i) { if (i.name && i.name !== "consent" && i.value) data[i.name] = i.value; });
      saveLead(data).then(function (ok) {
        msg.className = "form-msg ok";
        msg.textContent = ok ? "Готово. Менеджер напишет вам в рабочее время." : DEMO_NOTE;
        if (ok) f.reset();
      });
    });
  });

  /* ---------- quizzes ---------- */
  function Quiz(el, key) { this.el = el; this.root = key; this.reset(key); }
  Quiz.prototype.reset = function (key) { this.key = key; this.step = 0; this.ans = {}; this.other = ""; this.cfg = key === "main" ? null : S.quizzes[key]; this.render(); };
  Quiz.prototype.render = function () {
    var q = this, el = this.el;
    if (!q.cfg) {
      el.innerHTML = '<div class="q-top"><span>Шаг 1</span><span>Около минуты</span></div><div class="q-bar"><i style="width:8%"></i></div><p class="q-title">Для чего подбираем решение?</p><div class="q-opts">' +
        [["dom", "Для дома или квартиры", "n-veranda-greybrick"], ["biz", "Для бизнеса", "n-omoda"], ["partner", "Я дизайнер, архитектор или застройщик", "r-hammam"]].map(function (o) {
          return '<button class="q-opt single" type="button" data-pick="' + o[0] + '" aria-pressed="false"><img src="' + img(o[2]) + '" alt="" loading="lazy"><span>' + o[1] + "</span></button>";
        }).join("") + "</div>";
      $$("[data-pick]", el).forEach(function (b) { b.addEventListener("click", function () { q.cfg = S.quizzes[b.dataset.pick]; q.key = b.dataset.pick; q.step = 0; q.render(); }); });
      return;
    }
    var n = q.cfg.steps.length + 1, cur = q.step;
    var head = '<div class="q-top"><span>Шаг ' + (cur + 1) + " из " + n + "</span><span>" + esc(q.cfg.gift) + '</span></div><div class="q-bar"><i style="width:' + Math.round(((cur + 1) / n) * 100) + '%"></i></div>';
    if (cur < q.cfg.steps.length) {
      var s = q.cfg.steps[cur], sel = q.ans[s.key] || [];
      el.innerHTML = head + '<p class="q-title">' + esc(s.q) + "</p>" + (s.hint ? '<p class="q-hint">' + esc(s.hint) + "</p>" : "") + '<div class="q-opts">' +
        s.opts.map(function (o, i) {
          return '<button class="q-opt' + (s.multi ? "" : " single") + (o.img ? "" : " txt") + '" type="button" data-i="' + i + '" aria-pressed="' + (sel.indexOf(o.t) > -1) + '">' + (o.img ? '<img src="' + img(o.img) + '" alt="" loading="lazy">' : "") + "<span>" + esc(o.t) + "</span></button>";
        }).join("") + "</div>" +
        '<div class="q-other fld" ' + (sel.indexOf("Свой вариант") > -1 ? "" : "hidden") + '><label for="q-other-' + q.root + '">Опишите, что нужно</label><input id="q-other-' + q.root + '" type="text" value="' + esc(q.other) + '"></div>' +
        '<p class="q-err" role="alert"></p><div class="q-nav">' + (cur > 0 || q.root === "main" ? '<button class="btn btn-line" type="button" data-back>Назад</button>' : "<span></span>") + '<button class="btn" type="button" data-next>Дальше</button></div>';
      var err = $(".q-err", el), otherBox = $(".q-other", el), oi = $("input", otherBox);
      $$("[data-i]", el).forEach(function (b) {
        b.addEventListener("click", function () {
          var o = s.opts[+b.dataset.i], list = q.ans[s.key] || [];
          if (s.multi) { var k = list.indexOf(o.t); if (k > -1) list.splice(k, 1); else list.push(o.t); } else list = [o.t];
          q.ans[s.key] = list; err.textContent = "";
          $$("[data-i]", el).forEach(function (x) { x.setAttribute("aria-pressed", String(list.indexOf(s.opts[+x.dataset.i].t) > -1)); });
          otherBox.hidden = list.indexOf("Свой вариант") < 0;
          if (!s.multi) setTimeout(function () { q.step++; q.render(); }, 180);
        });
      });
      oi.addEventListener("input", function () { q.other = oi.value; err.textContent = ""; });
      $("[data-next]", el).addEventListener("click", function () {
        var list = q.ans[s.key] || [];
        if (!list.length) { err.textContent = "Выберите вариант, чтобы продолжить."; return; }
        if (list.indexOf("Свой вариант") > -1 && !q.other.trim()) { err.textContent = "Опишите свой вариант в поле ниже."; oi.focus(); return; }
        q.step++; q.render();
      });
      var back = $("[data-back]", el);
      if (back) back.addEventListener("click", function () { if (cur === 0) { q.cfg = null; q.render(); } else { q.step--; q.render(); } });
      return;
    }
    var c = q.cfg;
    el.innerHTML = head + '<p class="q-title">Куда отправить материалы?</p><div class="q-gift"><img src="' + img(c.giftImg) + '" alt=""><p>Пришлём: ' + esc(c.what) + ". Менеджер свяжется и ответит на вопросы, без навязчивых звонков.</p></div>" +
      '<form class="q-form" novalidate>' + c.fields.map(function (f) {
        var id = "qf-" + q.root + "-" + f[0];
        return '<div class="fld' + (f[4] ? " fld-wide" : "") + '"><label for="' + id + '">' + esc(f[1]) + (f[3] ? "" : " (необязательно)") + '</label><input id="' + id + '" name="' + f[0] + '" type="' + f[2] + '"' + (f[2] === "tel" ? ' inputmode="tel" autocomplete="tel"' : "") + "></div>";
      }).join("") +
      '<label class="consent"><input type="checkbox" name="consent"> Согласен на обработку данных по <a href="#politika">политике</a></label><p class="q-err" role="alert"></p>' +
      '<div class="q-nav"><button class="btn btn-line" type="button" data-back>Назад</button><button class="btn btn-accent" type="submit">Получить ' + esc(c.gift.toLowerCase()) + "</button></div></form>";
    var form = $("form", el), err2 = $(".q-err", el);
    $("[data-back]", el).addEventListener("click", function () { q.step--; q.render(); });
    form.addEventListener("input", function (e) { e.target.classList && e.target.classList.remove("err"); err2.textContent = ""; });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ph = form.elements.phone;
      if (!(ph.type === "tel" ? phoneOk(ph.value) : contactOk(ph.value))) { ph.classList.add("err"); err2.textContent = ph.type === "tel" ? "Укажите телефон: не меньше 10 цифр." : "Укажите телефон или e-mail."; ph.focus(); return; }
      if (form.elements.email && form.elements.email.value && !emailOk(form.elements.email.value)) { form.elements.email.classList.add("err"); err2.textContent = "Проверьте e-mail: в нём должна быть @ и домен."; return; }
      if (!form.elements.consent.checked) { err2.textContent = "Отметьте согласие на обработку данных."; return; }
      var data = { source: "Квиз: " + c.gift, answers: {} };
      Object.keys(q.ans).forEach(function (k) { data.answers[k] = q.ans[k].join(", "); });
      if (q.other) data.answers["Свой вариант"] = q.other;
      $$("input", form).forEach(function (i) { if (i.name && i.name !== "consent" && i.value) data[i.name] = i.value; });
      saveLead(data).then(function (ok) {
        var ch = (q.ans["Канал"] || [])[0];
        el.innerHTML = '<div class="q-done"><p class="q-title">Спасибо' + (data.name ? ", " + esc(data.name) : "") + "</p><p>" +
          (ok ? "Заявка у нас. Пришлём " + esc(c.what) + (ch ? " в " + esc(ch) : "") + " в рабочее время." : esc(DEMO_NOTE)) +
          '</p><div class="q-nav"><button class="btn btn-line" type="button" data-again>Пройти ещё раз</button></div></div>';
        $("[data-again]", el).addEventListener("click", function () { q.reset(q.root); });
      });
    });
  };

  /* ---------- reveal on scroll (content stays visible without JS) ---------- */
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.classList.add("rv-on");
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); } });
    }, { rootMargin: "0px" });
    $$(".rv").forEach(function (el) { rio.observe(el); });
  }

  /* ---------- init ---------- */
  $$('[data-render="dirs"]').forEach(renderDirs);
  $$('[data-render="route-links"]').forEach(renderRouteLinks);
  $$('[data-render="prices"]').forEach(function (el) { renderPrices(el); });
  $$('[data-render="examples"]').forEach(renderExamples);
  $$('[data-render="faq"]').forEach(renderFaq);
  $$("[data-filters]").forEach(renderFilters);
  $$('[data-render="cases"]').forEach(renderCases);
  $$("[data-quiz]").forEach(function (el) { new Quiz(el, el.dataset.quiz); });
  show((location.hash || "#home").slice(1) || "home");

  var mbar = $(".mbar");
  if (mbar && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { mbar.classList.toggle("on", !es.some(function (e) { return e.isIntersecting; })); });
    $$(".hero, .hero3d").forEach(function (h) { io.observe(h); });
  }
})();
