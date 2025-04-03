from flask import Flask, abort, redirect, render_template, url_for
from app import create_app

app = create_app() 

if __name__ == '__main__':
    app.run(debug=True)
