const STORAGE_KEY = "ism_db_v3";
const DATA_URL = "../data/products.json";

const DEFAULT_DB = {
  categories: [
    { id: "sillas", name: "Sillas" },
    { id: "bancos", name: "Bancos" },
    { id: "mesas", name: "Mesas" },
    { id: "sillas-oficina", name: "Sillas de oficina" },
    { id: "butacas", name: "Butacas" }
  ],
  products: []
};

const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));

let DB = null;

function slugify(s){
  return String(s||"")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g,"")
    .replace(/\s+/g,"-")
    .replace(/-+/g,"-");
}

function loadFromLocal(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch{
    return null;
  }
}

function saveToLocal(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DB, null, 2));
}

async function fetchJson(){
  const res = await fetch(DATA_URL, { cache: "no-store" });
  if(!res.ok) throw new Error("No se pudo cargar " + DATA_URL);
  const data = await res.json();
  return {
    categories: Array.isArray(data.categories) ? data.categories : [],
    products: Array.isArray(data.products) ? data.products : []
  };
}

function refreshCatSelect(){
  const sel = $("#pCat");
  if(!sel) return;
  sel.innerHTML = (DB.categories || []).map(c => `<option value="${c.id}">${c.name}</option>`).join("");
}

function renderCats(){
  const box = $("#catList");
  if(!box) return;

  box.innerHTML = (DB.categories || []).map(c => `
    <div class="item">
      <div class="item__top">
        <div>
          <h3 class="item__title">${c.name}</h3>
          <div class="item__meta"><strong>ID:</strong> ${c.id}</div>
        </div>
        <div class="item__actions">
          <button class="btn" type="button" data-edit-cat="${c.id}">Editar</button>
          <button class="btn" type="button" data-del-cat="${c.id}">Eliminar</button>
        </div>
      </div>
    </div>
  `).join("");

  $$("[data-edit-cat]").forEach(b => b.onclick = () => editCat(b.dataset.editCat));
  $$("[data-del-cat]").forEach(b => b.onclick = () => delCat(b.dataset.delCat));
}

function renderProducts(){
  const box = $("#prodList");
  if(!box) return;

  if(!DB.products || DB.products.length === 0){
    box.innerHTML = `
      <div class="item">
        <div class="item__meta">
          No hay productos aún. Crea uno arriba o importa <code>data/products.json</code>.
        </div>
      </div>
    `;
    return;
  }

  box.innerHTML = DB.products.map(p => {
    const cat = DB.categories.find(x => x.id === p.categoryId);
    return `
      <div class="item">
        <div class="item__top">
          <div>
            <h3 class="item__title">${p.name}</h3>
            <div class="item__meta">
              <strong>ID:</strong> ${p.id}
              · <strong>Categoría:</strong> ${cat ? cat.name : p.categoryId}
              · <strong>Precio:</strong> ${Number(p.price||0) ? p.price : "Cotizar"}
            </div>
            <div class="item__meta">
              <strong>IMG:</strong> ${p.image || "-"} · <strong>PDF:</strong> ${p.datasheet || "-"}
            </div>
          </div>
          <div class="item__actions">
            <button class="btn" type="button" data-edit-prod="${p.id}">Editar</button>
            <button class="btn" type="button" data-del-prod="${p.id}">Eliminar</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  $$("[data-edit-prod]").forEach(b => b.onclick = () => editProd(b.dataset.editProd));
  $$("[data-del-prod]").forEach(b => b.onclick = () => delProd(b.dataset.delProd));
}

function editCat(id){
  const c = DB.categories.find(x => x.id === id);
  if(!c) return;
  const idEl = $("#catId");
  const nameEl = $("#catName");
  if(idEl) idEl.value = c.id;
  if(nameEl) nameEl.value = c.name;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function delCat(id){
  const used = DB.products.some(p => p.categoryId === id);
  if(used){
    alert("No se puede eliminar: hay productos usando esta categoría.");
    return;
  }
  DB.categories = DB.categories.filter(x => x.id !== id);
  saveToLocal();
  refreshCatSelect();
  renderCats();
}

function clearCatForm(){
  const idEl = $("#catId");
  const nameEl = $("#catName");
  if(idEl) idEl.value = "";
  if(nameEl) nameEl.value = "";
}

function editProd(id){
  const p = DB.products.find(x => x.id === id);
  if(!p) return;

  $("#pId").value = p.id;
  $("#pName").value = p.name;
  $("#pCat").value = p.categoryId;
  $("#pPrice").value = Number(p.price || 0);
  $("#pDesc").value = p.shortDesc || "";
  $("#pFeat").value = (p.features || []).join("\n");
  $("#pImgPath").value = p.image || "";
  $("#pPdfPath").value = p.datasheet || "";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function delProd(id){
  DB.products = DB.products.filter(x => x.id !== id);
  saveToLocal();
  renderProducts();
}

function clearProdForm(){
  ["pId","pName","pDesc","pFeat","pImg","pPdf","pImgPath","pPdfPath"].forEach(id=>{
    const el = $("#"+id);
    if(el) el.value = "";
  });
  const price = $("#pPrice");
  if(price) price.value = 0;
}

function handleFileHints(){
  const pImg = $("#pImg");
  const pPdf = $("#pPdf");
  if(pImg){
    pImg.addEventListener("change", (e) => {
      const f = e.target.files?.[0];
      if(!f) return;
      const ext = f.name.split(".").pop().toLowerCase();
      const base = slugify(f.name.replace(/\.[^.]+$/, ""));
      const p = $("#pImgPath");
      if(p) p.value = `assets/img/${base}.${ext}`;
    });
  }
  if(pPdf){
    pPdf.addEventListener("change", (e) => {
      const f = e.target.files?.[0];
      if(!f) return;
      const base = slugify(f.name.replace(/\.[^.]+$/, ""));
      const p = $("#pPdfPath");
      if(p) p.value = `assets/fichas/${base}.pdf`;
    });
  }
}

function exportJson(){
  const blob = new Blob([JSON.stringify(DB, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "products.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function importJson(force=true){
  try{
    const imported = await fetchJson();
    if(force){
      DB = imported;
      if(!DB.categories?.length) DB.categories = structuredClone(DEFAULT_DB.categories);
      if(!DB.products) DB.products = [];
      saveToLocal();
    }
    refreshCatSelect();
    renderCats();
    renderProducts();
    alert("Importación lista ✅");
  }catch(err){
    console.error(err);
    alert("No se pudo importar products.json: " + err.message);
  }
}

async function saveToServer(){
  try{
    const key = ($("#adminKey")?.value || "").trim();
    if(!key){
      alert("Ingresa la clave de admin.");
      return;
    }

    const res = await fetch("save.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ADMIN-KEY": key
      },
      body: JSON.stringify(DB)
    });

    const out = await res.json().catch(() => ({}));

    if(!res.ok || !out.ok){
      throw new Error(out.error || "Error guardando");
    }

    alert("Guardado en servidor ✅");
  }catch(err){
    console.error(err);
    alert("No se pudo guardar: " + err.message + "\nRevisa clave y permisos de /data/products.json");
  }
}

function bindForms(){
  const catForm = $("#catForm");
  const prodForm = $("#prodForm");

  if(catForm){
    catForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = slugify($("#catId").value);
      const name = $("#catName").value.trim();
      if(!id || !name) return;

      const existing = DB.categories.find(x => x.id === id);
      if(existing) existing.name = name;
      else DB.categories.push({ id, name });

      saveToLocal();
      refreshCatSelect();
      renderCats();
      clearCatForm();
    });
  }

  if(prodForm){
    prodForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const id = slugify($("#pId").value);
      const name = $("#pName").value.trim();
      const categoryId = $("#pCat").value;
      const price = Number($("#pPrice").value || 0);
      const shortDesc = $("#pDesc").value.trim();
      const features = $("#pFeat").value.split("\n").map(x => x.trim()).filter(Boolean);
      const image = $("#pImgPath").value.trim();
      const datasheet = $("#pPdfPath").value.trim();

      if(!id || !name || !categoryId){
        alert("Completa ID, Nombre y Categoría.");
        return;
      }

      const payload = { id, name, categoryId, price, shortDesc, features, image, datasheet };

      const existing = DB.products.find(x => x.id === id);
      if(existing) Object.assign(existing, payload);
      else DB.products.push(payload);

      saveToLocal();
      renderProducts();
      clearProdForm();
    });
  }

  const btnCatClear = $("#btnCatClear");
  if(btnCatClear) btnCatClear.onclick = clearCatForm;

  const btnProdClear = $("#btnProdClear");
  if(btnProdClear) btnProdClear.onclick = clearProdForm;

  const btnExport = $("#btnExport");
  if(btnExport) btnExport.onclick = exportJson;

  const btnImport = $("#btnImport");
  if(btnImport) btnImport.onclick = () => importJson(true);

  const btnSaveServer = $("#btnSaveServer");
  if(btnSaveServer) btnSaveServer.onclick = saveToServer;
}

async function init(){
  const local = loadFromLocal();
  if(local){
    DB = local;
  }else{
    try{
      DB = await fetchJson();
      if(!DB.categories?.length) DB.categories = structuredClone(DEFAULT_DB.categories);
      if(!DB.products) DB.products = [];
      saveToLocal();
    }catch{
      DB = structuredClone(DEFAULT_DB);
      saveToLocal();
    }
  }

  refreshCatSelect();
  renderCats();
  renderProducts();
  bindForms();
  handleFileHints();
}

init();
