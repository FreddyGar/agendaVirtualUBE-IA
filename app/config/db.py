import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host='34.172.181.172',
        database='db_ubetesis',
        user='desarrollo',
        password='desarrolloUbeTesis#.'
    )
