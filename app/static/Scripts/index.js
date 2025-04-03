// Scripts/index.js
let callback = null;
let moduloActual = null; // ⬅️ Esto controla el módulo actualmente cargado


document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('usuario')) {
    window.location.href = '/login';
    return;
  }

  const path = window.location.pathname;

  let modulo = 'inicio';
  let urlHtml = '/fragment/inicio';
  let urlScript = '/static/Scripts/inicio.js';
  let callback = () => {
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
    }, 200);
  };

  switch (path) {
    case '/reportes':
      modulo = 'reportes';
      urlHtml = '/fragment/reportes';
      urlScript = '/static/Scripts/reportes.js';
      callback = () => {
        setTimeout(() => {
          console.log('🔁 Ejecutando callback de reportes');
          if (typeof initReportesUI === 'function') {
            initReportesUI();
          } else {
            console.warn('⚠️ initReportesUI no está definido');
          }
        }, 200); // Delay para asegurar que ya esté disponible
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
  
  // ✅ Evitar recargar el mismo módulo si ya está activo
  if (modulo === moduloActual) {
    console.log(`⏭️ El módulo '${modulo}' ya está cargado.`);
    return;
  }
  moduloActual = modulo;
  
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
      // Eliminar scripts anteriores si ya están cargados
      const scripts = document.querySelectorAll('script[data-dynamic="true"]');
      scripts.forEach(script => {
        if (script.src.includes(urlScript)) {
          console.log(`🗑️ Eliminando script existente: ${script.src}`);
          script.remove();
        }
      });

      // Cargar nuevo script dinámico
      const newScript = document.createElement('script');
      newScript.src = `${urlScript}?v=${Date.now()}`; // 🔄 evita caché y fuerza recarga
      newScript.dataset.dynamic = 'true';
      newScript.onload = () => {
        console.log(`✅ Script cargado: ${newScript.src}`);
        if (typeof callbackFinal === 'function') callbackFinal();
      };
      
      document.body.appendChild(newScript);
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

// ============================
// Manejador para navegación con botones del navegador o cambios de URL dinámicos
// ============================
window.addEventListener('popstate', (e) => {
  const path = window.location.pathname;

  let modulo, urlHtml, urlScript, callback;

  switch (path) {
    case '/inicio':
      modulo = 'inicio';
      urlHtml = '/fragment/inicio';
      urlScript = '/static/Scripts/inicio.js';
      callback = () => {
        setTimeout(() => {
          if (typeof initCalendar === 'function') {
            initCalendar();
            actualizarEventosEnCalendario();
          }
          if (typeof initInicioUI === 'function') {
            initInicioUI();
          } else {
            console.warn('⚠️ initInicioUI no está definido (popstate)');
          }
        }, 200);
      };
      break;

    case '/reportes':
      modulo = 'reportes';
      urlHtml = '/fragment/reportes';
      urlScript = '/static/Scripts/reportes.js';
      callback = () => {
        setTimeout(() => {
          console.log('🔁 Ejecutando callback de reportes (popstate)');
          if (typeof initReportesUI === 'function') {
            initReportesUI();
          } else {
            console.warn('⚠️ initReportesUI no está definido (popstate)');
          }
        }, 200);
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

  // Asegurar que se recargue aunque sea el mismo módulo
  moduloActual = modulo;

  cargarModulo(urlHtml, urlScript, callback, null); // no volver a usar pushState
});
