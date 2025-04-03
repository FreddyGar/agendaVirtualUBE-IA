from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(
        __name__,
        template_folder='templates',
        static_folder='static'
    )

    # 🔐 Clave secreta necesaria para manejar sesiones
    app.secret_key = 'clave_super_secreta_123'

    # 🌐 Habilita CORS si el frontend está en otro dominio/puerto
    CORS(app)

    # 📦 Registra las rutas desde el módulo routes
    with app.app_context():
        from .routes import init_routes
        init_routes(app)

    return app
