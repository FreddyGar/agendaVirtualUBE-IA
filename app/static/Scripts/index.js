// Scripts/index.js
let callback = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('usuario')) {
    window.location.href = '/login';
    return;
  }

  // Determinar el módulo según la URL
  const path = window.location.pathname;

  let modulo = 'inicio';
  let urlHtml = '/fragment/inicio';
  let urlScript = '/static/Scripts/inicio.js';
  let callback = () => {
    if (typeof initCalendar === 'function') {
      initCalendar();
      actualizarEventosEnCalendario();
    }
    if (typeof initInicioUI === 'function') {
      initInicioUI(); // <- Esto inicializa los botones y modales
    }
  };

  switch (path) {
    case '/inicio':
      modulo = 'inicio';
      urlHtml = '/fragment/inicio';
      urlScript = '/static/Scripts/inicio.js';
      callback = () => {
        // Esperar un poquito a que el DOM y script estén listos
        setTimeout(() => {
          if (typeof initCalendar === 'function') {
            initCalendar();
            actualizarEventosEnCalendario();
          }
          if (typeof initInicioUI === 'function') {
            initInicioUI();
          } else {
            console.warn('⚠️ initInicioUI no está definido');
          }
        }, 200); // pequeño delay para asegurar que todo se haya insertado
      };
      break;
    case '/buzon':
      modulo = 'buzon';
      urlHtml = '/fragment/buzon';
      urlScript = '/static/Scripts/buzon.js';
      callback = null;
      break;
    case '/reportes':
      modulo = 'reportes';
      urlHtml = '/fragment/reportes';
      urlScript = '/static/Scripts/reportes.js';
      callback = () => {
        if (typeof cargarEventos === 'function') cargarEventos();
      };
      break;
    case '/parametros':
      modulo = 'parametros';
      urlHtml = '/fragment/parametros';
      urlScript = '/static/Scripts/parametros.js';
      callback = null;
      break;
  }

  const link = document.querySelector(`.nav-link[data-modulo="${modulo}"]`);
  if (link) setActiveMenuItem(link);
  cargarModulo(urlHtml, urlScript, callback, path);
});

// ============================
// Cargar módulo dinámicamente
// ============================
async function cargarModulo(urlHtml, urlScript, callbackFinal, nuevaRuta = null) {
  const contenedor = document.getElementById('contenido');
  if (!contenedor) return;

  try {
    const resp = await fetch(urlHtml);
    if (!resp.ok) throw new Error('No se pudo cargar ' + urlHtml);
    const html = await resp.text();
    contenedor.innerHTML = html;

    if (urlScript) {
      document.querySelectorAll('script[data-dynamic="true"]').forEach(s => s.remove());

      const s = document.createElement('script');
      s.src = urlScript;
      s.dataset.dynamic = 'true';
      s.onload = () => {
        if (typeof callbackFinal === 'function') callbackFinal();
      };
      document.body.appendChild(s);
    } else {
      if (typeof callbackFinal === 'function') callbackFinal();
    }

    // 👉 Cambiar la URL sin recargar
    if (nuevaRuta) {
      history.pushState({ modulo: nuevaRuta }, '', nuevaRuta);
    }

  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p>Error al cargar el módulo: ${err.message}</p>`;
  }
}

// ============================
// Logout
// ============================
function logout() {
  localStorage.removeItem('usuario');
  window.location.href = '/login';
}

// ============================
// Control de menú activo
// ============================
function setActiveMenuItem(clickedLink) {
  const links = document.querySelectorAll('.sidebar .nav-link');
  links.forEach(link => link.classList.remove('active'));
  clickedLink.classList.add('active');
}
