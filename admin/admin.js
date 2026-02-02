const STORAGE_KEY = "ism_db_v1";

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

let DB = loadDB();

function loadDB(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : structuredClone(DEFAULT_DB);
  }catch{
    return structuredClone(DEFAULT_DB);
  }
}
function saveDB(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DB, null, 2));
}

function slugify(s){
  return String(s||"")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g,"")
    .replace(/\s+/g,"-")
    .replace(/-+/g,"-");
}

function refreshCatSelect(){
  const sel = $("#pCat");
  sel.innerHTML = DB.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
}

function renderCats(){
  const box = $("#catList");
  box.innerHTML = DB.categories.map(c => `
    <div class="item">
      <div class="item__top">
        <div>
          <h3 class="item__title">${c.name}</h3>
          <div class="item__meta"><strong>ID:</strong> ${c.id}</div>
        </div>
        <div class="item__actions">
          <button class="btn" data-edit-cat="${c.id}">Editar</button>
          <button class="btn" data-del-cat="${c.id}">Eliminar</button>
        </div>
      </div>
    </div>
  `).join("");

  $$("[data-edit-cat]").forEach(b => b.onclick = () => editCat(b.dataset.editCat));
  $$("[data-del-cat]").forEach(b => b.onclick = () => delCat(b.dataset.delCat));
}

function renderProducts(){
  const box = $("#prodList");
  box.innerHTML = DB.products.map(p => {
    const cat = DB.categories.find(x => x.id === p.categoryId);
    return `
      <div class="item">
        <div class="item__top">
          <div>
            <h3 class="item__title">${p.name}</h3>
            <div class="item__meta">
              <strong>ID:</strong> ${p.id} · <strong>Categoría:</strong> ${cat ? cat.name : p.categoryId}
              · <strong>Precio:</strong> ${Number(p.price||0) ? p.price : "Cotizar"}
            </div>
            <div class="item__meta">
              <strong>IMG:</strong> ${p.image || "-"} · <strong>PDF:</strong> ${p.datasheet || "-"}
            </div>
          </div>
          <div class="item__actions">
            <button class="btn" data-edit-prod="${p.id}">Editar</button>
            <button class="btn" data-del-prod="${p.id}">Eliminar</button>
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
  $("#catId").value = c.id;
  $("#catName").value = c.name;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function delCat(id){
  // evitar borrar si hay productos usando la categoría
  const used = DB.products.some(p => p.categoryId === id);
  if(used){
    alert("No se puede eliminar: hay productos usando esta categoría.");
    return;
  }
  DB.categories = DB.categories.filter(x => x.id !== id);
  saveDB();
  refreshCatSelect();
  renderCats();
}

function clearCatForm(){
  $("#catId").value = "";
  $("#catName").value = "";
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
  saveDB();
  renderProducts();
}

function clearProdForm(){
  $("#pId").value = "";
  $("#pName").value = "";
  $("#pPrice").value = 0;
  $("#pDesc").value = "";
  $("#pFeat").value = "";
  $("#pImg").value = "";
  $("#pPdf").value = "";
  $("#pImgPath").value = "";
  $("#pPdfPath").value = "";
}

function handleFileHints(){
  $("#pImg").addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if(!f) return;
    const name = slugify(f.name.replace(/\.[^.]+$/, "")) + "." + f.name.split(".").pop().toLowerCase();
    $("#pImgPath").value = `assets/img/${name}`;
  });

  $("#pPdf").addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if(!f) return;
    const name = slugify(f.name.replace(/\.[^.]+$/, "")) + ".pdf";
    $("#pPdfPath").value = `assets/fichas/${name}`;
  });
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

function bindForms(){
  $("#catForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = slugify($("#catId").value);
    const name = $("#catName").value.trim();
    if(!id || !name) return;

    const existing = DB.categories.find(x => x.id === id);
    if(existing){
      existing.name = name;
    }else{
      DB.categories.push({ id, name });
    }

    saveDB();
    refreshCatSelect();
    renderCats();
    clearCatForm();
  });

  $("#prodForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const id = slugify($("#pId").value);
    const name = $("#pName").value.trim();
    const categoryId = $("#pCat").value;
    const price = Number($("#pPrice").value || 0);
    const shortDesc = $("#pDesc").value.trim();
    const features = $("#pFeat").value
      .split("\n")
      .map(x => x.trim())
      .filter(Boolean);

    const image = $("#pImgPath").value.trim();
    const datasheet = $("#pPdfPath").value.trim();

    if(!id || !name || !categoryId) return;

    const payload = { id, name, categoryId, price, shortDesc, features, image, datasheet };

    const existing = DB.products.find(x => x.id === id);
    if(existing){
      Object.assign(existing, payload);
    }else{
      DB.products.push(payload);
    }

    saveDB();
    renderProducts();
    clearProdForm();
  });

  $("#btnCatClear").onclick = clearCatForm;
  $("#btnProdClear").onclick = clearProdForm;
  $("#btnExport").onclick = exportJson;
}

function init(){
  refreshCatSelect();
  renderCats();
  renderProducts();
  bindForms();
  handleFileHints();
}

init();
