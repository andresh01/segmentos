var weight = 0;
var elevation_gain = 0;
var average_grade = 0;
var page = 1;
var per_page = 30;
var currentSegment = null; // datos del segmento actualmente abierto, usados al guardar un resultado

// Cargar los datos del usuario al cargar la página
document.addEventListener("DOMContentLoaded", function () {
  cargarDatosUsuario();
});

document.getElementById("nextPage").addEventListener("click", function () {
  document.querySelector(".tableSegments").innerHTML = "";
  cargarSegmentosFavoritos(page + 1, per_page);
});
document.getElementById("previousPage").addEventListener("click", function () {
  document.querySelector(".tableSegments").innerHTML = "";
  cargarSegmentosFavoritos(page - 1, per_page);
});

document
  .getElementById("btnSearchSegment")
  .addEventListener("click", function () {
    var table = document.querySelector(".tableSegments");
    table.innerHTML = "";
    var name = document.getElementById("searchSegment").value;
    buscarSegmento(name);
  });

// Función para cargar la información del usuario
async function cargarDatosUsuario() {
  try {
    const response = await fetch("/api/userinfo");
    const result = await response.json();

    let icon = document.getElementById("icon_link");
    icon.setAttribute("href", `https://strava.com/athletes/${result.id}`);

    // Mostrar la información del usuario
    weight = result.weight;

    let h2 = document.getElementById("userName");
    h2.innerText = `${result.firstname} ${result.lastname}`;

    let div = document.getElementById("userList");
    div.innerHTML = ""; // Esto borra todo el contenido anterior del <ul>

    let city = document.createElement("p");
    let kg = document.createElement("p");
    kg.setAttribute("id", "weight");

    city.textContent = `${result.city}-${result.state}`; // Añadir el texto al li
    kg.textContent = `Peso: ${result.weight} kg`; // Añadir el texto al li

    div.appendChild(city);
    div.appendChild(kg);

    // Actualizar topbar y tarjetas de estadísticas
    let userLocation = document.getElementById("userLocation");
    if (userLocation) userLocation.textContent = `${result.city || ""}${result.city && result.state ? ", " : ""}${result.state || ""}`;
    let statWeight = document.getElementById("statWeight");
    if (statWeight) statWeight.textContent = result.weight ? `${result.weight} kg` : "—";
    let statBikes = document.getElementById("statBikes");
    if (statBikes) statBikes.textContent = result.bikes ? result.bikes.length : "—";
    let imgProfileUser = document.getElementById("picture");
    imgProfileUser.src = result.profile;
    cargarSegmentosFavoritos(page, per_page);
  } catch (error) {
    //window.location = "index.html";
    console.error("Error al cargar la información del usuario:", error);
  }
}

async function cargarSegmentosFavoritos(pag, per_page) {
  page = pag;
  try {
    const response = await fetch(
      `/api/userSegmentsStarred?page=${pag}&per_page=${per_page}`
    );
    const result = await response.json();

    if (result.length == per_page) {
      document.getElementById("nextPage").style.display = "block";
    } else document.getElementById("nextPage").style.display = "none";
    if (page > 1) {
      document.getElementById("previousPage").style.display = "block";
    } else document.getElementById("previousPage").style.display = "none";

    var table = document.querySelector(".tableSegments");

    result.forEach((value) => {
      var tr = document.createElement("tr");
      tr.innerHTML = `<tr> 
                            <td><button onclick="infoSegmento(${value.id})">${value.name}</button></td> 
                        </tr>`;
      table.appendChild(tr);
    });


    /*window.location=user.html?segmento=${value.id} var select = document.querySelector("#climbs")
        result.forEach(element => {
            var option = document.createElement("option");
            option.value = element.id;   // Establecer el valor de la opción
            option.text = element.name;    // Establecer el texto visible de la opción
            select.appendChild(option); 
        }) */

    /* select.addEventListener('change', function(){
            infoSegmento(select.value)
            
        }) */
  } catch (error) {
    window.location = "index.html";
    console.error("Error al cargar la información de los segmentos:", error);
  }
}

async function infoSegmento(id) {
  try {
    const response = await fetch(`/api/segmentInfo?id=${id}`);
    const result = await response.json();
    if (result.status_code === 401 || result.status_code === 500) {
      window.location = "index.html";
    }

    elevation_gain = parseInt(result.elevation_high - result.elevation_low);
    average_grade = result.average_grade;
    pr = secondsToString(result.athlete_segment_stats.pr_elapsed_time);
    pr_date = result.athlete_segment_stats.pr_date;

    currentSegment = {
      id: result.id,
      name: result.name,
      distance: result.distance,
      average_grade: result.average_grade,
      elevation_gain: elevation_gain,
      pr: pr,
      pr_date: pr_date,
    };

    document.getElementById("segmentName").innerText = result.name;

    let ul = document.getElementById("list");
    ul.innerHTML = ""; // Esto borra todo el contenido anterior del <ul>
    let li1 = document.createElement("li");
    let li2 = document.createElement("li");
    let li3 = document.createElement("li");
    let li4 = document.createElement("li");
    let li5 = document.createElement("li");

    li1.textContent = `Distancia: ${result.distance} mts`; // Añadir el texto al li
    li2.textContent = `Grado Promedio: ${result.average_grade} %`; // Añadir el texto al li
    li4.textContent = `Desnivel Positivo: ${elevation_gain} mts`; // Añadir el texto al li
    li5.textContent = `Tu PR: ${pr} seg`; // Añadir el texto al li
    li3.textContent = `Fecha PR: ${pr_date} `; // Añadir el texto al li

    ul.appendChild(li1);
    ul.appendChild(li2);
    ul.appendChild(li4);
    ul.appendChild(li3);
    ul.appendChild(li5);

    let imgProfile = document.getElementById("profile");
    imgProfile.src = result.elevation_profile; // se usa solo si el gráfico interactivo no puede cargar
    cargarPerfilElevacion(id);
    document.querySelector(".containerInfoSegmento").style.display = "block";
    info = document.getElementById("info");
    info.style.display = "block";

    let minutes = document.getElementById("minutes");
    minutes.value = "";
    let hour = document.getElementById("hour");
    hour.value;
    let w_kg = document.getElementById("valw_kg");
    w_kg.value = "";

    let guardadoMsg = document.getElementById("guardadoMsg");
    if (guardadoMsg) guardadoMsg.style.display = "none";

    w_kg.addEventListener("input", function () {
      segmentTime();
    });
    hour.addEventListener("input", function () {
      watts();
    });
    minutes.addEventListener("input", function () {
      watts();
    });

    // Enfocar el input de minutes
    minutes.focus();
    watts();
  } catch (error) {
    console.error("Error al cargar la información del segmento:", error);
  }
}

async function buscarSegmento(name) {
  try {
    const query = await fetch(`/api/userSegmentsStarred?page=1&per_page=200`);
    const queryResult = await query.json();
    if (queryResult.length == per_page) {
      document.getElementById("nextPage").style.display = "block";
    } else document.getElementById("nextPage").style.display = "none";
    if (page > 1) {
      document.getElementById("previousPage").style.display = "block";
    } else document.getElementById("previousPage").style.display = "none";

    var table = document.querySelector(".tableSegments");
    if (name.trim() === "") {
      cargarSegmentosFavoritos(page, per_page);
    } else {
      const segmento = queryResult.filter((segment) =>
        segment.name.toLowerCase().includes(name.toLowerCase())
      );

      if (segmento.length > 0) {
        segmento.forEach((value) => {
          var tr = document.createElement("tr");
          tr.innerHTML = `<tr> 
          <td><button onclick="infoSegmento(${value.id})">${value.name}</button></td> 
          </tr>`;
          table.appendChild(tr);
        });
        document
          .querySelector(".containerTable")
          .setAttribute("style", "height: auto; ");
      } else {
        var tr = document.createElement("tr");
        tr.innerHTML = `<tr> 
          <td>Upss parece que ${name} no existe</td> 
          </tr>`;
        table.appendChild(tr);
      }
    }
  } catch (error) {
    console.error("Error al cargar la información del segmento:", error);
  }
}

function watts() {
  let minutes = document.getElementById("minutes") || 0;
  let hour = document.getElementById("hour") || 0;

  let minuts = parseInt(minutes.value) || 0;
  let hr = parseInt(hour.value) || 0;
  let time = hr * 60 + minuts;

  let vam = time == 0 ? "" : (elevation_gain / (time / 60)).toFixed(0);
  let w;
  let factor_grado = 2 + average_grade / 10;
  w_kg = time == 0 ? "" : (vam / (factor_grado * 100)).toFixed(2);
  w = w_kg * weight;

  document.getElementById("valw_kg").value = w_kg;
  document.getElementById("watts").innerHTML = w.toFixed(1);
  document.getElementById("vam").innerHTML = vam;
}

function segmentTime() {
  let wkg = document.getElementById("valw_kg").value || 0;
  let factor_grado = 2 + average_grade / 10;
  w = parseFloat(wkg) * weight;
  let timeminutes =
    wkg > 0 ? (parseInt(elevation_gain) * 60) / (wkg * factor_grado * 100) : 0;

  let hour = parseInt(timeminutes / 60);
  let minutes = parseInt(timeminutes % 60);
  console.log(timeminutes);

  let vam =
    timeminutes == 0 ? 0 : (elevation_gain / (timeminutes / 60)).toFixed(0);

  document.getElementById("hour").value = hour;
  document.getElementById("minutes").value = minutes;
  document.getElementById("watts").innerHTML = w.toFixed(1);
  document.getElementById("vam").innerHTML = vam;
}

function secondsToString(seconds) {
  var hour = Math.floor(seconds / 3600);
  hour = hour < 10 ? "0" + hour : hour;
  var minute = Math.floor((seconds / 60) % 60);
  minute = minute < 10 ? "0" + minute : minute;
  var second = seconds % 60;
  second = second < 10 ? "0" + second : second;
  return hour + ":" + minute + ":" + second;
}

/* ============================================================
   GUARDAR RESULTADOS — se almacenan en localStorage para que
   la página resultados.html los liste e interactúe con ellos.
   No requiere backend ni base de datos.
   ============================================================ */
const RESULTS_STORAGE_KEY = "segmentos_resultados";

function guardarResultadoActual() {
  if (!currentSegment) return;

  const hour = parseInt(document.getElementById("hour").value) || 0;
  const minutes = parseInt(document.getElementById("minutes").value) || 0;
  const w_kg = document.getElementById("valw_kg").value || "";
  const watts = document.getElementById("watts").innerText || "";
  const vam = document.getElementById("vam").innerText || "";

  const resultado = {
    uid: `${currentSegment.id}_${Date.now()}`,
    segmentId: currentSegment.id,
    segmentName: currentSegment.name,
    distance: currentSegment.distance,
    average_grade: currentSegment.average_grade,
    elevation_gain: currentSegment.elevation_gain,
    pr: currentSegment.pr,
    pr_date: currentSegment.pr_date,
    targetTime: `${hour}h ${minutes}m`,
    w_kg: w_kg,
    watts: watts,
    vam: vam,
    weight: weight,
    savedAt: new Date().toISOString(),
  };

  let lista = [];
  try {
    lista = JSON.parse(localStorage.getItem(RESULTS_STORAGE_KEY)) || [];
  } catch (e) {
    lista = [];
  }
  lista.unshift(resultado);
  localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(lista));

  let guardadoMsg = document.getElementById("guardadoMsg");
  if (guardadoMsg) guardadoMsg.style.display = "block";
}

document.addEventListener("DOMContentLoaded", function () {
  let btnGuardar = document.getElementById("btnGuardarResultado");
  if (btnGuardar) {
    btnGuardar.addEventListener("click", guardarResultadoActual);
  }
});

/* ============================================================
   PERFIL DE ELEVACIÓN INTERACTIVO
   Pide a Strava los streams reales de distancia/altitud del
   segmento y dibuja un SVG con tooltip al pasar el mouse,
   coloreado según la pendiente local (más naranja = más empinado).
   Si la API no devuelve streams (segmento privado, sin permiso,
   error, etc.) se cae de vuelta a la imagen estática de Strava.
   ============================================================ */

async function cargarPerfilElevacion(id) {
  const chartContainer = document.getElementById("elevationChart");
  const imgFallback = document.getElementById("profile");
  if (!chartContainer) return;

  chartContainer.innerHTML = '<div class="elevation-loading">Cargando perfil de elevación…</div>';

  try {
    const response = await fetch(`/api/segmentStreams?id=${id}`);
    if (!response.ok) throw new Error("streams no disponibles");
    const data = await response.json();

    const distances = data.distance && data.distance.data;
    const altitudes = data.altitude && data.altitude.data;

    if (!distances || !altitudes || distances.length < 2) {
      throw new Error("streams vacíos");
    }

    renderElevationChart(chartContainer, distances, altitudes);
    imgFallback.style.display = "none";
  } catch (error) {
    console.warn("No se pudo cargar el perfil interactivo, usando imagen estática:", error);
    chartContainer.innerHTML = "";
    imgFallback.style.display = "block";
  }
}

function renderElevationChart(container, distances, altitudes) {
  const width = 600;
  const height = 220;
  const padding = { top: 14, right: 10, bottom: 24, left: 10 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const maxDist = distances[distances.length - 1];
  const minAlt = Math.min(...altitudes);
  const maxAlt = Math.max(...altitudes);
  const altRange = maxAlt - minAlt || 1;

  // Grado de inclinación en cada punto (diferencia central), solo para
  // colorear el trazo y mostrarlo en el tooltip — el alto del gráfico
  // siempre representa la altitud real, para que se vea el perfil de
  // la subida tal cual es (no un electrocardiograma de pendientes).
  const grades = distances.map((d, i) => {
    const prevIdx = Math.max(0, i - 1);
    const nextIdx = Math.min(distances.length - 1, i + 1);
    const dDist = distances[nextIdx] - distances[prevIdx];
    const dAlt = altitudes[nextIdx] - altitudes[prevIdx];
    return dDist > 0 ? (dAlt / dDist) * 100 : 0;
  });

  const toX = (d) => padding.left + (d / maxDist) * plotWidth;
  const toY = (a) => padding.top + plotHeight - ((a - minAlt) / altRange) * plotHeight;

  // Construir el path de la línea y calcular el color de cada tramo según la pendiente local
  let areaLinePoints = "";
  let segmentsHtml = "";
  for (let i = 0; i < distances.length; i++) {
    const x = toX(distances[i]);
    const y = toY(altitudes[i]);
    areaLinePoints += `${x.toFixed(2)},${y.toFixed(2)} `;

    if (i > 0) {
      const x0 = toX(distances[i - 1]);
      const y0 = toY(altitudes[i - 1]);
      const color = gradeToColor(grades[i]);
      segmentsHtml += `<line x1="${x0.toFixed(2)}" y1="${y0.toFixed(2)}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="${color}" stroke-width="2.5" stroke-linecap="round" />`;
    }
  }

  const areaPoints = `${toX(distances[0]).toFixed(2)},${(padding.top + plotHeight).toFixed(2)} ${areaLinePoints} ${toX(maxDist).toFixed(2)},${(padding.top + plotHeight).toFixed(2)}`;

  const svg = `
    <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="elevFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fc4c02" stop-opacity="0.32" />
          <stop offset="100%" stop-color="#fc4c02" stop-opacity="0" />
        </linearGradient>
      </defs>
      <polygon points="${areaPoints}" fill="url(#elevFill)" />
      ${segmentsHtml}
      <line id="evCrosshair" x1="0" y1="${padding.top}" x2="0" y2="${padding.top + plotHeight}" stroke="#8d93a1" stroke-width="1" stroke-dasharray="3,3" opacity="0" />
      <circle id="evDot" r="4" fill="#ffb23f" stroke="#14161b" stroke-width="1.5" opacity="0" />
      <rect id="evCapture" x="${padding.left}" y="0" width="${plotWidth}" height="${height}" fill="transparent" style="cursor:crosshair;" />
      <text x="${padding.left}" y="${height - 6}" font-family="JetBrains Mono, monospace" font-size="10" fill="#8d93a1">0 km</text>
      <text x="${width - padding.right}" y="${height - 6}" font-family="JetBrains Mono, monospace" font-size="10" fill="#8d93a1" text-anchor="end">${(maxDist / 1000).toFixed(2)} km</text>
    </svg>
    <div class="elevation-tooltip" id="evTooltip">
      <span class="tt-dist"></span> · <span class="tt-elev"></span>
    </div>
  `;

  container.innerHTML = svg;

  const capture = container.querySelector("#evCapture");
  const crosshair = container.querySelector("#evCrosshair");
  const dot = container.querySelector("#evDot");
  const tooltip = container.querySelector("#evTooltip");
  const svgEl = container.querySelector("svg");

  function handleMove(clientX) {
    const rect = svgEl.getBoundingClientRect();
    const scale = width / rect.width;
    const xInViewbox = (clientX - rect.left) * scale;
    const ratio = Math.min(1, Math.max(0, (xInViewbox - padding.left) / plotWidth));
    const targetDist = ratio * maxDist;

    // Encontrar el punto más cercano en el stream de distancias
    let closestIdx = 0;
    let closestDiff = Infinity;
    for (let i = 0; i < distances.length; i++) {
      const diff = Math.abs(distances[i] - targetDist);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIdx = i;
      }
    }

    const x = toX(distances[closestIdx]);
    const y = toY(altitudes[closestIdx]);

    crosshair.setAttribute("x1", x.toFixed(2));
    crosshair.setAttribute("x2", x.toFixed(2));
    crosshair.setAttribute("opacity", "1");
    dot.setAttribute("cx", x.toFixed(2));
    dot.setAttribute("cy", y.toFixed(2));
    dot.setAttribute("opacity", "1");

    tooltip.classList.add("visible");
    tooltip.style.left = `${(x / width) * 100}%`;
    tooltip.style.top = `${(y / height) * 100}%`;
    tooltip.querySelector(".tt-dist").textContent = `${(distances[closestIdx] / 1000).toFixed(2)} km`;
    tooltip.querySelector(".tt-elev").textContent = `${grades[closestIdx].toFixed(1)}%`;
  }

  capture.addEventListener("mousemove", (e) => handleMove(e.clientX));
  capture.addEventListener("touchmove", (e) => {
    if (e.touches && e.touches[0]) handleMove(e.touches[0].clientX);
  });
  capture.addEventListener("mouseleave", () => {
    crosshair.setAttribute("opacity", "0");
    dot.setAttribute("opacity", "0");
    tooltip.classList.remove("visible");
  });
}

// Asigna un color entre ámbar (llano) y naranja intenso (empinado) según la pendiente local
function gradeToColor(grade) {
  const abs = Math.min(Math.abs(grade), 15); // tope visual en 15%
  const t = abs / 15;
  // interpolar entre #ffb23f (ámbar, llano) y #fc4c02 (naranja, empinado)
  const c1 = [255, 178, 63];
  const c2 = [252, 76, 2];
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  return `rgb(${r},${g},${b})`;
}
