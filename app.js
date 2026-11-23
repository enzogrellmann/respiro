// Respiro — interações da página de vendas.

// 1. Marcador da respiração 4–6: 6 ciclos de 10 s (1 minuto).
(function () {
  const btn = document.querySelector(".btn-resp");
  const bola = document.querySelector(".bola");
  if (!btn || !bola) return;
  const fala = bola.querySelector(".fala");
  const conta = bola.querySelector(".conta");
  let timers = [];
  const parar = (msg) => {
    timers.forEach(clearTimeout); timers = [];
    bola.classList.remove("inspira", "solta");
    fala.textContent = msg; conta.textContent = "";
    btn.textContent = "Começar 1 minuto";
    btn.dataset.on = "";
  };
  const contar = (n, inicio) => {
    for (let i = 1; i <= n; i++) timers.push(setTimeout(() => (conta.textContent = i), inicio + (i - 1) * 1000));
  };
  btn.addEventListener("click", () => {
    if (btn.dataset.on) return parar("pronto?");
    btn.dataset.on = "1";
    btn.textContent = "Parar";
    const CICLOS = 6;
    for (let c = 0; c < CICLOS; c++) {
      const t = c * 10000;
      timers.push(setTimeout(() => { bola.classList.remove("solta"); bola.classList.add("inspira"); fala.textContent = "inspire"; }, t));
      contar(4, t);
      timers.push(setTimeout(() => { bola.classList.remove("inspira"); bola.classList.add("solta"); fala.textContent = "solte devagar"; }, t + 4000));
      contar(6, t + 4000);
    }
    timers.push(setTimeout(() => parar("como está agora?"), CICLOS * 10000));
  });
})();

// 2. Barra de compra no celular: aparece depois do topo e some na seção de oferta.
(function () {
  const barra = document.querySelector(".barra");
  const hero = document.querySelector(".hero");
  const oferta = document.querySelector("#comprar");
  if (!barra || !hero || !("IntersectionObserver" in window)) return;
  let heroVisivel = true, ofertaVisivel = false;
  const atualiza = () => {
    const on = !heroVisivel && !ofertaVisivel;
    barra.classList.toggle("on", on);
    barra.setAttribute("aria-hidden", on ? "false" : "true");
    barra.tabIndex = on ? 0 : -1;
  };
  new IntersectionObserver(([e]) => { heroVisivel = e.isIntersecting; atualiza(); }).observe(hero);
  if (oferta) new IntersectionObserver(([e]) => { ofertaVisivel = e.isIntersecting; atualiza(); }).observe(oferta);
})();
