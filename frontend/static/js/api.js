import { API_URL } from './config.js';

export const MENSAJE_SIN_CONEXION = 'No se pudo conectar con el servidor.';

const base = () => API_URL.trim().replace(/\/+$/, '');

export class ErrorServidor extends Error {
    constructor(mensaje, estadoHttp) {
        super(mensaje);
        this.estadoHttp = estadoHttp;
    }
}

export async function analizarRed(archivo, { origen, destino, signal } = {}) {
    const formulario = new FormData();
    formulario.append('file', archivo);
    if (origen && destino) {
        formulario.append('origen', origen);
        formulario.append('destino', destino);
    }

    const respuesta = await fetch(`${base()}/api/upload`, { method: 'POST', body: formulario, signal });
    const json = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
        throw new ErrorServidor(json.error || `El servidor respondió con error ${respuesta.status}.`, respuesta.status);
    }
    if (!json.datos) throw new ErrorServidor('Respuesta inesperada. Revisa la URL del backend.', 0);
    return json.datos;
}

export async function obtenerEjemplo(signal) {
    const respuesta = await fetch(`${base()}/api/ejemplo`, { signal });
    if (!respuesta.ok) throw new ErrorServidor('No se pudo descargar la red de ejemplo.', respuesta.status);
    const contenido = await respuesta.blob();
    return new File([contenido], 'dataset.json', { type: 'application/json' });
}
