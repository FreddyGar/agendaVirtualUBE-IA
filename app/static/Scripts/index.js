// Scripts/index.js

// Cuando se carga index.html, validamos sesión y cargamos la vista de inicio por defecto
document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('usuario')) {
    window.location.href = '/login';
    return;
  }

  // Carga por defecto el inicio mediante el endpoint /fragment/inicio
  const inicioLink = document.querySelector('.nav-link[data-modulo="inicio"]');
  setActiveMenuItem(inicioLink);

  cargarModulo('/fragment/inicio', '/static/Scripts/inicio.js', () => {
    if (typeof initCalendar === 'function') {
      initCalendar();
      actualizarEventosEnCalendario();
    }
  });
});

// ============================
// Cargar módulo dinámicamente
// ============================
async function cargarModulo(urlHtml, urlScript, callbackFinal) {
  const contenedor = document.getElementById('contenido');
  if (!contenedor) return;

  try {
    // 1. Cargar el fragmento HTML
    const resp = await fetch(urlHtml);
    if (!resp.ok) throw new Error('No se pudo cargar ' + urlHtml);
    const html = await resp.text();
    contenedor.innerHTML = html;

    // 2. Si hay script, lo inyectamos dinámicamente
    if (urlScript) {
      // Elimina scripts previos marcados como data-dynamic (opcional, para limpiar)
      document.querySelectorAll('script[data-dynamic="true"]').forEach(s => s.remove());

      const s = document.createElement('script');
      s.src = urlScript;
      s.dataset.dynamic = 'true';
      s.onload = () => {
        console.log('✅ Script cargado:', urlScript);
        if (typeof callbackFinal === 'function') callbackFinal();
      };
      document.body.appendChild(s);
    } else {
      // Si no hay script, sólo llamamos callback
      if (typeof callbackFinal === 'function') callbackFinal();
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
  // Quitar 'active' de todos los enlaces
  const links = document.querySelectorAll('.sidebar .nav-link');
  links.forEach(link => link.classList.remove('active'));

  // Agregar 'active' solo al clicado
  clickedLink.classList.add('active');
}
