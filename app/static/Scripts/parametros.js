console.log("✅ Script parametros.js cargado");
cargarDatosUsuario(); // En caso de que el formulario ya esté cargado al inicio

document.addEventListener("DOMContentLoaded", () => {
  console.log("📦 DOM completamente cargado");
  esperarFormularioYAplicar(); // En refresh
});

// 👁️ Observa si se carga dinámicamente después
// const observer = new MutationObserver(() => {
//   const formulario = document.getElementById("usuarioForm");
//   if (formulario && !formulario.dataset.listener) {
//     console.log("👀 Formulario detectado dinámicamente");
//     cargarDatosUsuario();
//     inicializarFormulario(formulario);
//   }
// });
// observer.observe(document.body, { childList: true, subtree: true });

// ⏳ Espera que exista el formulario tras un refresh
function esperarFormularioYAplicar() {
  const intervalo = setInterval(() => {
    const formulario = document.getElementById("usuarioForm");
    if (formulario) {
      console.log("📝 Formulario detectado tras refresh");
      clearInterval(intervalo);
      cargarDatosUsuario();
      inicializarFormulario(formulario);
    }
  }, 300); // cada 300ms revisa hasta que aparezca
}

async function cargarDatosUsuario() {
  try {
    console.log("🔍 Cargando usuario desde localStorage...");
    const usuarioLocal = JSON.parse(localStorage.getItem("usuario"));

    if (!usuarioLocal || !usuarioLocal.id_usuario) {
      throw new Error("No se encontró ID de usuario en localStorage");
    }

    const idUsuario = usuarioLocal.id_usuario;
    console.log("📤 Enviando solicitud a /api/usuarios/" + idUsuario);

    const response = await fetch(`http://127.0.0.1:8000/api/usuarios/${idUsuario}`, {
      method: "GET",
      credentials: "include"
    });

    console.log("📥 Respuesta cruda:", response);

    if (!response.ok) {
      const texto = await response.text();
      console.error("❌ Error en fetch:", response.status, texto);
      throw new Error("Error al cargar datos");
    }

    const usuario = await response.json();
    console.log("🟢 Datos obtenidos:", usuario);

    if (document.getElementById("usuarioForm")) {
      document.getElementById("nombre").value = usuario.nombre || "";
      document.getElementById("apellido").value = usuario.apellido || "";
      document.getElementById("email").value = usuario.email || "";
      document.getElementById("telefono").value = usuario.telefono || "";
      document.getElementById("estado").value = usuario.estado || "";
      document.getElementById("ultimaSesion").value = usuario.ultima_sesion || "";
      document.getElementById("horarioLaboral").value = usuario.horario || "";
    }

  } catch (error) {
    console.error("❌ Error al cargar datos del usuario:", error);
  }
}

function inicializarFormulario(formularioUsuario) {
  if (formularioUsuario.dataset.listener === "true") return;
  formularioUsuario.dataset.listener = "true";

  formularioUsuario.addEventListener("submit", async (e) => {
    e.preventDefault();

    const usuarioLocal = JSON.parse(localStorage.getItem("usuario"));
    if (!usuarioLocal || !usuarioLocal.id_usuario) {
      alert("No se puede actualizar: ID de usuario no disponible.");
      return;
    }

    const idUsuario = usuarioLocal.id_usuario;

    const datos = {
      nombre: document.getElementById("nombre").value,
      apellido: document.getElementById("apellido").value,
      email: document.getElementById("email").value,
      telefono: document.getElementById("telefono").value,
      estado: document.getElementById("estado").value
    };

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/usuarios/${idUsuario}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
        credentials: "include"
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error al actualizar:", response.status, errorText);
        throw new Error("Error al actualizar datos");
      }

      alert("✅ Datos actualizados correctamente.");
    } catch (error) {
      console.error("❌ Error al actualizar usuario:", error);
      alert("Ocurrió un error al guardar los datos.");
    }
  });
}
