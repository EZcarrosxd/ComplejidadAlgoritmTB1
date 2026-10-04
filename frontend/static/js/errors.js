import { ErrorServidor, MENSAJE_SIN_CONEXION } from './api.js';

const FORMATO = 'Usa un .json con la lista "conexiones" (origen, destino y distancia_m) o un .csv con las columnas origen,destino,distancia_m.';

export function explicarError(error) {
    if (error instanceof ErrorServidor) {
        if (error.estadoHttp === 413) {
            return { titulo: error.message, fix: 'Reduce el archivo o divide la red en partes más pequeñas.' };
        }
        if (error.estadoHttp >= 500) {
            return { titulo: 'El servidor tuvo un problema al analizar la red.', fix: 'Espera un momento y vuelve a intentarlo.' };
        }
        return { titulo: error.message, fix: FORMATO };
    }
    return {
        titulo: MENSAJE_SIN_CONEXION,
        fix: 'Puede estar iniciándose; la primera vez tarda hasta un minuto. Espera un momento y vuelve a intentarlo.',
    };
}

export function validarArchivo(archivo) {
    const extension = (archivo.name.split('.').pop() || '').toLowerCase();
    if (extension !== 'json' && extension !== 'csv') {
        return { titulo: `"${archivo.name}" no es un archivo .json ni .csv.`, fix: 'Elige un archivo con una de esas extensiones.' };
    }
    if (archivo.size > 10 * 1024 * 1024) {
        return { titulo: 'El archivo supera los 10 MiB.', fix: 'Reduce el archivo o divide la red en partes más pequeñas.' };
    }
    return null;
}
