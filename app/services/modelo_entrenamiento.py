import pandas as pd
from sklearn.tree import DecisionTreeClassifier
import joblib
import os
from app.utils.preprocesamiento import mapear_dia_semana, mapear_estado

# Entrena el modelo desde un CSV con los eventos históricos
def entrenar_modelo(ruta_csv='app/data/dataset_eventos.csv'):
    # Convertir la ruta relativa a una absoluta
    ruta_csv_absoluta = os.path.abspath(ruta_csv)

    # Validación: que el dataset exista
    if not os.path.exists(ruta_csv_absoluta):
        raise FileNotFoundError(f"❌ No se encontró el dataset en {ruta_csv_absoluta}")

    print(f"📂 Cargando dataset desde {ruta_csv_absoluta}...")
    df = pd.read_csv(ruta_csv_absoluta)

    # Mapeo de columnas categóricas a numéricas (obligatorio para el modelo)
    df['dia_semana'] = df['dia_semana'].apply(mapear_dia_semana)
    df['estado_binario'] = df['estado'].apply(mapear_estado)

    print("🔎 Mostrando los primeros datos procesados:")
    print(df.head())

    # Seleccionamos las columnas como características (features)
    X = df[['dia_semana', 'hora_inicio', 'duracion']]
    # Etiqueta (label) que queremos que el modelo aprenda a predecir
    y = df['estado_binario']

    print("⚙️ Entrenando modelo de Decision Tree...")
    modelo = DecisionTreeClassifier()
    modelo.fit(X, y)

    # Guardamos el modelo entrenado en un archivo .pkl
    modelo_path = 'app/models/modelo_sugerencias.pkl'
    modelo_path_absoluto = os.path.abspath(modelo_path)

    # Crear carpeta si no existe
    os.makedirs(os.path.dirname(modelo_path_absoluto), exist_ok=True)

    # Guardamos el modelo
    joblib.dump(modelo, modelo_path_absoluto)

    print(f"✅ Modelo entrenado y guardado en {modelo_path_absoluto}")

# Ejecutar como script desde la terminal
if __name__ == '__main__':
    entrenar_modelo()  # O puedes pasar otro CSV aquí
