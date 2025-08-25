const API_URL = "http://localhost:8000/backend/api.php?resource=eventos";
const FILTER_URL = "http://localhost:8000/backend/filtrar_eventos.php";
const LIST_URL = "http://localhost:8000/backend/listar_eventos.php";
const CREATE_URL = "http://localhost:8000/backend/crear_evento.php";
const EDITAR_URL = "http://localhost:8000/backend/editar_evento.php";

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

function to24h(hhmm_ampm) {
  if (!hhmm_ampm) return "";
  const m = hhmm_ampm.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return hhmm_ampm; // si ya viene "HH:MM" 24h, se devuelve tal cual
  let h = parseInt(m[1], 10);
  const mm = m[2];
  const ap = m[3].toUpperCase();
  if (ap === "AM") {
    if (h === 12) h = 0;
  } else { // PM
    if (h !== 12) h += 12;
  }
  return `${String(h).padStart(2,"0")}:${mm}`;
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
  const frmEditar = document.getElementById("frmEditar");

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
  } else if (frmEditar) {
    // edit.html
    initEditar();
    return;
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

// ----- EDITAR EVENTO (POST) -----
async function initEditar() {
  const frm = document.getElementById("frmEditar");
  if (!frm) return; // no estamos en edit.html

  // Cancelar
  document.getElementById("btnCancelar")?.addEventListener("click", () => {
    if (history.length > 1) history.back();
    else window.location.href = "index.html";
  });

  // 1) obtener id de la URL
  const id = getParam("id");
  if (!id) {
    alert("Falta el id del evento");
    window.location.href = "index.html";
    return;
  }

  // 2) traer datos del evento
  try {
    const res = await fetch(`${API_URL}&id=${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error("No se pudo cargar el evento");
    const ev = await res.json();

    // 3) rellenar formulario
    document.getElementById("evtId").value      = ev.id ?? id;
    document.getElementById("eTitulo").value    = ev.titulo ?? "";
    // categoría: si viene texto libre, lo ponemos como value; si no está en la lista, igual se muestra
    document.getElementById("eCategoria").value = (ev.categoria ?? ev.tipo ?? "") || "";

    // fecha: si viene DD/MM/YYYY → convertir a YYYY-MM-DD
    const ymd = /^\d{2}\/\d{2}\/\d{4}$/.test(ev.fecha) ? dmyToYmd(ev.fecha) : (ev.fecha ?? "");
    document.getElementById("eFecha").value     = ymd;

    // horas: si se guardaron como "hh:mm AM/PM", convertir a "HH:MM"
    document.getElementById("eHoraIni").value   = to24h(ev.hora_inicio ?? "");
    document.getElementById("eHoraFin").value   = to24h(ev.hora_fin ?? "");
    document.getElementById("eLugar").value     = ev.lugar ?? "";
    document.getElementById("eDescripcion").value = ev.descripcion ?? "";
  } catch (err) {
    console.error(err);
    alert("Error al cargar datos para edición");
    window.location.href = "index.html";
    return;
  }

  // 4) enviar cambios → tu endpoint existente /backend/editar_evento.php
  frm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      id: document.getElementById("evtId").value,
      titulo: document.getElementById("eTitulo").value.trim(),
      categoria: document.getElementById("eCategoria").value.trim(),
      fecha: ymdToDmy(document.getElementById("eFecha").value),   // YYYY-MM-DD -> DD/MM/YYYY
      hora_inicio: to12h(document.getElementById("eHoraIni").value), // 24h -> 12h AM/PM (igual que create)
      hora_fin: to12h(document.getElementById("eHoraFin").value),
      lugar: document.getElementById("eLugar").value.trim(),
      descripcion: document.getElementById("eDescripcion").value.trim(),
    };

    // validación mínima
    const req = ["id","titulo","categoria","fecha","hora_inicio","hora_fin","lugar","descripcion"];
    for (const k of req) {
      if (!payload[k] || String(payload[k]).trim() === "") {
        alert("Completa todos los campos obligatorios (*)");
        return;
      }
    }

    // opcional: validar horas
    // if (document.getElementById("eHoraIni").value > document.getElementById("eHoraFin").value) { ... }

    try {
      // PHP `editar_evento.php` acepta POST. Enviamos JSON:
      let res = await fetch(EDITAR_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Si PHP espera $_POST (no JSON), hacemos fallback con FormData:
      let data;
      if (!res.ok) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k,v]) => fd.append(k, v));
        res = await fetch(EDITAR_URL, { method: "POST", body: fd });
      }
      data = await res.json().catch(() => ({}));

      document.getElementById("outEditar") && (document.getElementById("outEditar").textContent = JSON.stringify(data, null, 2));

      if (!res.ok || data.error) {
        alert("No se pudo actualizar: " + (data.mensaje || data.error || "ver consola"));
        return;
      }

      alert("Evento actualizado");
      window.location.href = "index.html";
    } catch (err) {
      console.error(err);
      alert("Error de red al actualizar");
    }
  });
}
