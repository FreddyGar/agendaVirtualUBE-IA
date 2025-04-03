document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM cargado ✅');

    // Espera a que la tabla esté lista antes de ejecutar cargarEventos()
    const checkTableInterval = setInterval(() => {
        if (document.querySelector('#tablaEventos tbody')) {
            clearInterval(checkTableInterval);
            console.log("✅ Tabla encontrada. Ejecutando cargarEventos...");
            cargarEventos();
        }
    }, 300); // Se verifica cada 300ms hasta que la tabla esté disponible
});


async function cargarEventos() {
    console.log("🔄 Ejecutando cargarEventos...");
  
    try {
      const eventos = await obtenerEventosDesdeAPI();
  
      if (!Array.isArray(eventos) || eventos.length === 0) {
        console.warn('⚠️ No hay eventos disponibles desde la API');
        mostrarMensajeSinEventos();
        return;
      }
  
      eventos.sort((a, b) => new Date(a.start) - new Date(b.start));
      actualizarTablaEventos(eventos);
  
    } catch (error) {
      console.error('❌ Error al obtener eventos desde la API:', error);
      mostrarErrorCargaEventos(error);
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

function obtenerEventosDeEjemplo() {
    return [
        {
            id: '1',
            title: 'Tutoría con Matemáticas',
            start: '2025-03-20T09:00:00',
            end: '2025-03-20T10:00:00',
            description: 'Resolución de ejercicios prácticos y dudas de cálculo diferencial.',
            allDay: false,
            backgroundColor: '#007bff',
            borderColor: '#17a2b8'
        },
        {
            id: '2',
            title: 'Asesoría de Tesis - Juan Pérez',
            start: '2025-03-20T10:30:00',
            end: '2025-03-20T12:00:00',
            description: 'Revisión del avance del capítulo 3 de la tesis.',
            allDay: false,
            backgroundColor: '#28a745',
            borderColor: '#28a745'
        },
        {
            id: '3',
            title: 'Defensa de Proyecto de Grado',
            start: '2025-03-22T14:00:00',
            end: '2025-03-22T15:30:00',
            description: 'Presentación de resultados y evaluación por el tribunal.',
            allDay: false,
            backgroundColor: '#dc3545',
            borderColor: '#dc3545'
        },
        {
            id: '4',
            title: 'Evaluación de Inglés',
            start: '2025-03-25T08:00:00',
            end: '2025-03-25T10:00:00',
            description: 'Examen final de comprensión lectora y producción escrita.',
            allDay: false,
            backgroundColor: '#ffc107',
            borderColor: '#ffc107'
        },
        {
            id: '5',
            title: 'Taller de Investigación',
            start: '2025-03-26',
            description: 'Capacitación en metodologías de investigación científica.',
            allDay: true,
            backgroundColor: '#17a2b8',
            borderColor: '#17a2b8'
        },
        {
            id: '6',
            title: 'Conferencia de Innovación Académica',
            start: '2025-03-28T16:00:00',
            end: '2025-03-28T18:00:00',
            description: 'Estrategias para la enseñanza virtual y herramientas digitales.',
            allDay: false,
            backgroundColor: '#6f42c1',
            borderColor: '#6f42c1'
        }
    ];
}

function actualizarTablaEventos(eventos) {
    const tablaBody = document.querySelector('#tablaEventos tbody');
    if (!tablaBody) {
        console.error('❌ No se encontró el tbody de la tabla. Esperando...');
        return;
    }

    tablaBody.innerHTML = '';

    if (eventos.length === 0) {
        const fila = document.createElement('tr');
        fila.innerHTML = `<td colspan="6" class="text-center">No hay eventos registrados.</td>`;
        tablaBody.appendChild(fila);
        return;
    }

    eventos.forEach((evento) => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${evento.title || 'Sin título'}</td>
            <td>${evento.start ? formatoFecha(evento.start) : 'Sin fecha'}</td>
            <td>${evento.start ? formatoHora(evento.start) : 'Sin hora'}</td>
            <td>${evento.end ? formatoFecha(evento.end) : 'Sin fecha'}</td>
            <td>${evento.end ? formatoHora(evento.end) : 'Sin hora'}</td>
            <td>${evento.description || 'Sin descripción'}</td>
        `;
        tablaBody.appendChild(fila);
    });

    console.log("✅ Tabla de eventos actualizada.");
}

window.cargarEventos = cargarEventos;
window.actualizarTablaEventos = actualizarTablaEventos;
