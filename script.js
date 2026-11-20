/* ==========================================================
   Amber Wear — Interactividad
   - Abre y cierra las ventanas
   - Carrito: agregar, quitar, total y contador
   - Formulario de pedido
   ========================================================== */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

/* ---------- Carrito (se guarda en el navegador) ---------- */
let carrito = [];
try { carrito = JSON.parse(localStorage.getItem("amber-carrito")) || []; } catch (e) { carrito = []; }

function guardar() {
  try { localStorage.setItem("amber-carrito", JSON.stringify(carrito)); } catch (e) {}
}

const dinero = (n) => "$" + n.toLocaleString("es-MX");

function agregar(nombre, precio) {
  const item = carrito.find((p) => p.nombre === nombre);
  if (item) item.cantidad++;
  else carrito.push({ nombre, precio, cantidad: 1 });
  guardar();
  pintarCarrito();
  avisar("✓ " + nombre + " agregado al carrito");
}

function cambiarCantidad(nombre, cambio) {
  const item = carrito.find((p) => p.nombre === nombre);
  if (!item) return;
  item.cantidad += cambio;
  if (item.cantidad <= 0) carrito = carrito.filter((p) => p !== item);
  guardar();
  pintarCarrito();
}

/* Semana Amber: 15% de descuento en conjuntos y uniformes */
const enOferta = (nombre) => /^(Conjunto|Uniforme) /.test(nombre);

function pintarCarrito() {
  const subtotal = carrito.reduce((s, p) => s + p.precio * p.cantidad, 0);
  const descuento = Math.round(carrito.filter((p) => enOferta(p.nombre)).reduce((s, p) => s + p.precio * p.cantidad, 0) * 0.15);
  const total = subtotal - descuento;
  const piezas = carrito.reduce((s, p) => s + p.cantidad, 0);

  // Contador del botón "Pedir"
  $$(".contador").forEach((c) => {
    c.textContent = piezas;
    c.classList.toggle("activo", piezas > 0);
  });

  // Lista dentro de la ventana del carrito
  $("#carrito-lista").innerHTML = carrito.map((p) => `
    <li>
      <div><strong>${p.nombre}</strong><span>${dinero(p.precio)} c/u</span></div>
      <div class="cantidad">
        <button type="button" data-menos="${p.nombre}" aria-label="Quitar uno">−</button>
        <span>${p.cantidad}</span>
        <button type="button" data-mas="${p.nombre}" aria-label="Agregar uno">+</button>
      </div>
    </li>`).join("");
  $("#carrito-vacio").hidden = carrito.length > 0;
  $("#carrito-total").textContent = dinero(total);
  $("#carrito-descuento").hidden = descuento === 0;
  $("#descuento-monto").textContent = "−" + dinero(descuento);
  $("#btn-finalizar").classList.toggle("desactivado", carrito.length === 0);

  // Resumen dentro del formulario de pedido
  $("#resumen-pedido").innerHTML = carrito.length
    ? carrito.map((p) => `<p><span>${p.cantidad} × ${p.nombre}</span><span>${dinero(p.precio * p.cantidad)}</span></p>`).join("") +
      (descuento ? `<p class="resumen-descuento"><span>Semana Amber −15%</span><span>−${dinero(descuento)}</span></p>` : "") +
      `<p class="resumen-total"><span>Total</span><span>${dinero(total)}</span></p>`
    : `<p class="vacio">Tu carrito está vacío.</p>`;
}

/* ---------- Aviso flotante ---------- */
let temporizador;
function avisar(texto) {
  const aviso = $("#aviso");
  aviso.textContent = texto;
  aviso.classList.add("visible");
  clearTimeout(temporizador);
  temporizador = setTimeout(() => aviso.classList.remove("visible"), 2500);
}

/* ---------- Ventanas ---------- */
function abrir(id) {
  const ventana = document.getElementById(id);
  if (!ventana) return;
  cerrarVentanas();
  ventana.classList.add("abierta");
  document.body.classList.add("sin-scroll");
}

function cerrarVentanas() {
  $$(".ventana.abierta").forEach((v) => v.classList.remove("abierta"));
  document.body.classList.remove("sin-scroll");
  if (location.hash.startsWith("#ventana-")) history.replaceState(null, "", location.pathname);
}

function irA(id) {
  const destino = document.getElementById(id);
  if (destino) destino.scrollIntoView({ behavior: "smooth" });
}

/* ---------- Ventana de equipo ---------- */
const PRECIOS = { seleccion: 1499, club: 1599, local: 1299 };
const TIPOS = { seleccion: "Selección nacional", club: "Club", local: "Liga MX" };

function llenarEquipo({ equipo, nombre, tipo }) {
  const precio = PRECIOS[tipo] || 1499;
  const escudo = document.querySelector(`[data-equipo="${equipo}"] img`).getAttribute("src");
  const foto = $("#equipo-foto");
  const mini = $("#equipo-escudo-mini");

  // Foto de la playera; si todavía no hay, se muestra el escudo en grande
  foto.classList.remove("es-escudo");
  foto.onerror = () => { foto.onerror = null; foto.src = escudo; foto.classList.add("es-escudo"); mini.hidden = true; };
  foto.src = `img/playeras/${equipo}.jpg`;
  foto.alt = `Playera local de ${nombre}`;
  mini.hidden = false;
  mini.src = escudo;
  mini.alt = `Escudo de ${nombre}`;

  $("#equipo-archivo").textContent = `${equipo}.html`;
  $("#equipo-tipo").textContent = TIPOS[tipo] || "Equipo";
  $("#equipo-titulo").textContent = `Playera ${nombre}`;
  $("#equipo-precio").textContent = dinero(precio);
  $("#equipo-desc").textContent = `La playera local oficial de ${nombre}. Ideal para apoyar a tu equipo en la cancha, en el estadio o en la calle.`;
  const btn = $("#equipo-agregar");
  btn.dataset.agregar = `Playera ${nombre}`;
  btn.dataset.precio = precio;
}

/* ---------- Ventana genérica de producto ---------- */
function llenarPrenda({ prenda, precio, img, img2, filtro, desc, etiqueta, lista }) {
  const caja = $("#prenda-foto");
  const foto = $("#prenda-img");
  const foto2 = $("#prenda-img2");
  foto.src = img;
  foto.alt = prenda;
  foto.className = filtro || "";
  foto2.hidden = !img2;
  if (img2) { foto2.src = img2; foto2.alt = prenda + " (short)"; }
  caja.classList.toggle("foto-doble", !!img2);
  $("#prenda-archivo").textContent = prenda.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-") + ".html";
  $("#prenda-etiqueta").textContent = etiqueta || "Amber Wear";
  $("#prenda-titulo").textContent = prenda;
  $("#prenda-precio").textContent = dinero(Number(precio));
  $("#prenda-desc").textContent = desc || "";
  $("#prenda-lista").innerHTML = (lista || "").split("|").filter(Boolean).map((x) => `<li>${x}</li>`).join("");
  const btn = $("#prenda-agregar");
  btn.dataset.agregar = prenda;
  btn.dataset.precio = precio;
}

/* ---------- Un solo "escuchador" para todos los clics ---------- */
document.addEventListener("click", (e) => {
  // Botones + / − del carrito
  const mas = e.target.closest("[data-mas]");
  const menos = e.target.closest("[data-menos]");
  if (mas) return cambiarCantidad(mas.dataset.mas, 1);
  if (menos) return cambiarCantidad(menos.dataset.menos, -1);

  const enlace = e.target.closest('a[href^="#"]');
  if (!enlace) return;
  const id = enlace.getAttribute("href").slice(1);

  // Producto genérico (shorts, tenis, conjuntos)
  if (enlace.dataset.prenda) {
    e.preventDefault();
    llenarPrenda(enlace.dataset);
    abrir("ventana-prenda");
    return;
  }

  // Cuadro de equipo: llena la ventana del equipo
  if (enlace.dataset.equipo) {
    e.preventDefault();
    llenarEquipo(enlace.dataset);
    abrir("ventana-equipo");
    return;
  }

  // "Añadir al pedido"
  if (enlace.dataset.agregar) {
    e.preventDefault();
    agregar(enlace.dataset.agregar, Number(enlace.dataset.precio));
    abrir("ventana-carrito");
    return;
  }

  // "Finalizar pedido" con el carrito vacío
  if (enlace.id === "btn-finalizar" && carrito.length === 0) {
    e.preventDefault();
    avisar("Agrega al menos un producto primero");
    return;
  }

  // Abrir una ventana
  if (id.startsWith("ventana-")) {
    e.preventDefault();
    abrir(id);
    return;
  }

  // Cerrar (✕ o clic en el fondo oscuro)
  if (enlace.classList.contains("cerrar") || enlace.classList.contains("ventana-fondo")) {
    e.preventDefault();
    cerrarVentanas();
    return;
  }

  // "Pídelo aquí": llena el formulario con el equipo buscado
  if (enlace.id === "pedir-equipo") {
    const campo = $('#form-especial [name="equipo"]');
    if (campo) campo.value = $("#buscar-equipo").value.trim();
  }

  // Cuadros de equipos: van a la pestaña de playeras
  if (enlace.dataset.tab) {
    const pestaña = document.getElementById(enlace.dataset.tab);
    if (pestaña) pestaña.checked = true;
  }

  // Cualquier otro enlace interno (Ver todo, Equipos, Productos…)
  e.preventDefault();
  cerrarVentanas();
  irA(id);
});

// Tecla Escape cierra la ventana abierta
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cerrarVentanas();
});

/* ---------- Formulario de pedido ---------- */
$("#form-pedido").addEventListener("submit", (e) => {
  e.preventDefault();
  if (carrito.length === 0) {
    avisar("Tu carrito está vacío");
    return;
  }
  carrito = [];
  guardar();
  pintarCarrito();
  e.target.reset();
  abrir("ventana-gracias");
});

/* ---------- Pedido especial ---------- */
$("#form-especial").addEventListener("submit", (e) => {
  e.preventDefault();
  const d = new FormData(e.target);
  $("#especial-resumen").textContent = `${d.get("tipo")} de ${d.get("equipo")}${d.get("temporada") ? " (" + d.get("temporada") + ")" : ""}, talla ${d.get("talla")}.`;
  e.target.reset();
  abrir("ventana-especial");
});

/* ---------- Buscador de equipos ---------- */
const limpiar = (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
const seccionEquipos = $("#equipos");
const equipos = $$("#equipos .equipo");

$("#buscar-equipo").addEventListener("input", (e) => {
  const q = limpiar(e.target.value);
  seccionEquipos.classList.toggle("buscando", q !== "");
  let encontrados = 0;
  equipos.forEach((eq) => {
    const coincide = !q || limpiar(eq.dataset.nombre + " " + eq.dataset.equipo).includes(q);
    eq.classList.toggle("oculto", !coincide);
    if (coincide && q) encontrados++;
  });
  $$("#equipos .panel").forEach((panel) => {
    panel.classList.toggle("vacio-busqueda", !panel.querySelector(".equipo:not(.oculto)"));
  });
  $("#buscador-cuenta").textContent = q ? `${encontrados} ${encontrados === 1 ? "equipo" : "equipos"}` : "";
  $("#sin-equipo").hidden = !q || encontrados > 0;
  $("#sin-equipo-nombre").textContent = e.target.value.trim();
});

/* ---------- Reloj de la oferta: la Semana Amber dura 7 días ----------
   Empieza el 19 de noviembre de 2026 y, al terminar, arranca otra semana. */
const INICIO_OFERTA = new Date(2026, 10, 19, 0, 0, 0).getTime(); // mes 10 = noviembre
const SEMANA = 7 * 24 * 60 * 60 * 1000;

function pintarReloj() {
  const pasado = Date.now() - INICIO_OFERTA;
  const resta = Math.floor((SEMANA - (((pasado % SEMANA) + SEMANA) % SEMANA)) / 1000);
  const partes = { d: Math.floor(resta / 86400), h: Math.floor(resta / 3600) % 24, m: Math.floor(resta / 60) % 60, s: resta % 60 };
  for (const k in partes) $("#reloj-" + k).textContent = String(partes[k]).padStart(2, "0");
}
pintarReloj();
setInterval(pintarReloj, 1000);

/* ---------- Inicio ---------- */
pintarCarrito();
// Si la página se abre con un #ventana-... en la dirección, se abre esa ventana
if (location.hash.startsWith("#ventana-")) abrir(location.hash.slice(1));
