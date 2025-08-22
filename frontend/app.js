const API_URL = "http://localhost:8000/backend/api.php?resource=eventos";
const FILTER_URL = "http://localhost:8000/backend/filtrar_eventos.php";
const LIST_URL = "http://localhost:8000/backend/listar_eventos.php";
const CREATE_URL = "http://localhost:8000/backend/crear_evento.php";

// Utilidades de fecha
function dmyToYmd(dd_mm_yyyy) {
  if (!dd_mm_yyyy) return "";
  const [d, m, y] = dd_mm_yyyy.split("/");
  if (!d || !m || !y) return "";
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function getParam(name) {
  const u = new URL(window.location.href);
  return u.searchParams.get(name);
}

function ymdToDmy(yyyy_mm_dd) {
  if (!yyyy_mm_dd) return "";
  const [y,m,d] = yyyy_mm_dd.split("-");
  if (!y || !m || !d) return "";
  return `${d.padStart(2,"0")}/${m.padStart(2,"0")}/${y}`;
}

function to12h(hhmm) {
  if (!hhmm) return "";
  const [H, M] = hhmm.split(":").map(Number);
  if (Number.isNaN(H) || Number.isNaN(M)) return hhmm; 
  const ampm = H >= 12 ? "PM" : "AM";
  const h12  = ((H % 12) || 12).toString().padStart(2,"0");
  const mm   = M.toString().padStart(2,"0");
  return `${h12}:${mm} ${ampm}`;
}


// Actualizar resumen de eventos
function actualizarResumen(n, sinFiltros = false) {
  const span = document.getElementById("resultadoResumen");
  if (!span) return;
  span.textContent = sinFiltros ? `Mostrando todos los eventos (${n})` : `Coincidencias: ${n}`;
}

// Cargar lista de eventos
async function cargarEventos() {
  try {
    const res = await fetch(LIST_URL);
    if (!res.ok) throw new Error("No se pudo cargar la lista");
    const data = await res.json();
    const lista = Array.isArray(data.eventos) ? data.eventos : [];
    renderEventos(lista);
    actualizarResumen(lista.length, true);
    cargarCategoriasEnSelect(lista);
  } catch (err) {
    console.error(err);
    alert("Error al cargar eventos");
  }
}

// Renderizar eventos
function renderEventos(arr) {
  const contenedor = document.getElementById("eventos");
  if (!contenedor) return;
  contenedor.innerHTML = "";

  if (!arr || arr.length === 0) {
    contenedor.innerHTML = `<div class="evento"><em>No hay eventos con ese filtro.</em></div>`;
    return;
  }

  arr.forEach((ev) => {
    const div = document.createElement("div");
    div.className = "evento";
    div.innerHTML = `
      <strong>${ev.titulo}</strong> - ${ev.fecha} en ${ev.lugar}
      <br>
      <button class="ver" onclick="verDetalle('${ev.id}')">Ver Detalle</button>
      <button class="editar" onclick="editarEvento('${ev.id}')">Editar</button>
      <button class="eliminar" onclick="eliminarEvento('${ev.id}')">Eliminar</button>
    `;
    contenedor.appendChild(div);
  });
}

// Ver detalle de evento
async function verDetalle(id) {
  try {
    const res = await fetch(`${API_URL}&id=${encodeURIComponent(id)}`);
    if (!res.ok) {
      alert("Evento no encontrado");
      return;
    }
    const evento = await res.json();

    document.getElementById("detTitulo").innerText = evento.titulo;
    document.getElementById("detCategoria").innerText = evento.categoria;
    document.getElementById("detFecha").innerText = evento.fecha;
    document.getElementById(
      "detHora"
    ).innerText = `${evento.hora_inicio} - ${evento.hora_fin}`;
    document.getElementById("detLugar").innerText = evento.lugar;
    document.getElementById("detDescripcion").innerText = evento.descripcion;

    document.getElementById("detalleEvento").style.display = "block";
  } catch (err) {
    console.error(err);
    alert("Error al cargar el detalle");
  }
}

// Eliminar evento
async function eliminarEvento(id) {
  try {
    if (!confirm("¿Seguro que deseas eliminar este evento?")) return;

    const res = await fetch(`${API_URL}&id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const result = await res.json();

    if (result.ok) {
      alert("Evento eliminado correctamente");
      cargarEventos();
      document.getElementById("detalleEvento").style.display = "none";
    } else {
      alert("Error al eliminar: " + (result.error || "desconocido"));
    }
  } catch (err) {
    console.error(err);
    alert("Error al eliminar el evento");
  }
}

// Cerrar detalle
function cerrarDetalle() {
  const panel = document.getElementById("detalleEvento");
  if (panel) panel.style.display = "none";
}

// Aplicar Filtros
async function aplicarFiltros(ev) {
  if (ev) ev.preventDefault();

  const categoria = document.getElementById("filtroCategoria")?.value || "";
  const desde = ymdToDmy(document.getElementById("filtroDesde")?.value || "");
  const hasta = ymdToDmy(document.getElementById("filtroHasta")?.value || "");
  const q = document.getElementById("filtroQ")?.value?.trim() || "";

  const params = new URLSearchParams();
  if (categoria) params.set("categoria", categoria);
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  if (q) params.set("q", q);

  const url = params.toString() ? `${FILTER_URL}?${params.toString()}` : FILTER_URL;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("No se pudo aplicar filtros");
    const data = await res.json();

    renderEventos(data);
    actualizarResumen(data.length, !params.toString());
  } catch (err) {
    console.error(err);
    alert("Error al filtrar");
  }
}

//Limpiar Filtros
function limpiarFiltros() {
  const c = (id) => document.getElementById(id);
  if (c("filtroCategoria")) c("filtroCategoria").value = "";
  if (c("filtroDesde")) c("filtroDesde").value = "";
  if (c("filtroHasta")) c("filtroHasta").value = "";
  if (c("filtroQ")) c("filtroQ").value = "";
  cargarEventos().catch(console.error);
}

// Cargar Select de HTML
function cargarCategoriasEnSelect(eventos) {
  const sel = document.getElementById("filtroCategoria");
  if (!sel) return;

  const cats = Array.from(new Set((eventos || []).map(e => e.categoria).filter(Boolean))).sort();

  // Limpia las opciones previas, dejando "Todas" (value="")
  sel.querySelectorAll("option:not([value=''])").forEach(o => o.remove());

  cats.forEach(c => {
    const op = document.createElement("option");
    op.value = c;
    op.textContent = c;
    sel.appendChild(op);
  });
}

// Editar Evento
function editarEvento(id) {
  window.location.href = `edit.html?id=${encodeURIComponent(id)}`;
}

// ----- CREAR EVENTO (POST) -----
document.addEventListener("DOMContentLoaded", () => {
  const frm = document.getElementById("frmCrear");
  if (frm) {
    document.getElementById("btnCancelar")?.addEventListener("click", () => {
      if (history.length > 1) history.back();
      else window.location.href = "index.html";
    });

    // Enviar formulario
    frm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(frm);
      const payload = Object.fromEntries(fd.entries());

      payload.fecha = ymdToDmy(payload.fecha);           // "YYYY-MM-DD" -> "DD/MM/YYYY"
      payload.hora_inicio = to12h(payload.hora_inicio);        // "HH:MM" (24h) -> "hh:mm AM/PM"
      payload.hora_fin = to12h(payload.hora_fin);          

      const req = ["titulo", "categoria", "fecha", "hora_inicio", "hora_fin", "lugar", "descripcion"];
      for (const k of req) {
        if (!payload[k] || String(payload[k]).trim() === "") {
          alert("Completa todos los campos obligatorios (*)");
          return;
        }
      }

      try {
        const res = await fetch(CREATE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        const out = document.getElementById("outCrear");
        if (out) out.textContent = JSON.stringify(data, null, 2);

        if (res.ok && data.evento) {
          alert("Evento creado");
          frm.reset();
          window.location.href = "index.html";
        } else {
          alert("Error al crear: " + (data.mensaje || data.error || "ver consola"));
          console.error(data);
        }
      } catch (err) {
        console.error(err);
        alert("Error de red al crear el evento");
      }
    });
  } else {
    // Si NO estamos en create.html, cargar la lista (index.html)
    if (typeof cargarEventos === "function") cargarEventos();

    // Si hay barra de filtros, enganchar eventos
    const filtros = document.getElementById("barraFiltros");
    if (filtros) {
      document.getElementById("btnAplicar")?.addEventListener("click", aplicarFiltros);
      document.getElementById("btnLimpiar")?.addEventListener("click", limpiarFiltros);
      document.getElementById("filtroQ")?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") aplicarFiltros(e);
      });
    }
  }
});
