const CONFIG = {
  dataUrl: "data/products.json",
  siteName: "Innovación de Sillas y Muebles",
  // WhatsApp (sin +). Principal: +51 927333023
  waPrimary: "51927333023",
  // Interpretación: +941607813 => Perú +51 941607813
  // Si NO es Perú, cambia este valor.
  waSecondary: "51941607813"
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

let DB = { categories: [], products: [] };
let state = { q: "", cat: "all" };

function waLink(phone, text) {
  const clean = String(phone).replace(/[^\d]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

function formatMoney(n) {
  const num = Number(n || 0);
  if (!num) return "Cotizar";
  return num.toLocaleString("es-PE", { style: "currency", currency: "PEN" });
}

function setWaButtons() {
  const baseText = `Hola, vengo desde ${CONFIG.siteName}. Quiero cotizar.`;
  const links = {
    primary: waLink(CONFIG.waPrimary, baseText),
    secondary: waLink(CONFIG.waSecondary, baseText)
  };

  const map = [
    ["#waTop", links.primary],
    ["#waHero", links.primary],
    ["#waCard1", links.primary],
    ["#waContact1", links.primary],
    ["#waFab", links.primary],
    ["#waCard2", links.secondary],
    ["#waContact2", links.secondary]
  ];

  map.forEach(([sel, href]) => {
    const el = $(sel);
    if (el) el.href = href;
  });
}

function buildCategoryUI() {
  const select = $("#catSelect");
  const chipRow = $("#chipRow");
  select.innerHTML = `<option value="all">Todas las categorías</option>`;
  chipRow.innerHTML = "";

  DB.categories.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    select.appendChild(opt);

    const chip = document.createElement("button");
    chip.className = "chip";
    chip.type = "button";
    chip.dataset.cat = c.id;
    chip.textContent = c.name;
    chip.addEventListener("click", () => {
      state.cat = c.id;
      select.value = c.id;
      render();
    });
    chipRow.appendChild(chip);
  });
}

function productCard(p) {
  const cat = DB.categories.find(x => x.id === p.categoryId);
  const img = p.image || "assets/img/placeholder.jpg";
  const price = formatMoney(p.price);

  return `
    <article class="card" data-id="${p.id}" tabindex="0" role="button" aria-label="Ver ${p.name}">
      <img class="card__img" src="${img}" alt="${p.name}">
      <div class="card__body">
        <h3 class="card__title">${p.name}</h3>
        <div class="card__meta">
          <span class="badge">${cat ? cat.name : "Sin categoría"}</span>
          <span class="price">${price}</span>
        </div>
        <p class="card__desc">${p.shortDesc || ""}</p>
      </div>
    </article>
  `;
}

function applyFilters() {
  const q = state.q.trim().toLowerCase();
  const cat = state.cat;

  return DB.products.filter(p => {
    const okCat = (cat === "all") ? true : p.categoryId === cat;
    const blob = `${p.name} ${p.shortDesc || ""}`.toLowerCase();
    const okQ = q ? blob.includes(q) : true;
    return okCat && okQ;
  });
}

function updateActiveChips() {
  $$(".chip").forEach(ch => ch.classList.toggle("is-active", ch.dataset.cat === state.cat));
}

function render() {
  const grid = $("#grid");
  const empty = $("#empty");

  updateActiveChips();

  const list = applyFilters();
  grid.innerHTML = list.map(productCard).join("");

  empty.classList.toggle("hidden", list.length > 0);

  // listeners cards
  $$(".card", grid).forEach(card => {
    const open = () => openModal(card.dataset.id);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });
}

function modalHtml(p) {
  const cat = DB.categories.find(x => x.id === p.categoryId);
  const price = formatMoney(p.price);
  const img = p.image || "assets/img/placeholder.jpg";
  const feats = (p.features || []).map(x => `<li>${x}</li>`).join("");
  const ficha = p.datasheet ? `<a class="btn btn--ghost" href="${p.datasheet}" target="_blank" rel="noopener">Ficha técnica</a>` : "";

  const msg = `Hola, quiero cotizar: ${p.name}.`;
  const wa1 = waLink(CONFIG.waPrimary, msg);
  const wa2 = waLink(CONFIG.waSecondary, msg);

  return `
    <div class="pdetail">
      <div>
        <img src="${img}" alt="${p.name}">
      </div>
      <div>
        <h3>${p.name}</h3>
        <div class="row">
          <span class="badge">${cat ? cat.name : "Sin categoría"}</span>
          <span class="badge">${price}</span>
        </div>
        <p class="muted">${p.shortDesc || ""}</p>

        ${(p.features && p.features.length)
          ? `<div class="divider"></div><ul>${feats}</ul>`
          : ""}

        <div class="actions">
          <a class="btn btn--wa" href="${wa1}" target="_blank" rel="noopener">Cotizar WhatsApp</a>
          <a class="btn btn--ghost" href="${wa2}" target="_blank" rel="noopener">WhatsApp alterno</a>
          ${ficha}
        </div>
      </div>
    </div>
  `;
}

function openModal(productId) {
  const p = DB.products.find(x => x.id === productId);
  if (!p) return;

  const modal = $("#modal");
  const content = $("#modalContent");
  content.innerHTML = modalHtml(p);

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = $("#modal");
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

async function loadData() {
  const res = await fetch(CONFIG.dataUrl, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar products.json");
  DB = await res.json();

  // fallback si viene vacío
  DB.categories = DB.categories || [];
  DB.products = DB.products || [];
}

function initEvents() {
  $("#q").addEventListener("input", (e) => { state.q = e.target.value; render(); });
  $("#catSelect").addEventListener("change", (e) => { state.cat = e.target.value; render(); });

  $("#year").textContent = new Date().getFullYear();

  // cerrar modal
  $("#modal").addEventListener("click", (e) => {
    if (e.target && e.target.dataset && e.target.dataset.close === "1") closeModal();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
}

(async function main(){
  setWaButtons();
  initEvents();
  await loadData();
  buildCategoryUI();
  render();
})();
