function login() {
    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;

    fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            codigo: usuario,          // Si usas otro campo, como código, cámbialo aquí
            password: password
        })
         
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Credenciales inválidas");
        }
        return response.json();
    })
    .then(data => {
        // Guardar info del usuario y redirigir
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        window.location.href = '/inicio';
    })
    .catch(error => {
        alert(error.message);
    });

    return false; // Previene el envío del formulario
}
