class Usuario:
    def __init__(self, id_usuario, nombre, apellido, email, contrasena, telefono, estado):
        self.id_usuario = id_usuario
        self.nombre = nombre
        self.apellido = apellido
        self.email = email
        self.contrasena = contrasena
        self.telefono = telefono
        self.estado = estado

    @staticmethod
    def from_dict(data):
        return Usuario(
            data['id_usuario'], data['nombre'], data['apellido'],
            data['email'], data['contrasena'], data['telefono'], data['estado']
        )
