# Convierte el día de la semana de texto a número
def mapear_dia_semana(dia):
    dias = {
        'Lunes': 0,
        'Martes': 1,
        'Miércoles': 2,
        'Jueves': 3,
        'Viernes': 4,
        'Sábado': 5,
        'Domingo': 6
    }
    return dias.get(dia, -1)

# Convierte el estado del evento a 1 si fue aceptado, 0 si fue rechazado
def mapear_estado(estado):
    return 1 if estado.lower() == 'aceptado' else 0
