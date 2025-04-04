(function () {

function inicializarFormularios() {
  const formularioUsuario = document.getElementById("usuarioForm");
  const formCambio = document.getElementById("cambioContrasenaForm");

  if (formularioUsuario && formularioUsuario.dataset.listener !== "true") {
    formularioUsuario.dataset.listener = "true";
    inicializarFormulario(formularioUsuario);
  }

  if (formCambio) {
    if (formCambio.dataset.listener !== "true") {
      formCambio.dataset.listener = "true";
      inicializarCambioContrasena(formCambio);
    }
  } else {
    console.warn("⚠️ El formulario de cambio de contraseña no fue encontrado.");
  }
}

// 🔐 Cambio de contraseña
function inicializarCambioContrasena(formCambio) {
  formCambio.addEventListener("submit", async (e) => {
    e.preventDefault(); // 👈 Esto evita el refresh

    const btn = formCambio.querySelector("button[type='submit']");
    if (btn) btn.disabled = true;

    const nueva = document.getElementById("nuevaContrasena").value.trim();
    const confirmar = document.getElementById("confirmarContrasena").value.trim();

    if (!nueva || !confirmar) {
      alert("⚠️ Por favor, completa todos los campos.");
      if (btn) btn.disabled = false;
      return;
    }

    if (nueva.length < 8) {
      alert("🔐 La contraseña debe tener al menos 8 caracteres.");
      if (btn) btn.disabled = false;
      return;
    }

    if (nueva !== confirmar) {
      alert("❌ Las contraseñas no coinciden.");
      if (btn) btn.disabled = false;
      return;
    }

    const usuarioLocal = JSON.parse(localStorage.getItem("usuario"));
    if (!usuarioLocal || !usuarioLocal.id_usuario) {
      alert("⚠️ No se encontró el ID del usuario.");
      if (btn) btn.disabled = false;
      return;
    }

    const idUsuario = usuarioLocal.id_usuario;
    const datos = { contrasena: nueva };

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/usuarios/${idUsuario}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(datos)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error en la solicitud:", errorText);
        alert("❌ No se pudo cambiar la contraseña.");
        return;
      }

      alert("✅ Contraseña actualizada correctamente.");
      formCambio.reset();
    } catch (error) {
      console.error("❌ Error al cambiar contraseña:", error);
      alert("Ocurrió un error al cambiar la contraseña.");
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

// 📥 Cargar datos del usuario desde la API
async function cargarDatosUsuario() {
  try {
    const usuarioLocal = JSON.parse(localStorage.getItem("usuario"));

    if (!usuarioLocal || !usuarioLocal.id_usuario) {
      throw new Error("No se encontró ID de usuario en localStorage");
    }

    const idUsuario = usuarioLocal.id_usuario;
    const response = await fetch(`http://127.0.0.1:8000/api/usuarios/${idUsuario}`, {
      method: "GET",
      credentials: "include"
    });

    if (!response.ok) {
      const texto = await response.text();
      console.error("❌ Error en fetch:", response.status, texto);
      throw new Error("Error al cargar datos");
    }

    const usuario = await response.json();

    const form = document.getElementById("usuarioForm");
    if (form) {
      document.getElementById("nombre").value = usuario.nombre || "";
      document.getElementById("apellido").value = usuario.apellido || "";
      document.getElementById("email").value = usuario.email || "";
      document.getElementById("telefono").value = usuario.telefono || "";
      document.getElementById("estado").value = usuario.estado || "";

      const inputHorario = document.getElementById("horarioLaboral");
      if (inputHorario) {
        inputHorario.value = usuario.horario || "";
      }
    }

  } catch (error) {
    console.error("❌ Error al cargar datos del usuario:", error);
  }
}

// 📝 Lógica de actualización de datos personales
function inicializarFormulario(formularioUsuario) {
  formularioUsuario.addEventListener("submit", async (e) => {
    e.preventDefault();
    cargarDatosUsuario(); // Cargar datos antes de enviar el formulario

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
      cargarDatosUsuario(); // Recargar datos después de la actualización
    } catch (error) {
      alert("Ocurrió un error al guardar los datos.");
    }
  });
}

// 👇 Esta es la función que se debe invocar desde el index.js
window.initParametrosUI = function () {
  console.log("🚀 Iniciando UI de parámetros...");

  setTimeout(() => {
    inicializarFormularios();
    cargarDatosUsuario();
  }, 100); // ✅ espera breve para que el DOM del fragmento ya esté renderizado
};

})();