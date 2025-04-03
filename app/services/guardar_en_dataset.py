import csv
import os

ruta_dataset = 'app/data/dataset_eventos.csv'

# Diccionario para mapear días de texto a números
dias_semana_map = {
    'Monday': 0,
    'Tuesday': 1,
    'Wednesday': 2,
    'Thursday': 3,
    'Friday': 4,
    'Saturday': 5,
    'Sunday': 6
}

# Mapeo de estados al formato esperado
estado_map = {
    'Confirmada': 'aceptado',
    'Anulada': 'rechazado',
    'Pendiente': 'pendiente'
}

def guardar_en_dataset(lista_eventos):
    """
    Sobrescribe el dataset CSV con los eventos nuevos.
    """
    eventos_normalizados = []

    for evento in lista_eventos:
        dia_texto = evento.get('dia_semana')
        dia_numero = dias_semana_map.get(dia_texto, -1)

        estado_original = evento.get('estado', 'Pendiente').capitalize()
        estado_normalizado = estado_map.get(estado_original, 'pendiente')  # default a 'pendiente'

        eventos_normalizados.append({
            'dia_semana': dia_numero,
            'hora_inicio': evento.get('hora_inicio'),
            'duracion': evento.get('duracion'),
            'estado': estado_normalizado
        })

    with open(ruta_dataset, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['dia_semana', 'hora_inicio', 'duracion', 'estado']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()

        for evento in eventos_normalizados:
            writer.writerow(evento)

    print(f"✅ {len(eventos_normalizados)} registros guardados en el dataset: {ruta_dataset}")
