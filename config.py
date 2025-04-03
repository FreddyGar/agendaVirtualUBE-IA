import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host='localhost',
        database='ube_vra',
        user='root',
        password='your_password'
    )
