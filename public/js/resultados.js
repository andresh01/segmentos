const RESULTS_STORAGE_KEY = "segmentos_resultados";

let allResults = [];

document.addEventListener("DOMContentLoaded", function () {
  cargarUsuarioMini();
  allResults = leerResultados();
  renderResultados();

  document.getElementById("filterInput").addEventListener("input", renderResultados);
  document.getElementById("sortSelect").addEventListener("change", renderResultados);
  document.getElementById("btnClearAll").addEventListener("click", borrarTodo);
  document.getElementById("modalClose").addEventListener("click", cerrarModal);
  document.getElementById("modalOverlay").addEventListener("click", function (e) {
    if (e.target === this) cerrarModal();
  });
});

// Trae nombre/foto del usuario para la topbar (reutiliza la sesión activa)
async function cargarUsuarioMini() {
  try {
    const response = await fetch("/api/userinfo");
    const result = await response.json();
    document.getElementById("userName").innerText = `${result.firstname} ${result.lastname}`;
    document.getElementById("userLocation").innerText = `${result.city || ""}${result.city && result.state ? ", " : ""}${result.state || ""}`;
    document.getElementById("picture").src = result.profile;
  } catch (error) {
    console.error("Error al cargar el usuario:", error);
  }
}

function leerResultados() {
  try {
    return JSON.parse(localStorage.getItem(RESULTS_STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function guardarResultados(lista) {
  localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(lista));
}

function renderResultados() {
  const filtro = document.getElementById("filterInput").value.trim().toLowerCase();
  const orden = document.getElementById("sortSelect").value;

  let lista = allResults.filter((r) => r.segmentName.toLowerCase().includes(filtro));

  lista = ordenarResultados(lista, orden);

  actualizarEstadisticas();

  const grid = document.getElementById("resultsGrid");
  const empty = document.getElementById("emptyState");
  grid.innerHTML = "";

  if (lista.length === 0) {
    empty.style.display = "flex";
    grid.style.display = "none";
    return;
  }
  empty.style.display = "none";
  grid.style.display = "grid";

  lista.forEach((r) => {
    const card = document.createElement("div");
    card.className = "result-card";
    card.innerHTML = `
      <div class="result-header">
        <div class="result-name">${r.segmentName}</div>
        <button class="delete-btn" data-uid="${r.uid}" title="Eliminar">✕</button>
      </div>
      <div class="result-date">${formatearFecha(r.savedAt)}</div>
      <div class="result-stats">
        <div class="result-stat"><div class="label">Tiempo</div><div class="value">${r.targetTime}</div></div>
        <div class="result-stat"><div class="label">Watts</div><div class="value">${r.watts || "—"}</div></div>
        <div class="result-stat"><div class="label">w/kg</div><div class="value">${r.w_kg || "—"}</div></div>
      </div>
    `;
    card.addEventListener("click", function (e) {
      if (e.target.classList.contains("delete-btn")) return;
      abrirModal(r);
    });
    card.querySelector(".delete-btn").addEventListener("click", function (e) {
      e.stopPropagation();
      eliminarResultado(r.uid);
    });
    grid.appendChild(card);
  });
}

function ordenarResultados(lista, orden) {
  const copia = [...lista];
  switch (orden) {
    case "oldest":
      return copia.sort((a, b) => new Date(a.savedAt) - new Date(b.savedAt));
    case "watts_desc":
      return copia.sort((a, b) => parseFloat(b.watts || 0) - parseFloat(a.watts || 0));
    case "wkg_desc":
      return copia.sort((a, b) => parseFloat(b.w_kg || 0) - parseFloat(a.w_kg || 0));
    case "name":
      return copia.sort((a, b) => a.segmentName.localeCompare(b.segmentName));
    case "recent":
    default:
      return copia.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  }
}

function actualizarEstadisticas() {
  document.getElementById("statTotal").textContent = allResults.length;

  if (allResults.length === 0) {
    document.getElementById("statBestWkg").textContent = "—";
    document.getElementById("statTopSegment").textContent = "—";
    return;
  }

  const bestWkg = allResults.reduce(
    (max, r) => Math.max(max, parseFloat(r.w_kg) || 0),
    0
  );
  document.getElementById("statBestWkg").textContent = bestWkg > 0 ? bestWkg.toFixed(2) : "—";

  const conteo = {};
  allResults.forEach((r) => {
    conteo[r.segmentName] = (conteo[r.segmentName] || 0) + 1;
  });
  const top = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0];
  document.getElementById("statTopSegment").textContent = top ? top[0] : "—";
}

function eliminarResultado(uid) {
  allResults = allResults.filter((r) => r.uid !== uid);
  guardarResultados(allResults);
  renderResultados();
}

function borrarTodo() {
  if (allResults.length === 0) return;
  if (!confirm("¿Seguro que quieres borrar todos los resultados guardados? Esta acción no se puede deshacer.")) return;
  allResults = [];
  guardarResultados(allResults);
  renderResultados();
}

function abrirModal(r) {
  const modalContent = document.getElementById("modalContent");
  modalContent.innerHTML = `
    <h2>${r.segmentName}</h2>
    <ul>
      <li><span>Guardado</span><span>${formatearFecha(r.savedAt)}</span></li>
      <li><span>Tiempo objetivo</span><span>${r.targetTime}</span></li>
      <li><span>Watts</span><span>${r.watts || "—"}</span></li>
      <li><span>w/kg</span><span>${r.w_kg || "—"}</span></li>
      <li><span>VAM</span><span>${r.vam || "—"}</span></li>
      <li><span>Distancia</span><span>${r.distance ? r.distance + " mts" : "—"}</span></li>
      <li><span>Grado promedio</span><span>${r.average_grade != null ? r.average_grade + " %" : "—"}</span></li>
      <li><span>Desnivel positivo</span><span>${r.elevation_gain != null ? r.elevation_gain + " mts" : "—"}</span></li>
      <li><span>Tu PR</span><span>${r.pr || "—"}</span></li>
      <li><span>Fecha PR</span><span>${r.pr_date || "—"}</span></li>
      <li><span>Peso usado</span><span>${r.weight ? r.weight + " kg" : "—"}</span></li>
    </ul>
  `;
  document.getElementById("modalOverlay").classList.add("open");
}

function cerrarModal() {
  document.getElementById("modalOverlay").classList.remove("open");
}

function formatearFecha(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}
