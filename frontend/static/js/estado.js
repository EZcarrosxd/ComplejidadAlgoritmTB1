export const estado = {
    fase: 'subida',
    archivo: null,
    geografico: false,
    redGeografica: null,
    arrastrando: false,
    error: null,
    pasos: [],
    datos: null,
    modelo: null,
    modo: 'mst',
    sel: null,
    falla: null,
    todosCriticos: false,
    origen: '',
    destino: '',
    siguiente: 'origen',
    errorFlujo: '',
    previo: null,
    calculando: false,
    paso: null,
    reproduciendo: false,
    ayuda: false,
    grande: false,
};

const oyentes = new Set();

export function actualizar(cambios) {
    Object.assign(estado, cambios);
    oyentes.forEach((oyente) => oyente(estado, cambios));
}

export function suscribir(oyente) {
    oyentes.add(oyente);
    oyente(estado, { ...estado });
}

export const toca = (cambios, ...claves) => claves.some((clave) => clave in cambios);
