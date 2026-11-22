import { API_URL } from './config.js';

export const MENSAJE_SIN_CONEXION = 'No se pudo conectar con el servidor';
export const LIMITE_ESPERA_MINUTOS = 5;

const base = () => API_URL.trim().replace(/\/+$/, '');

export class ErrorServidor extends Error {
    constructor(mensaje, estadoHttp) {
        super(mensaje);
        this.estadoHttp = estadoHttp;
    }
}

export async function conLimiteDeEspera(operacion, control = new AbortController()) {
    const temporizador = setTimeout(() => {
        control.abort(new DOMException('Tiempo de espera agotado', 'TimeoutError'));
    }, LIMITE_ESPERA_MINUTOS * 60_000);

    try {
        return await operacion(control.signal);
    } catch (error) {
        throw control.signal.aborted ? control.signal.reason : error;
    } finally {
        clearTimeout(temporizador);
    }
}

export async function analizarRed(archivo, { origen, destino, senal } = {}) {
    const formulario = new FormData();
    formulario.append('file', archivo);
    if (origen && destino) {
        formulario.append('origen', origen);
        formulario.append('destino', destino);
    }

    const respuesta = await fetch(`${base()}/api/upload`, { method: 'POST', body: formulario, signal: senal });
    const json = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
        throw new ErrorServidor(json.error || `El servidor respondió con error ${respuesta.status}`, respuesta.status);
    }
    if (!json.datos) throw new ErrorServidor('Respuesta inesperada\nRevisa la URL del backend', 0);
    return json.datos;
}

export async function obtenerEjemplo(senal) {
    const respuesta = await fetch(`${base()}/api/ejemplo`, { signal: senal });
    if (!respuesta.ok) throw new ErrorServidor('No se pudo descargar la red de ejemplo', respuesta.status);
    const contenido = await respuesta.blob();
    return new File([contenido], 'dataset.json', { type: 'application/json' });
}

export async function analizarGeorreferenciado(grafoCompacto, senal) {
    const respuesta = await fetch(`${base()}/api/georreferenciado/analizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(grafoCompacto),
        signal: senal,
    });
    const json = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
        throw new ErrorServidor(json.error || `El servidor respondió con error ${respuesta.status}`, respuesta.status);
    }
    return json;
}
