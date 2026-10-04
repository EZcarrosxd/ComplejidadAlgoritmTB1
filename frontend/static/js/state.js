const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const estado = {
    fase: 'upload',
    archivo: null,
    arrastrando: false,
    error: null,
    pasos: [],
    datos: null,
    modelo: null,
    modo: 'general',
    sel: null,
    falla: null,
    todosCriticos: false,
    origen: '',
    destino: '',
    siguiente: 'origen',
    errorFlujo: '',
    previo: null,
    calculando: false,
    ayuda: false,
    grande: false,
    quieto: movimientoReducido,
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
