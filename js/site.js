/* Алюфорс: роутер, рендер блоков, ориентир цены, формы, модалка */
(function () {
  "use strict";
  const S = window.SITE || { cases: [] }, C = window.C;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const img = (n) => "img/" + n + ".webp";
  const caseById = (id) => S.cases.find((c) => c.id === id);
  const fmt = (n) => Math.round(n).toLocaleString("ru-RU").replace(/,/g, " ");
  document.documentElement.classList.add("js");

  /* ---------- reveal ---------- */
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { rootMargin: "0px 0px -6% 0px" }) : null;
  function observe(root) { $$(".rv:not(.in)", root || document).forEach((el) => (io ? io.observe(el) : el.classList.add("in"))); }
  function revealVisible() {
    $$(".rv:not(.in)", activePage()).forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add("in"); });
  }

  /* ---------- router ---------- */
  const pages = $$(".page");
  const hdr = $("#hdr");
  let current = "";
  function show(name, opts) {
    if (!pages.some((p) => p.dataset.page === name)) name = "home";
    if (name === current && !(opts && opts.force)) return;
    current = name;
    pages.forEach((p) => (p.hidden = p.dataset.page !== name));
    const page = activePage();
    document.title = page.dataset.title || document.title;
    const dark = page.classList.contains("page-dark");
    document.body.classList.toggle("is-dark", dark);
    $(".logo img").src = dark ? "img/logo-light.png" : "img/logo-dark.png";
    $$("[data-go]", $("#nav")).forEach((a) => a.classList.toggle("on", a.dataset.go === name));
    closeMenu();
    if (!(opts && opts.keepScroll)) window.scrollTo(0, 0);
    requestAnimationFrame(revealVisible);
  }
  const activePage = () => pages.find((p) => !p.hidden) || pages[0];
  function go(name) {
    try { history.pushState(null, "", "#" + name); } catch (e) { location.hash = name; }
    show(name);
  }
  window.addEventListener("popstate", () => show((location.hash || "#home").slice(1)));
  window.addEventListener("hashchange", () => show((location.hash || "#home").slice(1)));

  function scrollToEl(el) {
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - (hdr.offsetHeight + 8);
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  }
  function scrollTarget(key) {
    if (key === "form") return $("[data-form]", activePage());
    if (key === "kontakty") return $("#kontakty");
    return document.getElementById(key);
  }

  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-go]");
    if (g) { e.preventDefault(); go(g.dataset.go); return; }
    const s = e.target.closest("[data-scroll]");
    if (s) {
      e.preventDefault();
      if (s.hasAttribute("data-close")) closeModal();
      closeMenu();
      scrollToEl(scrollTarget(s.dataset.scroll));
    }
  });

  /* ---------- menu ---------- */
  const burger = $("#burger"), nav = $("#nav");
  function closeMenu() { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); document.body.classList.remove("menu-open"); }
  burger.addEventListener("click", () => {
    const o = !nav.classList.contains("open");
    nav.classList.toggle("open", o); burger.setAttribute("aria-expanded", String(o)); document.body.classList.toggle("menu-open", o);
  });
  addEventListener("scroll", () => hdr.classList.toggle("scrolled", scrollY > 8), { passive: true });

  /* ---------- directions ---------- */
  $$("[data-dirs]").forEach((box) => {
    const list = box.dataset.dirs === "biz" ? C.bizDirs : C.domDirs;
    box.innerHTML = list.map((d) => `
      <article class="dir rv">
        <div class="dir-img"><img src="${img(d.img)}" alt="${d.t}" loading="lazy"></div>
        <div class="dir-body">
          <h3>${d.t}</h3>
          <p>${d.d}</p>
          <p class="dir-price">${d.p ? `от <b>${d.p} ₽</b> за м²` : `<b>Цена по проекту</b>`}</p>
        </div>
      </article>`).join("");
  });

  /* ---------- works ---------- */
  function card(c, big) {
    return `<button class="work rv${big ? " big" : ""}" data-case="${c.id}" type="button">
      <span class="work-img"><img src="${img(c.imgs[0])}" alt="${c.t}" loading="lazy"></span>
      <span class="work-cap"><b>${c.t}</b><span>${c.type}</span></span></button>`;
  }
  function domTagOf(id) { for (const k in C.domTags) if (C.domTags[k].includes(id)) return k; return ""; }
  function renderWorks(box, filter) {
    const scope = box.dataset.works;
    let list;
    if (scope === "home") list = C.homeWorks.map(caseById).filter(Boolean);
    else if (scope === "biz") list = C.bizWorks.map(caseById).filter(Boolean);
    else if (scope === "dom") list = S.cases.filter((c) => c.cat === "dom" && (!filter || filter === "all" || domTagOf(c.id) === filter));
    else list = S.cases.filter((c) => !filter || filter === "all" || c.cat === filter);
    const step = scope === "all" ? 12 : 9;
    let shown = scope === "home" || scope === "biz" ? list.length : Math.min(step, list.length);
    const draw = () => {
      box.innerHTML = list.slice(0, shown).map((c, i) => card(c, scope === "home" && i === 0)).join("") +
        (shown < list.length ? `<div class="more-wrap"><button class="btn btn-line" type="button" data-more>Показать ещё</button></div>` : "");
      const m = $("[data-more]", box);
      if (m) m.addEventListener("click", () => { shown = Math.min(shown + step, list.length); draw(); revealVisible(); });
      observe(box);
    };
    draw();
  }
  $$("[data-works]").forEach((b) => renderWorks(b));

  $$("[data-filter]").forEach((box) => {
    const scope = box.dataset.filter;
    const names = scope === "dom" ? C.domTagNames : Object.assign({ all: "Все" }, S.catNames);
    const target = $(`[data-works="${scope}"]`, box.parentElement);
    box.innerHTML = Object.keys(names).map((k, i) => `<button type="button" class="chip${i ? "" : " on"}" data-f="${k}">${names[k]}</button>`).join("");
    box.addEventListener("click", (e) => {
      const b = e.target.closest("[data-f]"); if (!b) return;
      $$(".chip", box).forEach((x) => x.classList.toggle("on", x === b));
      renderWorks(target, b.dataset.f); revealVisible();
    });
  });

  /* ---------- modal ---------- */
  const modal = $("#modal");
  let lastFocus = null;
  function openCase(id) {
    const c = caseById(id); if (!c) return;
    lastFocus = document.activeElement;
    $("#m-t").textContent = c.t;
    $("#m-type").textContent = c.type;
    $("#m-did").innerHTML = (c.did || []).map((d) => `<li>${d}</li>`).join("");
    const setImg = (n) => { $("#m-img").src = img(n); $("#m-img").alt = c.t; $$("#m-thumbs button").forEach((b) => b.classList.toggle("on", b.dataset.i === n)); };
    $("#m-thumbs").innerHTML = c.imgs.length > 1 ? c.imgs.map((n) => `<button type="button" data-i="${n}"><img src="${img(n)}" alt=""></button>`).join("") : "";
    $$("#m-thumbs button").forEach((b) => b.addEventListener("click", () => setImg(b.dataset.i)));
    setImg(c.imgs[0]);
    modal.hidden = false; document.body.classList.add("modal-open");
    $(".modal-x", modal).focus();
  }
  function closeModal() { if (modal.hidden) return; modal.hidden = true; document.body.classList.remove("modal-open"); if (lastFocus) lastFocus.focus(); }
  document.addEventListener("click", (e) => {
    const w = e.target.closest("[data-case]"); if (w) { openCase(w.dataset.case); return; }
    if (e.target.closest("[data-close]") && !e.target.closest("[data-scroll]")) closeModal();
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape") { closeModal(); closeMenu(); } });

  /* ---------- price explainer ---------- */
  $$("[data-price]").forEach((sec) => {
    const P = C.price;
    const F = Object.fromEntries(P.factors.map((f) => [f.id, f]));
    const uses = { veranda: ["temp", "pane", "glass", "open"], part: ["glass", "open"], door: ["temp", "pane", "glass"] };
    const st = { obj: "veranda", temp: "cold", pane: "2", glass: "std", open: "fix" };
    sec.innerHTML = `<div class="wrap">
      <div class="sec-head rv"><h2>Почему одна веранда стоит 150 тысяч, а другая — 400</h2>
      <p class="sub">Цена складывается из четырёх решений. Пощёлкайте и посмотрите, как меняется порядок суммы.</p></div>
      <div class="pe">
        <div class="pe-left rv">
          <div class="seg seg-obj" role="group" aria-label="Что считаем">${P.objects.map((o) => `<button type="button" data-obj="${o.id}">${o.t}</button>`).join("")}</div>
          <div class="pe-factors"></div>
        </div>
        <aside class="pe-res rv" aria-live="polite">
          <p class="pe-for"></p>
          <p class="pe-sum"></p>
          <div class="pe-bar"><i></i></div>
          <p class="pe-note">Это ориентир, а не цена. Точную назовёт инженер после замера: он учтёт проём, нагрузку, фурнитуру и монтаж.</p>
          <a class="btn btn-accent" href="#form" data-scroll="form">Узнать цену моего проекта</a>
          <p class="pe-small">Замер и расчёт бесплатно</p>
        </aside>
      </div></div>`;
    const box = $(".pe-factors", sec);
    function draw() {
      const o = P.objects.find((x) => x.id === st.obj);
      $$("[data-obj]", sec).forEach((b) => b.classList.toggle("on", b.dataset.obj === st.obj));
      const ids = uses[st.obj].filter((id) => !(id === "pane" && st.temp !== "warm"));
      box.innerHTML = ids.map((id) => {
        const f = F[id];
        const opts = id === "pane" ? f.opts.filter((x) => x.v !== "1") : f.opts;
        return `<div class="pf"><p class="pf-t">${f.t}</p>
          <div class="seg">${opts.map((x) => `<button type="button" data-f="${id}" data-v="${x.v}" class="${st[id] === x.v ? "on" : ""}">${x.t}</button>`).join("")}</div>
          <p class="pf-h">${f.hint}</p></div>`;
      }).join("");
      const base = st.temp === "warm" && o.warm && uses[st.obj].includes("temp") ? o.warm : o.cold;
      let k = 1;
      ids.forEach((id) => { if (id === "temp") return; const x = F[id].opts.find((q) => q.v === st[id]); if (x && x.k) k *= x.k; });
      const lo = Math.round((base * k * o.area) / 1000) * 1000, hi = Math.round((lo * 1.25) / 1000) * 1000;
      $(".pe-for", sec).textContent = "Ориентир: " + o.t.toLowerCase() + ", " + o.unit;
      $(".pe-sum", sec).innerHTML = `${fmt(lo)} – ${fmt(hi)}&nbsp;₽`;
      const maxv = (o.warm || o.cold) * o.area * 1.12 * 1.2 * 1.35 * 1.25;
      $(".pe-bar i", sec).style.width = Math.min(100, (hi / maxv) * 100) + "%";
    }
    sec.addEventListener("click", (e) => {
      const ob = e.target.closest("[data-obj]");
      if (ob) { st.obj = ob.dataset.obj; draw(); return; }
      const b = e.target.closest("[data-f][data-v]");
      if (b) { st[b.dataset.f] = b.dataset.v; if (b.dataset.f === "temp" && st.temp === "warm" && st.pane === "1") st.pane = "2"; draw(); }
    });
    draw();
  });

  /* ---------- PVC vs aluminium ---------- */
  $$("[data-compare]").forEach((sec) => {
    const mark = '<span class="win">лучше</span>';
    sec.innerHTML = `<div class="wrap">
      <div class="sec-head rv"><h2>ПВХ или алюминий — честно</h2>
      <p class="sub">Мы делаем алюминий, но в чём-то ПВХ лучше, и мы скажем об этом прямо. Цифры взяты из паспортов профильных систем.</p></div>
      <div class="cmp rv">
        <div class="cmp-head"><span></span>
          <figure><img src="img/compare-pvc.webp" alt="ПВХ профиль в разрезе" loading="lazy"><figcaption>ПВХ</figcaption></figure>
          <figure><img src="img/compare-alu.webp" alt="Алюминиевый профиль в разрезе" loading="lazy"><figcaption>Алюминий</figcaption></figure>
        </div>
        ${C.compare.map((r) => `<div class="cmp-row">
          <p class="cmp-t">${r.t}</p>
          <div class="cmp-c${r.win === "pvc" ? " is-win" : ""}"><span class="cmp-l">ПВХ</span>${r.win === "pvc" ? mark : ""}<p>${r.pvc}</p></div>
          <div class="cmp-c${r.win === "alu" ? " is-win" : ""}"><span class="cmp-l">Алюминий</span>${r.win === "alu" ? mark : ""}<p>${r.alu}</p></div>
        </div>`).join("")}
      </div>
      <div class="verdict rv"><p><b>Итог.</b> Окно в тёплую комнату при скромном бюджете — берите ПВХ. Веранда, большие раздвижные двери, входная группа, перегородка или витраж — здесь алюминий.</p></div>
      <p class="src">Источники: ${C.compareSrc.map((s) => `<a href="${s.u}" target="_blank" rel="noopener">${s.t}</a>`).join(", ")}; коэффициенты теплового расширения — справочные (ПВХ ≈ 70–80·10⁻⁶, алюминий ≈ 23·10⁻⁶ на °С).</p>
    </div>`;
  });

  /* ---------- forms ---------- */
  const FORMS = {
    main: { h: "Рассчитать мой проект", sub: "Расскажите, что хотите сделать. Перезвоним, зададим пару вопросов и назовём порядок цены. Замер и расчёт бесплатно.", chips: C.quiz, chipT: "Что нужно", f: [["name", "Имя", "text", "name"], ["phone", "Телефон", "tel", "tel"], ["msg", "Размеры или пожелания — если знаете", "textarea"]], btn: "Рассчитать мой проект" },
    biz: { h: "Отправить проект на расчёт", sub: "Опишите объект или пришлите ссылку на чертежи. Посчитаем и пришлём коммерческое предложение.", chips: C.bizQuiz, chipT: "Что нужно", f: [["company", "Компания", "text", "organization"], ["name", "Имя", "text", "name"], ["phone", "Телефон", "tel", "tel"], ["msg", "Адрес объекта, сроки, ссылка на чертежи", "textarea"]], btn: "Отправить на расчёт" },
    partner: { h: "Получить условия", sub: "Пришлём условия и обсудим первый заказ.", chips: ["Оконная компания", "Дизайнер интерьеров"], chipT: "Кто вы", f: [["company", "Компания или студия", "text", "organization"], ["name", "Имя", "text", "name"], ["phone", "Телефон", "tel", "tel"]], btn: "Получить условия" }
  };
  $$("[data-form]").forEach((sec, n) => {
    const kind = sec.dataset.form === "dom" ? "main" : sec.dataset.form;
    const F = FORMS[kind];
    const uid = "f" + n;
    sec.innerHTML = `<div class="wrap form-wrap">
      <div class="form-head rv"><h2>${F.h}</h2><p class="sub">${F.sub}</p>
        <p class="form-alt">Или позвоните: <a href="tel:+79372760726">+7 (937) 276-07-26</a></p></div>
      <form class="lform rv" novalidate>
        <fieldset class="chipset"><legend>${F.chipT}</legend>
          ${F.chips.map((c, i) => `<label class="chip"><input type="radio" name="what" value="${c}"${i ? "" : " checked"}><span>${c}</span></label>`).join("")}
        </fieldset>
        <div class="fields">${F.f.map(([nm, ph, type, ac]) => type === "textarea"
          ? `<label class="fld fld-wide"><span>${ph}</span><textarea name="${nm}" rows="3"></textarea></label>`
          : `<label class="fld"><span>${ph}</span><input name="${nm}" type="${type}" ${ac ? `autocomplete="${ac}"` : ""} ${nm === "phone" ? 'inputmode="tel" required' : ""}></label>`).join("")}</div>
        <label class="consent"><input type="checkbox" name="ok" id="${uid}-ok" required> <span>Согласен на обработку персональных данных по <a href="#politika" data-go="politika">политике</a></span></label>
        <button class="btn btn-accent" type="submit">${F.btn}</button>
        <p class="form-msg" role="status"></p>
      </form></div>`;
  });
  document.addEventListener("submit", (e) => {
    const f = e.target.closest("form.lform"); if (!f) return;
    e.preventDefault();
    const msg = $(".form-msg", f);
    const ph = f.phone.value.replace(/\D/g, "");
    f.phone.closest(".fld").classList.toggle("bad", ph.length < 10);
    if (ph.length < 10) { msg.textContent = "Проверьте телефон — нужно 10–11 цифр."; msg.className = "form-msg err"; f.phone.focus(); return; }
    if (!f.ok.checked) { msg.textContent = "Отметьте согласие на обработку данных."; msg.className = "form-msg err"; return; }
    const data = Object.fromEntries(new FormData(f).entries());
    data.page = current; data.at = new Date().toISOString();
    try { const a = JSON.parse(localStorage.getItem("aluforce-leads") || "[]"); a.push(data); localStorage.setItem("aluforce-leads", JSON.stringify(a)); } catch (er) {}
    msg.innerHTML = `Спасибо! Сайт пока в тестовом режиме, и заявка не отправляется. Позвоните, пожалуйста: <a href="tel:+79372760726">+7 (937) 276-07-26</a>`;
    msg.className = "form-msg ok";
  });

  observe();

  /* ---------- mobile bar ---------- */
  const mbar = $("#mbar");
  addEventListener("scroll", () => {
    const form = $("[data-form]", activePage());
    const fr = form ? form.getBoundingClientRect() : null;
    const inForm = fr && fr.top < innerHeight && fr.bottom > 0;
    mbar.classList.toggle("on", scrollY > innerHeight * 0.6 && !inForm);
  }, { passive: true });

  show((location.hash || "#home").slice(1), { force: true, keepScroll: true });
})();
