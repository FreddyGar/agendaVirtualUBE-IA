from datetime import datetime, timedelta, time, timezone
from flask import Blueprint, jsonify, request

analisis = Blueprint('analisis', __name__)

# 🕒 Configuración de horarios laborales y no disponibles
HORARIO_LABORAL_INICIO = time(7, 0)   # 7:00 AM
HORARIO_LABORAL_FIN = time(18, 0)     # 6:00 PM

# ⛔ Horarios donde no estás disponible (almuerzo, descansos, etc.)
HORARIOS_NO_DISPONIBLE = [
    (time(12, 0), time(13, 0))        # De 12:00 p.m. a 1:00 p.m.
]

# Definir zona horaria UTC-5
ZONA_UTC_MINUS_5 = timezone(timedelta(hours=-5))


@analisis.route('/analizarAgenda', methods=['POST'])
def analizar_agenda():
    data = request.get_json()
    eventos = data.get('eventos', [])

    # Convertir fechas a datetime y ajustar a UTC-5
    for e in eventos:
        start_utc = datetime.fromisoformat(e['start'].replace('Z', '+00:00'))
        end_str = e['end'] or e['start']
        end_utc = datetime.fromisoformat(end_str.replace('Z', '+00:00'))

        # Convertir a zona horaria UTC-5
        e['start_dt'] = start_utc.astimezone(ZONA_UTC_MINUS_5)
        e['end_dt'] = end_utc.astimezone(ZONA_UTC_MINUS_5)

    # Ordenar eventos por inicio
    eventos.sort(key=lambda x: x['start_dt'])

    solapados = []
    for i in range(len(eventos) - 1):
        actual = eventos[i]
        siguiente = eventos[i + 1]

        if actual['end_dt'] > siguiente['start_dt']:
            recomendacion = sugerir_otro_horario(siguiente, eventos)
            solapados.append({
                "evento1": actual['title'],
                "evento2": siguiente['title'],
                "recomendacion": recomendacion
            })

    return jsonify({
        "total_eventos": len(eventos),
        "solapados": solapados
    }), 200

def sugerir_otro_horario(evento_conflictivo, eventos, dias_a_buscar=7):
    """
    Busca un hueco en el mismo día o en los siguientes días, hasta encontrar uno.
    No sugiere horas pasadas si el día es hoy.
    """

    DURACION_EVENTO = evento_conflictivo['end_dt'] - evento_conflictivo['start_dt']
    DIA_INICIAL = evento_conflictivo['start_dt'].date()
    ahora = datetime.now(ZONA_UTC_MINUS_5)  # 🕒 Hora actual en UTC-5

    for dias_extra in range(dias_a_buscar):
        DIA = DIA_INICIAL + timedelta(days=dias_extra)

        # Define los rangos laborales para el día
        inicio_laboral = datetime.combine(DIA, HORARIO_LABORAL_INICIO, tzinfo=ZONA_UTC_MINUS_5)
        fin_laboral = datetime.combine(DIA, HORARIO_LABORAL_FIN, tzinfo=ZONA_UTC_MINUS_5)

        # Agrega bloques de no disponibilidad al día
        bloques_no_disponibles = []
        for bloque in HORARIOS_NO_DISPONIBLE:
            ini_no_disp = datetime.combine(DIA, bloque[0], tzinfo=ZONA_UTC_MINUS_5)
            fin_no_disp = datetime.combine(DIA, bloque[1], tzinfo=ZONA_UTC_MINUS_5)
            bloques_no_disponibles.append((ini_no_disp, fin_no_disp))

        # Bloques ocupados del día (eventos + no disponibles)
        bloques_ocupados = []
        for e in eventos:
            if e['start_dt'].date() == DIA:
                bloques_ocupados.append((e['start_dt'], e['end_dt']))

        # Unimos ambos bloques
        bloques_ocupados.extend(bloques_no_disponibles)
        bloques_ocupados.sort()

        # Buscar el primer hueco disponible en el día
        posible_inicio = inicio_laboral

        # 🕒 Si es hoy, no sugerir horas pasadas
        if DIA == ahora.date():
            posible_inicio = max(posible_inicio, ahora)

        for inicio, fin in bloques_ocupados:
            if posible_inicio + DURACION_EVENTO <= inicio:
                if posible_inicio >= inicio_laboral and (posible_inicio + DURACION_EVENTO) <= fin_laboral:
                    nuevo_inicio = posible_inicio
                    nuevo_fin = nuevo_inicio + DURACION_EVENTO

                    return {
                        "evento_a_mover": evento_conflictivo['title'],
                        "mensaje": (
                            f"Se sugiere mover '{evento_conflictivo['title']}' "
                            f"a las {nuevo_inicio.time().strftime('%H:%M')} del {DIA.isoformat()}"
                        ),
                        "nuevo_inicio": nuevo_inicio.isoformat(),
                        "nuevo_fin": nuevo_fin.isoformat()
                    }

            # Avanzamos al final del bloque ocupado
            posible_inicio = max(posible_inicio, fin)

        # Verificar espacio al final de la jornada
        if posible_inicio + DURACION_EVENTO <= fin_laboral:
            if DIA != ahora.date() or posible_inicio >= ahora:
                nuevo_inicio = posible_inicio
                nuevo_fin = nuevo_inicio + DURACION_EVENTO

                return {
                    "evento_a_mover": evento_conflictivo['title'],
                    "mensaje": (
                        f"Se sugiere mover '{evento_conflictivo['title']}' "
                        f"a las {nuevo_inicio.time().strftime('%H:%M')} del {DIA.isoformat()}"
                    ),
                    "nuevo_inicio": nuevo_inicio.isoformat(),
                    "nuevo_fin": nuevo_fin.isoformat()
                }

    # Si no hay hueco en los siguientes días
    return {
        "evento_a_mover": evento_conflictivo['title'],
        "mensaje": (
            f"No se encontró espacio en los próximos {dias_a_buscar} días para "
            f"'{evento_conflictivo['title']}'"
        ),
        "nuevo_inicio": None,
        "nuevo_fin": None
    }
