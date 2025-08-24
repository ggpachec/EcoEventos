
# EcoEventos

Aplicación web para organizar eventos sostenibles comunitarios.  
**Stack elegido:** Frontend (HTML + CSS + JavaScript) y Backend (PHP 8 + JSON como almacenamiento).

<img width="1832" height="886" alt="image" src="https://github.com/user-attachments/assets/977b0acd-03f3-4631-acd0-6c9e5946d94d" />

---

## 1) Estructura del proyecto

```
EcoEventos/
├── backend/
│   ├── api.php                 # GET lista/detalle + DELETE (Luis)
│   ├── crear_evento.php        # POST crear (Joel)
│   ├── listar_eventos.php      # GET lista (Joel)
│   ├── editar_evento.php       # POST editar (Génesis)
│   ├── filtrar_eventos.php     # GET filtro por categoría/fecha/texto (Génesis)
│   └── eventos.json            # Fuente de datos (JSON)
└── frontend/
    ├── index.html              # UI principal (lista, detalle, borrar)
    ├── create.html             # Formulario de creación
    ├── edit.html               # Formulario de edición
    ├── app.js                  # Lógica de UI y llamadas a la API
    └── styles.css              # Estilos
```

> **Nota:** `api.php` concentra **detalle** y **eliminar** (responsable: *Luis Luna*). El frontend apunta a `http://localhost:8000/backend/...` por defecto.

---

## 2) Requisitos previos

- **PHP 8.x** instalado y accesible en consola (`php -v`).
- Navegador moderno.
- (Opcional) **VS Code Live Server** para servir el frontend, aunque también puedes servirlo con el servidor embebido de PHP.

---

## 3) Cómo ejecutar (demo local)

### Opción A — Un solo servidor (recomendada)
1. Abrir una terminal en la **raíz** del proyecto `EcoEventos/`.
2. Ejecutar:  
   ```bash
   php -S localhost:8000
   ```
3. Abrir en el navegador:  
   - Frontend: `http://localhost:8000/frontend/index.html`
   - API (lista): `http://localhost:8000/backend/api.php?resource=eventos`

### Opción B — Frontend con Live Server y Backend con PHP
1. Backend: desde `EcoEventos/` ejecutar:
   ```bash
   php -S localhost:8000
   ```
2. Frontend: abrir `frontend/index.html` con Live Server (típicamente `http://127.0.0.1:5500/frontend/index.html`).  
   La API permite CORS, por lo que funcionará desde otro puerto.

---

## 4) Endpoints (resumen)

> Base: `http://localhost:8000`

### Listar / Detalle / Eliminar
- **GET** `/backend/listar_eventos.php` → lista completa (array JSON)
- **GET** `/backend/api.php?resource=eventos&id={ID}` → detalle (objeto JSON)
- **DELETE** `/backend/api.php?resource=eventos&id={ID}` → elimina el evento

### Crear / Editar / Filtrar
- **POST** `/backend/crear_evento.php` → crea un evento (JSON en el body)
- **POST** `/backend/editar_evento.php` → edita un evento existente (JSON con `id` + campos)
- **GET**  `/backend/filtrar_eventos.php?categoria=...&desde=DD/MM/YYYY&hasta=DD/MM/YYYY&q=texto`

#### Ejemplo de JSON para crear/editar
```json
{
  "titulo": "Siembra comunitaria",
  "categoria": "Reforestación",
  "fecha": "30/09/2025",
  "hora_inicio": "09:00 AM",
  "hora_fin": "11:00 AM",
  "lugar": "Parque La Floresta",
  "descripcion": "Actividad abierta con material incluido."
}
```

---

## 5) Créditos (responsables por funcionalidad)

- **Luis Luna** — Detalle y eliminación de eventos (backend + UI de detalle/borrado).
- **Joel Orrala** — Creación y listado de eventos (backend + UI de creación).
- **Génesis Pacheco** — Edición y filtrado (backend + UI de edición/filtro).

---

## 9) Licencia
Lenguajes de Programación - ESPOL
