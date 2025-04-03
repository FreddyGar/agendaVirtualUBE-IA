(function () {
  if (typeof calendar === 'undefined') {
    var calendar;
  }

  let eventoSeleccionado = null;

  async function obtenerEventosDesdeAPI() {
    try {
      console.log("🔄 Obteniendo eventos desde la API...");
      const response = await fetch("http://127.0.0.1:8000/api/citas", {
        method: "GET",
        credentials: "include"
      });

      if (!response.ok) throw new Error("Error al obtener citas");

      // Ajuste manual a UTC-5
      function ajustarUTC5(fechaStr) {
        const fecha = new Date(fechaStr);
        fecha.setHours(fecha.getHours() + 5); // Invertimos el -5 que hizo toISOString
        return fecha.toISOString();
      }

      const eventosOriginales = await response.json();
      const eventos = eventosOriginales.map(cita => ({
        id: cita.id_cita,
        title: `${cita.nombre_solicitante || 'Sin nombre'} - ${cita.notas || 'Sin notas'}`,
        start: ajustarUTC5(cita.fecha_hora_inicio),
        end: ajustarUTC5(cita.fecha_hora_fin),
        allDay: false,
        description: cita.notas || '',
        classNames: cita.estado === 'Pendiente' ? 'evento-pendiente' : '',
        extendedProps: {
          id_cita: cita.id_cita,
          estado: cita.estado,
          email: cita.email_solicitante,
          nombre: cita.nombre_solicitante,
          cedula: cita.cedula_solicitante,
          notas: cita.notas,
          id_modalidad: cita.id_modalidad,
          id_responsable: cita.id_responsable,
          id_solicitante: cita.id_solicitante,
          id_tipo_cita: cita.id_tipo_cita
        }
      }));
      
      

      console.log("🟢 Eventos formateados para FullCalendar:", eventos);
      return eventos;
    } catch (error) {
      console.error("❌ Error al obtener eventos desde la API:", error);
      return [];
    }
  }

  function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      locale: 'es',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth,refresh',
      },
      customButtons: {
        refresh: {
          text: '🔄',
          click: function () {
            if (calendar) {
              calendar.refetchEvents();
              alert("🔄 Eventos actualizados");
            }
          }
        }
      },
      
      dayMaxEventRows: 3, // 👈 Esto activa el popover agrupa de 3
      nowIndicator: true, // 👈 Línea roja de hora actual del tiempo 
      businessHours: [        // Horarios laborales personalizados
        {
          daysOfWeek: [1, 2, 3, 4, 5], // Lunes a viernes
          startTime: '07:00',
          endTime: '18:00'
        },
        {
          daysOfWeek: [6],             // Sábados
          startTime: '07:00',
          endTime: '18:00'
        },
        {
          daysOfWeek: [0],             // Domingos
          startTime: '07:00',
          endTime: '18:00'
        }
      ],
      selectConstraint: "businessHours",   // (opcional) solo permite seleccionar en horario laboral
      eventConstraint: "businessHours",    // (opcional) solo permite mover eventos en horario laboral

      events: async function (fetchInfo, successCallback, failureCallback) {
        try {
          const eventos = await obtenerEventosDesdeAPI();
          console.log("✅ successCallback ejecutado con", eventos.length, "eventos");
          successCallback(eventos);
        } catch (error) {
          console.error("❌ Error al cargar eventos:", error);
          failureCallback(error);
        }
      },
      editable: true,
      eventStartEditable: true,
      eventDurationEditable: true,
      selectable: true,
      selectMirror: true, // opcional para mejor UX

      // 🆕 Agregado: seleccionar rango en vista semanal/diaria
      select: function (info) {
        if (info.view.type === 'timeGridWeek' || info.view.type === 'timeGridDay') {
          abrirModalCrear(info.startStr, info.endStr);
          calendar.unselect(); // limpia la selección
        }
      },

      dateClick: function (info) {
        abrirModalCrear(info.dateStr, null);
      },
      
      eventClick: function (info) {
        abrirModalEditar(info.event);
      },
      eventDrop: function (info) {
        console.log("📦 Evento movido:", info.event);
        actualizarEventoDesdeDragResize(info.event);
      },
      
      eventResize: function (info) {
        console.log("📏 Evento redimensionado:", info.event);
        actualizarEventoDesdeDragResize(info.event);
      },

      // 🔽 Aquí se activa el tooltip
      eventDidMount: function (info) {
        const event = info.event;
        const titulo = event.title || 'Sin título';
        const descripcion = event.extendedProps.description || 'Sin descripción';
        const allDay = event.allDay;
      
        let horaInicio = '';
        let horaFin = '';
      
        if (event.start) {
          const startDate = new Date(event.start);
          horaInicio = startDate.getHours().toString().padStart(2, '0') + ':' +
            startDate.getMinutes().toString().padStart(2, '0');
        }
      
        if (event.end) {
          const endDate = new Date(event.end);
          horaFin = endDate.getHours().toString().padStart(2, '0') + ':' +
            endDate.getMinutes().toString().padStart(2, '0');
        }
      
        let tooltip = `${titulo}\n`;
        if (allDay) {
          tooltip += 'Todo el día\n';
        } else {
          tooltip += `Inicio: ${horaInicio}\n`;
          if (horaFin) tooltip += `Fin: ${horaFin}\n`;
        }
        tooltip += `Descripción: ${descripcion}`;
      
        info.el.setAttribute('title', tooltip);
      }
        
    });

    calendar.render();

    const btnGuardar = document.getElementById('guardarEvento');
    if (btnGuardar) {
      btnGuardar.addEventListener('click', guardarEventoEnModal);
    }

    const btnEliminar = document.getElementById('eliminarEvento');
    if (btnEliminar) {
      btnEliminar.addEventListener('click', eliminarEventoEnModal);
    }
  }


  async function actualizarEventoDesdeDragResize(evento) {
    const id = evento.extendedProps.id_cita;
    if (!id) return;

    // Ajuste manual a UTC-5
    function ajustarUTC5(dateObj) {
      const fecha = new Date(dateObj);
      fecha.setHours(fecha.getHours() - 5); // Quito 5 horas para compensar UTC
      return fecha.toISOString().slice(0, 19).replace("T", " ");
    }

    const payload = {
      cedula_solicitante: evento.extendedProps.cedula,
      email_solicitante: evento.extendedProps.email || "",
      estado: evento.extendedProps.estado || "Pendiente",
      fecha_hora_inicio: ajustarUTC5(evento.start),
      fecha_hora_fin: evento.end ? ajustarUTC5(evento.end) : null,
      id_modalidad: 1,
      id_responsable: 2,
      id_solicitante: 1,
      id_tipo_cita: 1,
      nombre_solicitante: evento.extendedProps.nombre || evento.title,
      notas: evento.extendedProps.description || ""
    };

    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/citas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include"
      });

      if (!resp.ok) throw new Error("Error al actualizar evento con drag/resize");
      console.log("✅ Evento actualizado exitosamente");
    } catch (error) {
      console.error("❌ Error al actualizar evento:", error);
      alert("No se pudo actualizar el evento");
    }
  }



  async function guardarEventoEnModal() {
    const btnGuardar = document.getElementById('guardarEvento');
    if (btnGuardar) btnGuardar.disabled = true; // 🚫 Desactiva el botón mientras se guarda

    const titulo = document.getElementById('tituloEvento').value.trim();
    const fecha = document.getElementById('fechaEvento').value;
    const horaInicio = document.getElementById('horaInicioEvento').value;
    const horaFin = document.getElementById('horaFinEvento').value;
    const descripcion = document.getElementById('descripcionEvento').value.trim();
    const email = document.getElementById('emailEvento').value.trim();
    const estado = document.getElementById('estadoEvento').value;
    const modalidad = document.getElementById('modalidadEvento').value; // ✅ ID de modalidad
    const modalidadTexto = document.getElementById('modalidadEvento')
      .options[document.getElementById('modalidadEvento').selectedIndex].text; // ✅ Texto visible

    if (!titulo || !fecha || !horaInicio || !horaFin || !email) {
      alert('Completa todos los campos');
      if (btnGuardar) btnGuardar.disabled = false; // 🔓 Reactiva si falta info
      return;
    }

    const inicio = `${fecha} ${horaInicio}:00`;
    const fin = `${fecha} ${horaFin}:00`;

    // 🔒 Validación contra fecha/hora actual
    const ahora = new Date();
    const fechaHoraInicio = new Date(inicio);

    if (fechaHoraInicio < ahora) {
      alert("⛔ No puedes crear eventos en el pasado.");
      if (btnGuardar) btnGuardar.disabled = false;
      return;
    }


    const eventoData = {
      cedula_solicitante: "0102030405",
      email_solicitante: email,
      estado: estado,
      fecha_hora_inicio: inicio,
      fecha_hora_fin: fin,
      id_modalidad: parseInt(modalidad), // ✅ ID de modalidad
      id_responsable: 2,
      id_solicitante: 1,
      id_tipo_cita: 1,
      nombre_solicitante: titulo,
      notas: descripcion
    };

    const metodo = eventoSeleccionado ? "PUT" : "POST";
    const url = eventoSeleccionado
      ? `http://127.0.0.1:8000/api/citas/${eventoSeleccionado.extendedProps.id_cita}`
      : "http://127.0.0.1:8000/api/citas";

    try {
      const resp = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(eventoData)
      });

      if (!resp.ok) throw new Error("Error al guardar evento en la API");

      alert("✅ Evento guardado correctamente");
      cerrarModal();
      calendar.refetchEvents();

      // 👇 Nueva lógica para preguntar si deseas enviar notificación
      const deseaNotificar = confirm("¿Deseas enviar una notificación por correo al solicitante?");
      if (deseaNotificar) {
        const subject = `🗓️ Recordatorio: Cita agendada para ${titulo} el ${fecha} a las ${horaInicio}`;
        const body = `
          Estimado@ participante,

          Se confirma que tienes una cita agendada como "${titulo}" el día ${fecha} desde las ${horaInicio} hasta las ${horaFin || "hora no especificada"}.

          📝 Modalidad: ${modalidadTexto}

          Por favor, guarda esta información y preséntate puntualmente. Si tienes dudas o necesitas reprogramar, contáctanos con anticipación.

          Saludos,
          Virectorado Académico  
          UNIVERSIDAD BOLIVARIANA DEL ECUADOR UBE
        `.trim();

        const payload = {
          to: email,
          subject,
          body
        };

        try {
          const response = await fetch("http://127.0.0.1:8000/api/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (!response.ok) throw new Error("Error al enviar el correo");
          alert("📧 Correo enviado correctamente.");
        } catch (error) {
          console.error("❌ Error al enviar correo:", error);
          alert("Ocurrió un error al enviar el correo.");
        }
      }

    } catch (error) {
      console.error("❌ Error al guardar evento:", error);
      alert("Ocurrió un error al guardar el evento");

    } finally {
      if (btnGuardar) btnGuardar.disabled = false; // 🔓 Reactiva al final, pase lo que pase
    }
  }




  async function eliminarEventoEnModal() {
    if (!eventoSeleccionado || !eventoSeleccionado.extendedProps.id_cita) {
      alert("⚠️ No hay un evento seleccionado o no tiene ID válido.");
      return;
    }

    // 🔐 Verificar si el estado del evento es Pendiente
    const estado = eventoSeleccionado.extendedProps.estado;
    if (estado !== "Pendiente") {
      alert("❌ Solo se pueden eliminar eventos con estado 'Pendiente'.");
      return;
    }

    const confirmacion = confirm("¿Estás seguro de que deseas eliminar este evento?");
    if (!confirmacion) return;

    const id = eventoSeleccionado.extendedProps.id_cita;

    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/citas/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!resp.ok) throw new Error("No se pudo eliminar el evento");

      alert("✅ Evento eliminado correctamente");
      cerrarModal();
      calendar.refetchEvents();
    } catch (error) {
      console.error("❌ Error al eliminar evento:", error);
      alert("Ocurrió un error al intentar eliminar el evento.");
    }
  }



  function cerrarModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById("eventoModal"));
    if (modal) modal.hide();
    document.getElementById("formEvento").reset();
    eventoSeleccionado = null;
  }

  function actualizarEventosEnCalendario() {
    if (!calendar) return;
    obtenerEventosDesdeAPI().then(eventos => {
      calendar.refetchEvents(); // ✅ recarga desde el backend sin duplicar

      // calendar.getEvents().forEach(event => event.remove());
      // eventos.forEach(evento => calendar.addEvent(evento));
    });
  }

  function abrirModalCrear(fechaInicio, fechaFin = null) {
    eventoSeleccionado = null;
    document.getElementById("formEvento").reset();
    document.getElementById('eventoModalLabel').textContent = 'Nuevo Evento';
    document.getElementById('estadoEvento').value = 'Pendiente';
    document.getElementById('eliminarEvento').classList.add('d-none');

    // 👇 Extraemos fecha y horas si se incluyen
    const fechaObj = new Date(fechaInicio);
    const fecha = fechaObj.toISOString().split('T')[0];
    const horaInicio = fechaInicio.includes('T') ? fechaObj.toTimeString().slice(0, 5) : '';

    let horaFin = '';
    if (fechaFin) {
      const finObj = new Date(fechaFin);
      horaFin = finObj.toTimeString().slice(0, 5);
    }

    // 👇 Llenamos los campos del formulario
    document.getElementById('fechaEvento').value = fecha;
    document.getElementById('horaInicioEvento').value = horaInicio;
    document.getElementById('horaFinEvento').value = horaFin;

    const modalElement = document.getElementById('eventoModal');
    let modal = bootstrap.Modal.getInstance(modalElement);
    if (!modal) {
      modal = new bootstrap.Modal(modalElement);
    }

    // ✅ Limpia la selección del calendario al cerrar el modal (X o cancelar)
    const limpiarAlCerrar = () => {
      if (calendar) calendar.unselect();
      modalElement.removeEventListener('hidden.bs.modal', limpiarAlCerrar);
    };
    modalElement.addEventListener('hidden.bs.modal', limpiarAlCerrar);

    modal.show();

    // ✅ Limpia también la selección justo al mostrar (por si se usó select en week/day)
    if (calendar) {
      calendar.unselect();
    }

    const btnEnviarCorreo = document.getElementById('enviarCorreo');
    if (btnEnviarCorreo) {
      btnEnviarCorreo.onclick = async () => {
        const nombre = document.getElementById('tituloEvento').value.trim();
        const fecha = document.getElementById('fechaEvento').value;
        const horaInicio = document.getElementById('horaInicioEvento').value;
        const horaFin = document.getElementById('horaFinEvento').value;
        const email = document.getElementById('emailEvento').value.trim();

        if (!email || !nombre || !fecha || !horaInicio) {
          return alert("Completa todos los campos para enviar el correo.");
        }

        const subject = `🗓️ Recordatorio: Cita agendada para ${nombre} el ${fecha} a las ${horaInicio}`;
        const body = `
          Estimado@ participante,

          Se confirma que tienes una cita ${nombre} agendada el día ${fecha} desde las ${horaInicio} hasta las ${horaFin || "hora no especificada"}.

          Por favor, guarda esta información y preséntate puntualmente. Si tienes dudas o necesitas reprogramar, contáctanos con anticipación.

          Saludos,
          Virectorado Academico 
          UNIVERSIDAD BOLIVARIANA DEL ECUADOR UBE
        `.trim();

        const payload = {
          to: email,
          subject,
          body
        };

        try {
          const response = await fetch("http://127.0.0.1:8000/api/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (!response.ok) throw new Error("Error al enviar el correo");
          alert("✅ Correo enviado correctamente.");
        } catch (error) {
          console.error("❌ Error al enviar correo:", error);
          alert("Ocurrió un error al enviar el correo.");
        }
      };
    }
  }




  const btnAnalizar = document.querySelector('[data-bs-target="#analizaModal"]');

  if (btnAnalizar) {
    btnAnalizar.addEventListener('click', () => {
      console.log("🔍 Botón 'Analiza agenda' clickeado. Ejecutando análisis...");
      setTimeout(hacerAnalisisAgenda, 500); // delay para esperar a que se muestre el modal
    });
  }


    window.onload = () => {
      const analizaModal = document.getElementById('analizaModal');
      if (analizaModal) {
        console.log("✅ Modal encontrado");
        analizaModal.addEventListener('shown.bs.modal', () => {
          console.log("📊 Modal de análisis abierto. Ejecutando análisis...");
          hacerAnalisisAgenda();
        });
      } else {
        console.warn("❌ No se encontró el modal 'analizaModal'");
      }
    };
    
    function formatDateTime(isoString) {
      if (!isoString) return "Fecha no disponible";
    
      const fecha = new Date(isoString);
      const opcionesFecha = {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
        hour12: false
      };
      return fecha.toLocaleString('es-EC', opcionesFecha).replace(',', '');
    }
    
    
    /****************Anlizar Agenda*************** */
    async function hacerAnalisisAgenda() {
      let eventos = calendar.getEvents().map(evento => ({
        id: evento.id,
        title: evento.title,
        start: evento.start.toISOString(),
        end: evento.end ? evento.end.toISOString() : null,
        allDay: evento.allDay,
        description: evento.extendedProps?.notas || evento.extendedProps?.description || '',
        estado: evento.extendedProps?.estado || 'Pendiente',
        email: evento.extendedProps?.email || '',
        nombre: evento.extendedProps?.nombre || '',
        cedula: evento.extendedProps?.cedula || '',
        id_modalidad: evento.extendedProps?.id_modalidad || 1,
        id_responsable: evento.extendedProps?.id_responsable || 2,
        id_solicitante: evento.extendedProps?.id_solicitante || 1,
        id_tipo_cita: evento.extendedProps?.id_tipo_cita || 1
      }));

      console.log("🧪 Eventos para análisis:", eventos);

      try {
        const resp = await fetch('/analisis/analizarAgenda', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventos })
        });

        if (!resp.ok) {
          throw new Error('Error en la respuesta del servidor');
        }

        const data = await resp.json();
        console.log('Resultado del análisis:', data);

        const resultadoDiv = document.getElementById('analisisResultado');
        if (!resultadoDiv) return;

        resultadoDiv.innerHTML = '';

        if (data.solapados && data.solapados.length > 0) {
          let html = '';

          data.solapados.forEach(s => {
            const eventoMover = s.recomendacion.evento_a_mover;
            const nuevoInicioISO = s.recomendacion.nuevo_inicio;
            const nuevoFinISO = s.recomendacion.nuevo_fin;

            const nuevoInicio = formatDateTime(nuevoInicioISO);
            const nuevoFin = formatDateTime(nuevoFinISO);

            const mensaje = s.recomendacion.mensaje;

            html += `
              <div class="card border-warning mb-3 shadow-sm">
                <div class="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
                  <strong><i class="bi bi-exclamation-triangle-fill me-2"></i> Empalme detectado</strong>
                </div>
                <div class="card-body">
                  <ul class="list-group mb-3">
                    <li class="list-group-item">
                      <strong>Evento 1:</strong> <em>${s.evento1}</em>
                    </li>
                    <li class="list-group-item">
                      <strong>Evento 2:</strong> <em>${s.evento2}</em>
                    </li>
                  </ul>
                  <div class="alert alert-info">
                    <p><strong><i class="bi bi-calendar-check-fill"></i> Recomendación:</strong></p>
                    <p>Mover el evento <strong><em>${eventoMover}</em></strong></p>
                    <p>Nuevo horario sugerido:</p>
                    <div class="d-flex align-items-center gap-2 mb-2">
                      <i class="bi bi-clock-history"></i>
                      <code>${nuevoInicio}</code> - <code>${nuevoFin}</code>
                    </div>
                    <p class="text-muted"><small>${mensaje}</small></p>
                  </div>
                  <div class="d-grid gap-2">
                    <button class="btn btn-primary btn-sm" onclick="moverEventoRecomendado('${eventoMover}', '${nuevoInicioISO}', '${nuevoFinISO}')">
                      <i class="bi bi-arrow-right-circle-fill me-1"></i> Aplicar sugerencia
                    </button>
                  </div>
                </div>
              </div>
            `;
          });

          resultadoDiv.innerHTML = html;

        } else {
          resultadoDiv.innerHTML = `
            <div class="alert alert-success d-flex align-items-center" role="alert">
              <i class="bi bi-check-circle-fill me-2"></i>
              No se encontraron solapamientos. ¡Agenda OK!
            </div>
          `;
        }

      } catch (error) {
        console.error('Error llamando a /analizar-agenda:', error);

        const resultadoDiv = document.getElementById('analisisResultado');
        if (resultadoDiv) {
          resultadoDiv.innerHTML = `
            <div class="alert alert-danger d-flex align-items-center">
              <i class="bi bi-x-circle-fill me-2"></i>
              Ocurrió un error al analizar la agenda: ${error.message}
            </div>
          `;
        }
      }
    }

  const btnSugerirIA = document.getElementById('btnSugerirIA');
    if (btnSugerirIA) {
      btnSugerirIA.addEventListener('click', sugerirHorarioIA);
    }
  /******* Sugerir Horarios IA - Versión con eventos desde FullCalendar (base de datos) **********/
  async function sugerirHorarioIA() {
    const eventos = calendar.getEvents().map(evento => ({
      id: evento.id,
      title: evento.title,
      start: evento.start.toISOString(),
      end: evento.end ? evento.end.toISOString() : null,
      allDay: evento.allDay,
      description: evento.extendedProps?.notas || evento.extendedProps?.description || '',
      estado: evento.extendedProps?.estado || 'Pendiente',
      email: evento.extendedProps?.email || '',
      nombre: evento.extendedProps?.nombre || '',
      cedula: evento.extendedProps?.cedula || '',
      id_modalidad: evento.extendedProps?.id_modalidad || 1,
      id_responsable: evento.extendedProps?.id_responsable || 2,
      id_solicitante: evento.extendedProps?.id_solicitante || 1,
      id_tipo_cita: evento.extendedProps?.id_tipo_cita || 1
    }));

    try {
      const resp = await fetch('/ia/sugerencia-horario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventos })
      });

      if (!resp.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      const data = await resp.json();
      console.log('Sugerencia IA:', data);

      if (data.recomendacion?.nuevo_inicio && data.recomendacion?.nuevo_fin) {
        const inicioISO = data.recomendacion.nuevo_inicio;
        const finISO = data.recomendacion.nuevo_fin;

        const [fecha, horaInicio] = inicioISO.split('T');
        const horaInicioFormat = horaInicio.slice(0, 5);
        const horaFinFormat = finISO.split('T')[1].slice(0, 5);

        const sugerenciaHTML = `
          <div class="alert alert-info">
            <h5><i class="bi bi-robot me-2"></i>Sugerencia de la IA</h5>
            <p>${data.recomendacion.mensaje}</p>
            <ul class="list-group mb-3">
              <li class="list-group-item"><strong>Evento:</strong> ${data.recomendacion.evento_a_mover}</li>
              <li class="list-group-item"><strong>Fecha:</strong> ${fecha}</li>
              <li class="list-group-item"><strong>Hora Inicio:</strong> ${horaInicioFormat}</li>
              <li class="list-group-item"><strong>Hora Fin:</strong> ${horaFinFormat}</li>
            </ul>
          </div>
        `;

        document.getElementById('sugerenciaIAResultado').innerHTML = sugerenciaHTML;
        window.sugerenciaIAActual = {
          evento: data.recomendacion.evento_a_mover,
          nuevoInicio: inicioISO,
          nuevoFin: finISO
        };

        const sugerenciaModal = new bootstrap.Modal(document.getElementById('sugerenciaIAModal'));
        sugerenciaModal.show();

      } else {
        document.getElementById('sugerenciaIAResultado').innerHTML = `
          <div class="alert alert-warning d-flex align-items-center" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            No se pudo generar una sugerencia de horario.
          </div>
        `;
        const sugerenciaModal = new bootstrap.Modal(document.getElementById('sugerenciaIAModal'));
        sugerenciaModal.show();
      }

    } catch (error) {
      console.error('Error llamando a /ia/sugerencia-horario:', error);
      document.getElementById('sugerenciaIAResultado').innerHTML = `
        <div class="alert alert-danger d-flex align-items-center">
          <i class="bi bi-x-circle-fill me-2"></i>
          Ocurrió un error al obtener sugerencias de la IA: ${error.message}
        </div>
      `;
      const sugerenciaModal = new bootstrap.Modal(document.getElementById('sugerenciaIAModal'));
      sugerenciaModal.show();
    }
  }


  /*******Agregamos el manejador del botón #aplicarSugerenciaIA**********/
  const btnAplicarSugerenciaIA = document.getElementById('aplicarSugerenciaIA');

  if (btnAplicarSugerenciaIA) {
    btnAplicarSugerenciaIA.addEventListener('click', function () {
      if (!window.sugerenciaIAActual) {
        alert('No hay sugerencia disponible para aplicar.');
        return;
      }

      const { evento, nuevoInicio, nuevoFin } = window.sugerenciaIAActual;

      // Cierra el modal de la sugerencia IA
      const sugerenciaModal = bootstrap.Modal.getInstance(document.getElementById('sugerenciaIAModal'));
      if (sugerenciaModal) {
        sugerenciaModal.hide();
      }

      // Extraer la fecha y las horas
      const [fecha, horaInicioFull] = nuevoInicio.split('T');
      const horaInicio = horaInicioFull.slice(0, 5);

      const [_, horaFinFull] = nuevoFin.split('T');
      const horaFin = horaFinFull.slice(0, 5);

      // Limpiamos el formulario del evento antes de llenarlo
      document.getElementById('formEvento').reset();

      // Llenamos los campos en el modal de evento
      document.getElementById('tituloEvento').value = evento || 'Evento sugerido IA';
      document.getElementById('fechaEvento').value = fecha;
      document.getElementById('horaInicioEvento').value = horaInicio;
      document.getElementById('horaFinEvento').value = horaFin;
      document.getElementById('descripcionEvento').value = 'Recomendado por IA';

      // Cambiar el título del modal de evento
      document.getElementById('eventoModalLabel').textContent = 'Nuevo Evento Sugerido por IA';

      // Ocultar el botón de eliminar, ya que es un nuevo evento
      document.getElementById('eliminarEvento').classList.add('d-none');

      // Mostrar el modal de crear/editar evento
      const eventoModal = new bootstrap.Modal(document.getElementById('eventoModal'));
      eventoModal.show();

      // Limpia la variable global si quieres evitar duplicaciones
      window.sugerenciaIAActual = null;
    });
  }

  async function moverEventoRecomendado(tituloEvento, nuevoInicioISO, nuevoFinISO) {
    const eventos = calendar.getEvents();
    const evento = eventos.find(e => e.title === tituloEvento);

    if (!evento) {
      alert(`No se encontró el evento "${tituloEvento}" en el calendario.`);
      return;
    }

    const nuevoInicio = new Date(nuevoInicioISO);
    const nuevoFin = new Date(nuevoFinISO);

    evento.setStart(nuevoInicio);
    evento.setEnd(nuevoFin);

    await actualizarEventoEnBackend(evento, nuevoInicio, nuevoFin); // 👈 aquí se guarda en la BD

    calendar.refetchEvents();

    alert(`✅ Evento "${tituloEvento}" movido exitosamente a ${formatDateTime(nuevoInicioISO)} - ${formatDateTime(nuevoFinISO)}.`);

    const modal = bootstrap.Modal.getInstance(document.getElementById('analizaModal'));
    if (modal) modal.hide();
  }


  async function actualizarEventoEnBackend(evento, nuevoInicio, nuevoFin) {
    const id = evento.extendedProps?.id_cita;
    if (!id) {
      console.warn("⚠️ El evento no tiene id_cita, no se puede actualizar.");
      return;
    }

    // Ajuste UTC-5
    function ajustarUTC5(dateObj) {
      const fecha = new Date(dateObj);
      fecha.setHours(fecha.getHours() - 5);
      return fecha.toISOString().slice(0, 19).replace("T", " ");
    }

    const payload = {
      cedula_solicitante: evento.extendedProps?.cedula || "",
      email_solicitante: evento.extendedProps?.email || "",
      estado: evento.extendedProps?.estado || "Pendiente",
      fecha_hora_inicio: ajustarUTC5(nuevoInicio),
      fecha_hora_fin: ajustarUTC5(nuevoFin),
      id_modalidad: evento.extendedProps?.id_modalidad || 1,
      id_responsable: evento.extendedProps?.id_responsable || 2,
      id_solicitante: evento.extendedProps?.id_solicitante || 1,
      id_tipo_cita: evento.extendedProps?.id_tipo_cita || 1,
      nombre_solicitante: evento.extendedProps?.nombre || evento.title,
      notas: evento.extendedProps?.description || ""
    };

    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/citas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include"
      });

      if (!resp.ok) throw new Error("Error al actualizar evento");
      console.log("✅ Evento actualizado en la base de datos");
    } catch (error) {
      console.error("❌ Error al actualizar en backend:", error);
      alert("No se pudo actualizar el evento en la base de datos.");
    }
  }


  function abrirModalEditar(evento) {
    console.log("🧪 Evento seleccionado:", evento.extendedProps);

    eventoSeleccionado = evento;
    const startDate = evento.start;
    const endDate = evento.end;

    const fecha = startDate.toISOString().split("T")[0];
    const horaInicio = startDate.toTimeString().slice(0, 5);
    const horaFin = endDate ? endDate.toTimeString().slice(0, 5) : '';
    const btnEnviarCorreo = document.getElementById('enviarCorreo');

    document.getElementById('eventoModalLabel').textContent = 'Editar Evento';
    document.getElementById('tituloEvento').value = evento.extendedProps.nombre || evento.title;
    document.getElementById('fechaEvento').value = fecha;
    document.getElementById('horaInicioEvento').value = horaInicio;
    document.getElementById('horaFinEvento').value = horaFin;
    document.getElementById('descripcionEvento').value = evento.extendedProps.description || '';
    document.getElementById('emailEvento').value = evento.extendedProps.email || '';
    document.getElementById('estadoEvento').value = evento.extendedProps.estado || 'Pendiente';

    // ✅ Agregado: establecer la modalidad en el select
    document.getElementById('modalidadEvento').value = evento.extendedProps.id_modalidad || '1';

    document.getElementById('eliminarEvento').classList.remove('d-none');

    const modal = new bootstrap.Modal(document.getElementById('eventoModal'));
    modal.show();

    if (btnEnviarCorreo) {
      btnEnviarCorreo.onclick = async () => {
        const nombre = document.getElementById('tituloEvento').value.trim();
        const fecha = document.getElementById('fechaEvento').value;
        const horaInicio = document.getElementById('horaInicioEvento').value;
        const horaFin = document.getElementById('horaFinEvento').value;
        const email = document.getElementById('emailEvento').value.trim();

        if (!email || !nombre || !fecha || !horaInicio) {
          return alert("Completa todos los campos para enviar el correo.");
        }

        const subject = `🗓️ Recordatorio: Cita agendada para ${nombre} el ${fecha} a las ${horaInicio}`;
        const body = `
          Hola ${nombre},

          Te confirmamos que tienes una cita agendada el día ${fecha} desde las ${horaInicio} hasta las ${horaFin || "hora no especificada"}.

          Por favor, guarda esta información y preséntate puntualmente. Si tienes dudas o necesitas reprogramar, contáctanos con anticipación.

          Saludos,
          Unidad de Bienestar Estudiantil
          Instituto Superior Tecnológico UBE
        `.trim();

        const payload = {
          to: email,
          subject,
          body
        };

        try {
          const response = await fetch("http://127.0.0.1:8000/api/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (!response.ok) throw new Error("Error al enviar el correo");
          alert("✅ Correo enviado correctamente.");
        } catch (error) {
          console.error("❌ Error al enviar correo:", error);
          alert("Ocurrió un error al enviar el correo.");
        }
      };
    }
  }

  function initInicioUI() {
    const btnAnalizar = document.querySelector('[data-bs-target="#analizaModal"]');
    if (btnAnalizar) {
      btnAnalizar.addEventListener('click', () => {
        setTimeout(hacerAnalisisAgenda, 500);
      });
    }

    const btnSugerirIA = document.getElementById('btnSugerirIA');
    if (btnSugerirIA) {
      btnSugerirIA.addEventListener('click', sugerirHorarioIA);
    }

    const btnAplicarSugerenciaIA = document.getElementById('aplicarSugerenciaIA');
    if (btnAplicarSugerenciaIA) {
      btnAplicarSugerenciaIA.addEventListener('click', aplicarSugerenciaIA);
    }

    const analizaModal = document.getElementById('analizaModal');
    if (analizaModal) {
      analizaModal.addEventListener('shown.bs.modal', () => {
        hacerAnalisisAgenda();
      });
    }
  }

  window.initInicioUI = initInicioUI;



  window.initCalendar = initCalendar;
  window.actualizarEventosEnCalendario = actualizarEventosEnCalendario;
})();