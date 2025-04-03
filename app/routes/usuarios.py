from flask import Blueprint, jsonify, request
from app.services.usuario_service import get_all_usuarios, get_usuario_by_id

usuarios_bp = Blueprint('usuarios', __name__)

@usuarios_bp.route('/usuarios', methods=['GET'])
def get_usuarios():
    usuarios = get_all_usuarios()
    return jsonify([usuario.__dict__ for usuario in usuarios])

@usuarios_bp.route('/usuarios/<int:id>', methods=['GET'])
def get_usuario(id):
    usuario = get_usuario_by_id(id)
    if usuario:
        return jsonify(usuario.__dict__)
    return jsonify({'error': 'Usuario no encontrado'}), 404
