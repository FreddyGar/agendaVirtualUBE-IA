from app.models.usuario import Usuario
from app.config.db import get_db_connection

def get_all_usuarios():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM usuarios')
    usuarios = cursor.fetchall()
    cursor.close()
    conn.close()
    return [Usuario.from_dict(u) for u in usuarios]

def get_usuario_by_id(id_usuario):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM usuarios WHERE id_usuario = %s', (id_usuario,))
    usuario = cursor.fetchone()
    cursor.close()
    conn.close()
    return Usuario.from_dict(usuario) if usuario else None
