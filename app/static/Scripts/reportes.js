
(function () {
if (typeof eventosOriginales === 'undefined') {
  var eventosOriginales = [];
}


function iniciarCargaTabla() {
  const tabla = document.querySelector('#tablaEventos tbody');
  if (!tabla) {
    console.warn("⏳ Esperando tabla...");
    setTimeout(iniciarCargaTabla, 300);
    return;
  }

  cargarEventos();
}

async function obtenerEventosDesdeAPI() {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/citas", {
      method: "GET",
      credentials: "include"
    });

    if (!response.ok) throw new Error("Error al obtener citas");

    function ajustarUTC5(fechaStr) {
      const fecha = new Date(fechaStr);
      fecha.setHours(fecha.getHours() + 5);
      return fecha.toISOString();
    }

    const datosCrudos = await response.json();
    eventosOriginales = datosCrudos.map(cita => ({
      id: cita.id_cita,
      nombre: cita.nombre_solicitante,
      notas: cita.notas,
      title: `${cita.nombre_solicitante || 'Sin nombre'} - ${cita.notas || 'Sin notas'}`,
      start: ajustarUTC5(cita.fecha_hora_inicio),
      end: ajustarUTC5(cita.fecha_hora_fin),
      allDay: false,
      description: cita.notas || '',
      classNames: cita.estado === 'Pendiente' ? 'evento-pendiente' : '',
    }));

    return eventosOriginales;
  } catch (error) {
    console.error("❌ Error al obtener eventos desde la API:", error);
    return [];
  }
}
let uiInicializada = false;
async function cargarEventos() {
  try {
    const eventos = await obtenerEventosDesdeAPI();

    if (!Array.isArray(eventos) || eventos.length === 0) {
      console.warn('⚠️ No hay eventos disponibles desde la API');
      mostrarMensajeSinEventos();
      return;
    }

    eventosOriginales = eventos.sort((a, b) => new Date(a.start) - new Date(b.start));
    aplicarFiltros();

    // ✅ Solo inicializar UI una vez
    if (!uiInicializada) {
      initReportesUI();
      uiInicializada = true;
    }

  } catch (error) {
    console.error('❌ Error al obtener eventos desde la API:', error);
    mostrarErrorCargaEventos(error);
  }
}

function aplicarFiltros() {
    
    const texto = document.getElementById('filtroEventos').value.trim().toLowerCase();
    const fechaInicioStr = document.getElementById('fechaInicioFiltro').value;
    const fechaFinStr = document.getElementById('fechaFinFiltro').value;
  
    const fechaInicio = fechaInicioStr ? new Date(fechaInicioStr) : null;
    const fechaFin = fechaFinStr ? new Date(fechaFinStr) : null;
  
    const eventosFiltrados = eventosOriginales.filter(evento => {
      const nombre = evento.nombre?.toLowerCase() || '';
      const notas = evento.notas?.toLowerCase() || '';
      const descripcion = evento.description?.toLowerCase() || '';
      const titulo = evento.title?.toLowerCase() || '';
  
      const textoIncluido = 
        nombre.includes(texto) ||
        notas.includes(texto) ||
        descripcion.includes(texto) ||
        titulo.includes(texto);
  
      const fechaEvento = new Date(evento.start);
      const cumpleDesde = !fechaInicio || fechaEvento >= fechaInicio;
      const cumpleHasta = !fechaFin || fechaEvento <= fechaFin;
  
      return textoIncluido && cumpleDesde && cumpleHasta;
    });
  
    if (eventosFiltrados.length === 0) {
      mostrarMensajeSinEventos();
    } else {
      actualizarTablaEventos(eventosFiltrados);
    }


  }
  

function mostrarMensajeSinEventos() {
  const tablaBody = document.querySelector('#tablaEventos tbody');
  if (!tablaBody) return;

  tablaBody.innerHTML = `
    <tr>
      <td colspan="6" class="text-center text-muted">No hay eventos registrados.</td>
    </tr>
  `;
}

function mostrarErrorCargaEventos(error) {
  const tablaBody = document.querySelector('#tablaEventos tbody');
  if (!tablaBody) return;

  tablaBody.innerHTML = `
    <tr>
      <td colspan="6" class="text-center text-danger">
        Error al cargar eventos: ${error.message}
      </td>
    </tr>
  `;
}

function formatoFecha(fechaISO) {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString('es-EC');
}

function formatoHora(fechaISO) {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function actualizarTablaEventos(eventos) {
  const tablaBody = document.querySelector('#tablaEventos tbody');
  if (!tablaBody) {
    console.error('❌ No se encontró el tbody de la tabla.');
    return;
  }

  tablaBody.innerHTML = '';

  if (eventos.length === 0) {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">No hay eventos registrados.</td>
      </tr>
    `;
    return;
  }

  eventos.forEach(evento => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${evento.nombre || 'Sin nombre'} - ${evento.notas || 'Sin notas'}</td>
      <td>${evento.start ? formatoFecha(evento.start) : 'Sin fecha'}</td>
      <td>${evento.start ? formatoHora(evento.start) : 'Sin hora'}</td>
      <td>${evento.end ? formatoFecha(evento.end) : 'Sin fecha'}</td>
      <td>${evento.end ? formatoHora(evento.end) : 'Sin hora'}</td>
      <td>${evento.description || 'Sin descripción'}</td>
    `;
    tablaBody.appendChild(fila);
  });

}

function initReportesUI() {

  const filtroTexto = document.getElementById('filtroEventos');
  const btnBuscar = document.getElementById('btnBuscar');
  const filtroFechaInicio = document.getElementById('fechaInicioFiltro');
  const filtroFechaFin = document.getElementById('fechaFinFiltro');
  const btnLimpiarFiltros = document.getElementById('limpiarFiltros');

  // ✅ Validación básica
  if (!filtroTexto || !btnBuscar) {
    console.error("❌ No se encontró el input o el botón de búsqueda.");
    return;
  }

  // ✅ Reemplazar cualquier listener previo usando `.oninput =`, `.onclick =`, etc.
  btnBuscar.onclick = aplicarFiltros;
  filtroTexto.onkeydown = (e) => {
    if (e.key === 'Enter') aplicarFiltros();
  };
  filtroTexto.oninput = aplicarFiltros;
  filtroFechaInicio.onchange = aplicarFiltros;
  filtroFechaFin.onchange = aplicarFiltros;
  btnLimpiarFiltros.onclick = () => {
    filtroTexto.value = '';
    filtroFechaInicio.value = '';
    filtroFechaFin.value = '';
    aplicarFiltros();
  };

  // ✅ Esperamos que exista la tabla antes de cargar
  const tabla = document.querySelector('#tablaEventos tbody');
  if (tabla) {
    cargarEventos(); // evita usar setInterval, ya es confiable aquí
  } else {
    console.warn("⏳ Esperando tabla...");
    setTimeout(initReportesUI, 300); // reintenta la inicialización
  }
}

  
window.initReportesUI = initReportesUI;
window.cargarEventos = cargarEventos;
window.actualizarTablaEventos = actualizarTablaEventos;
})();