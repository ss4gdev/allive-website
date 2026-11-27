(() => {
  "use strict";

  const cases = window.ALLIVE_CASES;
  const casesById = new Map(cases.map((study) => [study.id, study]));
  const casesByPath = new Map(cases.map((study) => ["cases/" + encodeURIComponent(study.id), study]));
  const sections = new Map(
    Array.from(document.querySelectorAll("[data-route]"), (section) => [section.dataset.route, section])
  );
  const caseDetail = document.querySelector("[data-case-detail]");
  const main = document.getElementById("main");
  const toggle = document.getElementById("navToggle");
  const mobileNav = document.getElementById("mobileNav");
  const scrim = document.getElementById("mobileScrim");
  const closeButton = document.getElementById("mobileNavClose");
  const mobileViewport = window.matchMedia("(max-width: 900px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const toTop = document.getElementById("toTop");
  const form = document.getElementById("contactForm");
  const contactType = document.getElementById("f-type");
  const contactCase = document.getElementById("contact-case");
  const result = document.getElementById("formSuccess");
  const sectionLinks = document.querySelectorAll(".nav-desktop a, .mobile-nav a");

  const htmlEntities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const escapeHtml = (text) => String(text ?? "").replace(/[&<>"']/g, (character) => htmlEntities[character]);
  const casePath = (study) => "#/cases/" + encodeURIComponent(study.id);
  const consultationPath = (study) => "#/contact?type=3dar&case=" + encodeURIComponent(study.id);
  const arrow = '<span aria-hidden="true">→</span>';

  function caseMeta(study) {
    return `<div class="case-meta">
      <span>${escapeHtml(study.category)}</span>
      ${study.status ? `<span class="case-status">${escapeHtml(study.status)}</span>` : ""}
    </div>`;
  }

  function caseCard(study, heading, featured = false) {
    const layoutClass = study.image ? (featured ? " case-card-featured" : "") : " case-card-text-only";
    return `<a class="case-card${layoutClass}" href="${casePath(study)}">
      ${study.image ? `<div class="case-card-media">
        <img src="${escapeHtml(study.image)}" alt="" loading="lazy">
      </div>` : ""}
      <div class="case-card-copy">
        ${caseMeta(study)}
        <${heading}>${escapeHtml(study.title)}</${heading}>
        <p>${escapeHtml(study.summary)}</p>
        <span class="link-arrow">事例を見る ${arrow}</span>
      </div>
    </a>`;
  }

  function showCase(study) {
    const content = [
      ["制作の背景", study.background],
      ["ALLIVEの担当範囲", study.work],
      ["制作したAR体験", study.scene],
      ["成果・反応", study.result]
    ].filter(([, text]) => text);

    const visual = study.video
      ? `<video class="case-detail-media" src="${escapeHtml(study.video)}" poster="${escapeHtml(study.image)}" controls playsinline preload="metadata"></video>`
      : study.image
        ? `<img class="case-detail-media" src="${escapeHtml(study.image)}" alt="${escapeHtml(study.imageAlt)}">`
        : "";
    const demoLink = study.demoUrl
      ? `<a class="btn btn-primary" href="${escapeHtml(study.demoUrl)}" target="_blank" rel="noopener">スマホでARを試す ↗</a>`
      : "";

    caseDetail.innerHTML = `
      <div class="case-intro">
        <div class="wrap">
          <p class="breadcrumb"><a href="#/">ホーム</a><span aria-hidden="true">/</span><a href="#/business">事業紹介</a><span aria-hidden="true">/</span><a href="#/cases">3D・AR事例</a><span aria-hidden="true">/</span><span class="cur">事例詳細</span></p>
          <div class="page-head">
            ${caseMeta(study)}
            <h1>${escapeHtml(study.title)}</h1>
            <p class="lede">${escapeHtml(study.summary)}</p>
          </div>
        </div>
      </div>
      <div class="section-tight">
        <div class="wrap ${visual ? "case-detail-layout" : "case-detail-text-only"}">
          ${visual ? `<div>
            <figure class="case-detail-figure">
              ${visual}
              ${study.imageCaption ? `<figcaption>${escapeHtml(study.imageCaption)}</figcaption>` : ""}
            </figure>
            ${demoLink ? '<div class="action-row case-detail-actions">' + demoLink + '</div>' : ""}
          </div>` : ""}
          <div class="case-detail-copy">
            ${content.map(([title, text]) => `<section><h2>${title}</h2><p>${escapeHtml(text)}</p></section>`).join("")}
            ${demoLink && !visual ? '<div class="action-row case-detail-actions">' + demoLink + '</div>' : ""}
          </div>
        </div>
      </div>
      <div class="section-tight band-subtle">
        <div class="wrap contact-band">
          <div><h2>食品や料理の3D・AR制作を相談する</h2><p class="lede">3Dで見せたい商品や料理、利用したい場面をお聞かせください。</p></div>
          <div class="action-row">
            <a class="btn btn-primary" href="${consultationPath(study)}">この事例について相談する ${arrow}</a>
            <a class="btn btn-outline" href="#/cases">事例一覧に戻る</a>
          </div>
        </div>
      </div>`;
  }

  const noCases = '<p class="lede">事例は掲載準備中です。</p>';
  document.querySelector("[data-service-cases]").innerHTML = cases.slice(0, 2).map((study) => caseCard(study, "h3", cases.length === 1)).join("") || noCases;
  document.querySelector("[data-case-list]").innerHTML = cases.map((study) => caseCard(study, "h2", cases.length === 1)).join("") || noCases;

  function setMobileNav(open, restoreFocus = false) {
    mobileNav.inert = !open;
    mobileNav.classList.toggle("is-open", open);
    scrim.classList.toggle("is-open", open);
    main.inert = open;
    document.querySelector(".site-footer").inert = open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    document.body.style.overflowY = open ? "hidden" : "";
    if (open) closeButton.focus();
    if (restoreFocus) toggle.focus();
  }

  function render(focusHeading) {
    // Keep the hash router for links that open directly from index.html.
    const [requestedPath, query = ""] = location.hash.slice(1).split("?");
    const params = new URLSearchParams(query);
    let path = requestedPath.replace(/^\//, "").replace(/\/$/, "");
    if (path === "business/service-a") path = "business/lifeline";
    if (path === "business/service-b") path = "business/3dar";
    const study = casesByPath.get(path);
    const route = study ? "case-detail" : path;
    const section = sections.get(route === "case-detail" && !study ? "" : route)
      ?? sections.get(path.startsWith("cases/") ? "cases" : "");
    const visibleRoute = section.dataset.route;

    const previousVideo = caseDetail.querySelector("video");
    if (previousVideo) previousVideo.pause();
    if (study) showCase(study);

    sections.forEach((item) => item.classList.toggle("is-active", item === section));
    const isBusinessCase = visibleRoute === "cases" || visibleRoute === "case-detail";
    sectionLinks.forEach((link) => {
      const target = link.getAttribute("href").slice(2);
      const isCurrent = visibleRoute === target;
      const isParent = (isBusinessCase && target === "business")
        || (Boolean(target) && visibleRoute.startsWith(target + "/"));
      link.classList.toggle("is-active", isCurrent || isParent);
      if (isCurrent) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    if (visibleRoute === "contact") {
      const requestedType = params.get("type");
      contactType.value = requestedType === "sales" ? "lifeline" : (requestedType ?? "");
      if (contactType.selectedIndex < 0) contactType.value = "";
      const sourceCase = casesById.get(params.get("case"));
      contactCase.hidden = !sourceCase;
      contactCase.textContent = sourceCase ? "ご相談の事例「" + sourceCase.title + "」" : "";
      result.classList.remove("is-visible");
      result.textContent = "";
    }

    const heading = section.querySelector("h1");
    document.title = visibleRoute ? heading.textContent.trim() + "｜ALLIVE" : "ALLIVE";
    const wasMenuOpen = !mobileNav.inert;
    setMobileNav(false);
    if (focusHeading || wasMenuOpen) {
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
    window.scrollTo(0, 0);
    toTop.hidden = true;
    toTop.classList.remove("is-visible");
  }

  window.addEventListener("hashchange", () => {
    if (location.hash !== "#main") render(true);
  });
  document.querySelector(".skip-link").addEventListener("click", (event) => {
    event.preventDefault();
    main.focus();
  });

  toggle.addEventListener("click", () => setMobileNav(mobileNav.inert));
  closeButton.addEventListener("click", () => setMobileNav(false, true));
  scrim.addEventListener("click", () => setMobileNav(false, true));
  mobileViewport.addEventListener("change", () => setMobileNav(false));
  mobileNav.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (link && link.hash === (location.hash || "#/")) render(true);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !mobileNav.inert) setMobileNav(false, true);
  });

  window.addEventListener("scroll", () => {
    const show = window.scrollY > 550;
    toTop.hidden = !show;
    toTop.classList.toggle("is-visible", show);
  }, { passive: true });
  toTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "instant" : "smooth" });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    result.classList.add("is-visible");
    result.textContent = "入力内容を確認しました。このプレビューからは送信されません。";
  });
  form.querySelector('[type="submit"]').disabled = false;

  render(false);

  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    const revealObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.remove("reveal-pending");
        entry.target.classList.add("is-revealed");
        revealObserver.unobserve(entry.target);
      }
    }, { rootMargin: "-72px 0px -48px 0px", threshold: 0.12 });

    document.querySelectorAll("[data-scroll-reveal]").forEach((element) => {
      element.classList.add("reveal-pending");
      revealObserver.observe(element);
    });
  }
})();
