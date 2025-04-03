import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.utils import resample
import joblib
import os

# --- Mapeo Seguro de Datos ---
def mapear_dia_semana(dia):
    try:
        dia = int(dia)
        if 0 <= dia <= 6:
            return dia
    except:
        pass
    return -1  # Valor inválido

def mapear_estado(estado):
    estado = str(estado).strip().lower()
    if estado == 'aceptado':
        return 1
    elif estado == 'pendiente':
        return 0
    return -1  # Valor inválido

# Entrena el modelo desde un CSV con los eventos históricos
def entrenar_modelo(ruta_csv='app/data/dataset_eventos.csv'):
    # Convertir la ruta relativa a una absoluta
    ruta_csv_absoluta = os.path.abspath(ruta_csv)

    # Validación: que el dataset exista
    if not os.path.exists(ruta_csv_absoluta):
        raise FileNotFoundError(f"❌ No se encontró el dataset en {ruta_csv_absoluta}")

    print(f"📂 Cargando dataset desde {ruta_csv_absoluta}...")
    df = pd.read_csv(ruta_csv_absoluta)

    # Mapeo de columnas categóricas a numéricas con validación segura
    df['dia_semana'] = df['dia_semana'].apply(mapear_dia_semana)
    df['estado_binario'] = df['estado'].apply(mapear_estado)

    # Validación de valores válidos únicamente
    df = df[df['dia_semana'].between(0, 6)]
    df = df[df['hora_inicio'].between(0, 23)]
    df = df[df['duracion'] > 0]
    df = df[df['estado_binario'].isin([0, 1])]

    # Mostrar los datos preprocesados
    print("🔎 Mostrando los primeros datos procesados:")
    print(df.head())

    # Verificar que haya al menos un dato válido antes de entrenar
    if df.empty:
        raise ValueError("🚫 El dataset no contiene datos válidos para entrenamiento.")

    # Opcional: balancear dataset
    aceptados = df[df['estado_binario'] == 1]
    pendientes = df[df['estado_binario'] == 0]
    if len(aceptados) < len(pendientes) and not aceptados.empty:
        aceptados = resample(aceptados, replace=True, n_samples=len(pendientes), random_state=42)
        df = pd.concat([aceptados, pendientes])

    # Entrenamiento del modelo
    X = df[['dia_semana', 'hora_inicio', 'duracion']]
    y = df['estado_binario']

    print("⚙️ Entrenando modelo de Decision Tree...")
    modelo = DecisionTreeClassifier()
    modelo.fit(X, y)

    # Guardar el modelo
    modelo_path = 'app/models/modelo_sugerencias.pkl'
    modelo_path_absoluto = os.path.abspath(modelo_path)
    os.makedirs(os.path.dirname(modelo_path_absoluto), exist_ok=True)
    joblib.dump(modelo, modelo_path_absoluto)

    print(f"✅ Modelo entrenado y guardado en {modelo_path_absoluto}")

# Ejecutar como script desde la terminal
if __name__ == '__main__':
    entrenar_modelo()
