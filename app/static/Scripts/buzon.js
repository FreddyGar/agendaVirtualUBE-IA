// Datos simulados de prueba
const solicitudesPrueba = [
    {
      id: 1,
      solicitante: 'Juan Pérez',
      titulo: 'Defensa de Tesis',
      fecha: '2025-03-25',
      hora: '10:00',
      estado: 'Pendiente'
    },
    {
      id: 2,
      solicitante: 'María López',
      titulo: 'Reunión Comité Académico',
      fecha: '2025-03-28',
      hora: '15:00',
      estado: 'Pendiente'
    }
  ];
  
  // Mostrar solicitudes
  function mostrarSolicitudesBuzon() {
    const contenedor = document.getElementById('buzonSolicitudes');
    
    if (!contenedor) {
      console.error('❌ No se encontró el contenedor #buzonSolicitudes');
      return;
    }
  
    contenedor.innerHTML = ''; // Limpiar antes de renderizar
  
    solicitudesPrueba.forEach((solicitud) => {
      const card = document.createElement('div');
      card.className = 'card shadow-sm';
      
      card.innerHTML = `
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong>🗂️ ${solicitud.titulo}</strong>
          <span class="badge ${estadoBadgeColor(solicitud.estado)}">${solicitud.estado}</span>
        </div>
        <div class="card-body">
          <p><strong>Solicitante:</strong> ${solicitud.solicitante}</p>
          <p><strong>Fecha Propuesta:</strong> ${solicitud.fecha}</p>
          <p><strong>Hora Propuesta:</strong> ${solicitud.hora}</p>
          <div class="d-flex gap-2">
            <button class="btn btn-success btn-sm" onclick="aceptarSolicitud(${solicitud.id})" ${solicitud.estado !== 'Pendiente' ? 'disabled' : ''}>✅ Aceptar</button>
            <button class="btn btn-danger btn-sm" onclick="rechazarSolicitud(${solicitud.id})" ${solicitud.estado !== 'Pendiente' ? 'disabled' : ''}>❌ Rechazar</button>
          </div>
        </div>
      `;
  
      contenedor.appendChild(card);
    });
  }
  
  function aceptarSolicitud(id) {
    const solicitud = solicitudesPrueba.find(s => s.id === id);
    if (!solicitud) return;
  
    solicitud.estado = 'Aceptada';
    alert(`✅ Aceptada: "${solicitud.titulo}"`);
    mostrarSolicitudesBuzon();
  }
  
  function rechazarSolicitud(id) {
    const solicitud = solicitudesPrueba.find(s => s.id === id);
    if (!solicitud) return;
  
    solicitud.estado = 'Rechazada';
    alert(`❌ Rechazada: "${solicitud.titulo}"`);
    mostrarSolicitudesBuzon();
  }
  
  function estadoBadgeColor(estado) {
    switch (estado) {
      case 'Pendiente': return 'bg-warning text-dark';
      case 'Aceptada': return 'bg-success';
      case 'Rechazada': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }
  
  // Ejecutar cuando el DOM esté cargado
  document.addEventListener('DOMContentLoaded', mostrarSolicitudesBuzon);
  