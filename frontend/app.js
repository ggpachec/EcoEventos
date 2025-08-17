const API_URL = "http://localhost:8000/api.php?resource=eventos";

// Cargar lista de eventos
async function cargarEventos() {
  const res = await fetch(API_URL);
  const data = await res.json();
  const contenedor = document.getElementById("eventos");
  contenedor.innerHTML = "";

  data.forEach(ev => {
    const div = document.createElement("div");
    div.className = "evento";
    div.innerHTML = `
      <strong>${ev.titulo}</strong> - ${ev.fecha} en ${ev.lugar}
      <br>
      <button class="ver" onclick="verDetalle('${ev.id}')">Ver Detalle</button>
      <button class="eliminar" onclick="eliminarEvento('${ev.id}')">Eliminar</button>
    `;
    contenedor.appendChild(div);
  });
}

// Ver detalle de evento
async function verDetalle(id) {
  const res = await fetch(`${API_URL}&id=${id}`);
  if (!res.ok) {
    alert("Evento no encontrado");
    return;
  }
  const evento = await res.json();

  document.getElementById("detTitulo").innerText = evento.titulo;
  document.getElementById("detCategoria").innerText = evento.categoria;
  document.getElementById("detFecha").innerText = evento.fecha;
  document.getElementById("detHora").innerText = `${evento.hora_inicio} - ${evento.hora_fin}`;
  document.getElementById("detLugar").innerText = evento.lugar;
  document.getElementById("detDescripcion").innerText = evento.descripcion;

  document.getElementById("detalleEvento").style.display = "block";
}

// Eliminar evento
async function eliminarEvento(id) {
  if (!confirm("¿Seguro que deseas eliminar este evento?")) return;

  const res = await fetch(`${API_URL}&id=${id}`, { method: "DELETE" });
  const result = await res.json();

  if (result.ok) {
    alert("Evento eliminado correctamente");
    cargarEventos();
    document.getElementById("detalleEvento").style.display = "none";
  } else {
    alert("Error al eliminar: " + (result.error || "desconocido"));
  }
}

// Cerrar detalle
function cerrarDetalle() {
  document.getElementById("detalleEvento").style.display = "none";
}

// Inicializar
cargarEventos();
