from flask import Blueprint, jsonify, request
from app.services.ia_service import obtener_mejor_horario
from app.services.modelo_entrenamiento import entrenar_modelo
from app.services.guardar_en_dataset import guardar_en_dataset
from datetime import datetime, timedelta, timezone

ia = Blueprint('ia', __name__)

# ✅ Zona horaria UTC-5 (Ecuador, Colombia, etc.)
ZONA_UTC_MINUS_5 = timezone(timedelta(hours=-5))

@ia.route('/sugerencia-horario', methods=['POST'])
def sugerir_horario():
    eventos = request.json.get('eventos', [])

    if not eventos:
        return jsonify({'error': 'No se recibieron eventos'}), 400

    dataset_nuevos = []

    for evento in eventos:
        # ✅ Ajuste a zona horaria correcta
        start_dt = datetime.fromisoformat(evento['start']).astimezone(ZONA_UTC_MINUS_5)
        end_dt = datetime.fromisoformat(evento['end']).astimezone(ZONA_UTC_MINUS_5) if evento['end'] else (start_dt + timedelta(hours=1))

        dia_semana = start_dt.strftime('%A')
        hora_inicio = start_dt.hour

        duracion_timedelta = end_dt - start_dt
        duracion_horas = round(duracion_timedelta.total_seconds() / 3600, 1)
        if duracion_horas <= 0:
            duracion_horas = 0.5

        estado = evento.get('estado', 'Pendiente').lower()

        dataset_nuevos.append({
            'dia_semana': dia_semana,
            'hora_inicio': hora_inicio,
            'duracion': duracion_horas,
            'estado': estado
        })

    guardar_en_dataset(dataset_nuevos)
    entrenar_modelo()
    resultado = obtener_mejor_horario(eventos)

    return jsonify({'recomendacion': resultado})
