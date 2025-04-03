from flask import Blueprint, render_template, abort, redirect, url_for

main = Blueprint('main', __name__)

@main.route('/')
def home():
    return redirect(url_for('main.login_view'))

@main.route('/login')
def login_view():
    return render_template('login.html')

@main.route('/inicio')
def inicio_view():
    return render_template('index.html')

@main.route('/fragment/<modulo>')
def fragmento(modulo):
    allowed = ['inicio', 'buzon', 'reportes', 'parametros']
    if modulo not in allowed:
        abort(404)
    return render_template(f"{modulo}.html")
