// Respiro — medição com respeito à privacidade (LGPD).
// 1. Eventos vão para window.dataLayer (e para o Plausible, se configurado: sem cookies, agregado).
// 2. UTMs da visita são repassados ao checkout da Hotmart (utm_* + sck), para saber qual divulgação vendeu.
// 3. O pixel do Meta só carrega depois de o visitante aceitar.
(function () {
  const CFG = window.RESPIRO_CONFIG || {};
  window.dataLayer = window.dataLayer || [];
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (_) {} },
    lget(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    lset(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
  };

  // ---------- eventos ----------
  function evento(nome, props) {
    window.dataLayer.push(Object.assign({ event: nome }, props || {}));
    if (window.plausible) window.plausible(nome, { props: props || {} });
    if (window.fbq && nome === "clique_comprar") window.fbq("trackCustom", "CliqueComprar", props || {});
  }
  window.respiroEvento = evento;

  if (CFG.plausibleDomain) {
    window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
    const s = document.createElement("script");
    s.defer = true; s.dataset.domain = CFG.plausibleDomain;
    s.src = "https://plausible.io/js/script.js";
    document.head.appendChild(s);
  }

  // ---------- UTMs -> checkout ----------
  const CHAVES = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const url = new URL(location.href);
  CHAVES.forEach((k) => { const v = url.searchParams.get(k); if (v) store.set(k, v); });
  const utm = {};
  CHAVES.forEach((k) => { const v = store.get(k); if (v) utm[k] = v; });
  // sck: rastreamento de origem da Hotmart (aparece no relatório de vendas)
  const sck = [utm.utm_source, utm.utm_medium, utm.utm_campaign].filter(Boolean).join("_").slice(0, 100);
  document.querySelectorAll('a[href*="pay.hotmart.com"]').forEach((a) => {
    const u = new URL(a.href);
    Object.entries(utm).forEach(([k, v]) => u.searchParams.set(k, v));
    if (sck) u.searchParams.set("sck", sck);
    a.href = u.toString();
  });

  // ---------- cliques e interações ----------
  document.addEventListener("click", (ev) => {
    const cta = ev.target.closest("[data-cta]");
    if (cta) evento("clique_comprar", { posicao: cta.dataset.cta });
  });
  document.querySelectorAll("details.sint").forEach((d) => {
    d.addEventListener("toggle", () => {
      if (d.open) evento("indice_abrir", { pagina: d.querySelector(".num").textContent });
    });
  });
  document.querySelectorAll(".faq details, details.refs").forEach((d) => {
    d.addEventListener("toggle", () => {
      if (d.open) evento(d.classList.contains("refs") ? "fontes_abrir" : "faq_abrir", { pergunta: d.querySelector("summary").textContent });
    });
  });
  const resp = document.querySelector(".btn-resp");
  if (resp) resp.addEventListener("click", () => { if (!resp.dataset.on) evento("respiracao_inicio"); });

  // profundidade de rolagem (seções vistas)
  if ("IntersectionObserver" in window) {
    const vistos = new Set();
    const io = new IntersectionObserver((ents) => ents.forEach((e) => {
      const id = e.target.dataset.secao;
      if (e.isIntersecting && !vistos.has(id)) { vistos.add(id); evento("secao_vista", { secao: id }); }
    }), { threshold: 0.4 });
    document.querySelectorAll("main > section").forEach((s, i) => {
      s.dataset.secao = s.id || s.className.replace("bloco", "").trim() || String(i);
      io.observe(s);
    });
  }

  // ---------- pixel do Meta, só com consentimento ----------
  function carregaPixel(id) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq("init", id);
    window.fbq("track", "PageView");
    window.fbq("track", "ViewContent", { content_name: "Respiro", value: 19.9, currency: "BRL" });
  }
  if (CFG.metaPixelId) {
    const escolha = store.lget("respiro_consent");
    if (escolha === "sim") carregaPixel(CFG.metaPixelId);
    else if (escolha !== "nao") {
      const aviso = document.querySelector(".consent");
      if (aviso) {
        aviso.hidden = false;
        aviso.addEventListener("click", (ev) => {
          const b = ev.target.closest("[data-consent]");
          if (!b) return;
          store.lset("respiro_consent", b.dataset.consent);
          aviso.hidden = true;
          if (b.dataset.consent === "sim") carregaPixel(CFG.metaPixelId);
        });
      }
    }
  }
})();
