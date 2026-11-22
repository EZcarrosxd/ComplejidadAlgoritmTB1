export const estado = {
    fase: 'subida',
    redGeografica: null,
    error: null,
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
