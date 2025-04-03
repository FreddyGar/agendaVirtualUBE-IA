// parametros.js

console.log("✅ Script parametros.js cargado");

async function cargarDatosUsuario() {
  try {
    console.log("🔍 Llamando a /api/usuarios/perfil");

    const response = await fetch("http://127.0.0.1:8000/api/usuarios/perfil", {
      method: "GET",
      credentials: "include" // Enviar cookies para sesión
    });
    console.log("📥 Respuesta cruda:", response);

    if (!response.ok) {
      const texto = await response.text();
      console.error("❌ Error en fetch:", response.status, texto);
      throw new Error("Error al cargar datos");
    }

    const usuario = await response.json();
    console.log("🟢 Datos obtenidos:", usuario);

    document.getElementById("nombre").value = usuario.nombre || "";
    document.getElementById("apellido").value = usuario.apellido || "";
    document.getElementById("email").value = usuario.email || "";
    document.getElementById("telefono").value = usuario.telefono || "";
    document.getElementById("estado").value = usuario.estado || "";
    document.getElementById("ultimaSesion").value = usuario.ultima_sesion || "";
    document.getElementById("horarioLaboral").value = usuario.horario || "";

  } catch (error) {
    console.error("❌ Error al cargar datos del usuario:", error);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", cargarDatosUsuario);
} else {
  cargarDatosUsuario();
}

// Guardar datos al enviar el formulario
const formularioUsuario = document.getElementById("usuarioForm");

if (formularioUsuario) {
  formularioUsuario.addEventListener("submit", async (e) => {
    e.preventDefault();
    const datos = {
      nombre: document.getElementById("nombre").value,
      apellido: document.getElementById("apellido").value,
      email: document.getElementById("email").value,
      telefono: document.getElementById("telefono").value,
      estado: document.getElementById("estado").value
    };

    try {
      const response = await fetch("/api/usuario/actualizar", {
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
