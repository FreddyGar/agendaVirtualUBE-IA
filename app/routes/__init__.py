def init_routes(app):
    from app.routes.main import main
    from .analizarAgenda import analisis
    from .usuarios import usuarios_bp
    from .iaAgenda import ia
    
    app.register_blueprint(main)
    app.register_blueprint(analisis, url_prefix='/analisis')
    app.register_blueprint(usuarios_bp)
    app.register_blueprint(ia, url_prefix='/ia')  # ✅ importante
