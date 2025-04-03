import joblib
import os
from datetime import datetime, timedelta, time, timezone
from app.services.modelo_entrenamiento import entrenar_modelo

# Configuración de zona horaria
ZONA_UTC_MINUS_5 = timezone(timedelta(hours=-5))

HORARIO_LABORAL_INICIO = time(7, 0)
HORARIO_LABORAL_FIN = time(18, 0)

# Umbral de ocupación (%) para considerar saturado el día
UMBRAL_OCUPACION = 90  # ← Aumentado del 70% al 90%

# Ruta al modelo entrenado
modelo_path = 'app/models/modelo_sugerencias.pkl'

# ✅ Entrenar automáticamente si no existe el modelo
if not os.path.exists(modelo_path):
    print("⚠️ Modelo no encontrado. Entrenando automáticamente...")
    entrenar_modelo()

# ✅ Revalidar existencia
if not os.path.exists(modelo_path):
    raise FileNotFoundError("❌ El modelo no pudo ser creado. Verifica el dataset.")

modelo = joblib.load(modelo_path)

def obtener_mejor_horario(eventos, dia_consulta=None):
    eventos_dt = []
    for e in eventos:
        start_dt = asegura_zona(datetime.fromisoformat(e['start']))
        end_dt = asegura_zona(datetime.fromisoformat(e['end'])) if e.get('end') else (start_dt + timedelta(hours=1))

        eventos_dt.append({
            'start_dt': start_dt,
            'end_dt': end_dt,
            'title': e.get('title', 'Sin Titulo')
        })

    if not dia_consulta:
        dia_consulta = datetime.now(ZONA_UTC_MINUS_5).date()

    intentos_maximos = 7
    intentos = 0

    while intentos < intentos_maximos:
        print(f"\n🔍 Intento {intentos + 1} - Revisando el día {dia_consulta}")
        resultado = buscar_horario(eventos_dt, dia_consulta, duracion_horas=1)

        if resultado['nuevo_inicio']:
            return resultado

        print(f"❌ No se encontró espacio en {dia_consulta}, probando siguiente día...")
        dia_consulta += timedelta(days=1)
        intentos += 1

    return {
        'nuevo_inicio': None,
        'nuevo_fin': None,
        'mensaje': '🚫 No se encontró espacio recomendado por IA en los próximos días'
    }

BLOQUES_NO_DISPONIBLES = [
    (time(12, 0), time(13, 0)),  # 12:00 a 13:00
]

def buscar_horario(eventos, dia_consulta, duracion_horas=1):
    inicio_jornada = datetime.combine(dia_consulta, HORARIO_LABORAL_INICIO, tzinfo=ZONA_UTC_MINUS_5)
    fin_jornada = datetime.combine(dia_consulta, HORARIO_LABORAL_FIN, tzinfo=ZONA_UTC_MINUS_5)

    bloques_ocupados = sorted([
        (asegura_zona(e['start_dt']), asegura_zona(e['end_dt']))
        for e in eventos
        if asegura_zona(e['start_dt']).date() == dia_consulta
    ])

    for bloque_inicio, bloque_fin in BLOQUES_NO_DISPONIBLES:
        bloque_inicio_dt = datetime.combine(dia_consulta, bloque_inicio, tzinfo=ZONA_UTC_MINUS_5)
        bloque_fin_dt = datetime.combine(dia_consulta, bloque_fin, tzinfo=ZONA_UTC_MINUS_5)
        bloques_ocupados.append((bloque_inicio_dt, bloque_fin_dt))

    bloques_ocupados.sort()

    ocupacion = calcular_ocupacion(bloques_ocupados, inicio_jornada, fin_jornada)
    print(f"📊 Ocupación del día {dia_consulta}: {ocupacion:.1f}%")

    if ocupacion >= UMBRAL_OCUPACION:
        print(f"⚠️ Día {dia_consulta} está bastante ocupado ({ocupacion:.1f}%), pero se revisarán huecos disponibles...")

    print(f"🔎 Buscando huecos disponibles en el día {dia_consulta}...")

    posible_inicio = inicio_jornada

    while posible_inicio + timedelta(hours=duracion_horas) <= fin_jornada:
        posible_fin = posible_inicio + timedelta(hours=duracion_horas)

        # Verifica si este rango se sobrepone con algún bloque ocupado
        hay_conflicto = False
        for bloque_inicio, bloque_fin in bloques_ocupados:
            if not (posible_fin <= bloque_inicio or posible_inicio >= bloque_fin):
                hay_conflicto = True
                break

        if not hay_conflicto:
            print(f"✅ Hueco detectado de {posible_inicio.time()} a {posible_fin.time()}. Validando con IA...")
            resultado = validar_con_modelo(dia_consulta, posible_inicio, duracion_horas, fin_jornada)
            if resultado['nuevo_inicio']:
                return resultado

        # Avanzar 15 minutos para probar el siguiente hueco
        posible_inicio += timedelta(minutes=15)

    print(f"❌ Sin huecos válidos el {dia_consulta}")
    return sin_espacio(dia_consulta)

def calcular_ocupacion(bloques_ocupados, inicio_jornada, fin_jornada):
    tiempo_total = (fin_jornada - inicio_jornada).total_seconds()
    tiempo_ocupado = sum(
        (fin - inicio).total_seconds()
        for inicio, fin in bloques_ocupados
    )
    return (tiempo_ocupado / tiempo_total) * 100 if tiempo_total > 0 else 0

def validar_con_modelo(dia_consulta, posible_inicio, duracion_horas, fin_jornada):
    posible_fin = posible_inicio + timedelta(hours=duracion_horas)

    if posible_fin > fin_jornada:
        print(f"⛔ El rango {posible_inicio.time()} - {posible_fin.time()} está fuera del horario laboral.")
        return sin_espacio(dia_consulta)

    dia_semana = dia_consulta.weekday()
    hora_inicio = posible_inicio.hour
    duracion = duracion_horas

    print(f"🤖 Consultando IA con datos: DíaSemana={dia_semana}, HoraInicio={hora_inicio}, Duración={duracion}")

    prediccion = modelo.predict([[dia_semana, hora_inicio, duracion]])

    if prediccion[0] == 1:
        print(f"✅ IA recomienda el horario {hora_inicio}:00 a {hora_inicio + duracion}:00")
        return crear_recomendacion(dia_consulta, posible_inicio, posible_fin)
    else:
        print(f"❌ IA NO recomienda el horario {hora_inicio}:00 a {hora_inicio + duracion}:00")
        return sin_espacio(dia_consulta)

def crear_recomendacion(dia_consulta, inicio, fin):
    return {
        'evento_a_mover': 'Evento sugerido por IA',
        'nuevo_inicio': inicio.isoformat(),
        'nuevo_fin': fin.isoformat(),
        'mensaje': f"✅ Recomendado por IA para el {dia_consulta}, de {inicio.time().strftime('%H:%M')} a {fin.time().strftime('%H:%M')}"
    }

def sin_espacio(dia_consulta):
    return {
        'nuevo_inicio': None,
        'nuevo_fin': None,
        'mensaje': f"❌ Sin espacio óptimo el {dia_consulta}"
    }

def asegura_zona(fecha):
    if fecha.tzinfo is None:
        return fecha.replace(tzinfo=ZONA_UTC_MINUS_5)
    return fecha.astimezone(ZONA_UTC_MINUS_5)
