import { ErrorServidor, LIMITE_ESPERA_MINUTOS, MENSAJE_SIN_CONEXION } from './api.js';

const FORMATO = 'Revisa el formato de nodos y aristas y el precio por metro';

export function explicarError(error) {
    if (error?.name === 'TimeoutError') {
        return {
            titulo: `Se agotó el tiempo de espera de ${LIMITE_ESPERA_MINUTOS} minutos`,
            indicacion: 'Vuelve a intentar el análisis',
        };
    }
    if (error instanceof ErrorServidor) {
        if (error.estadoHttp === 413) {
            return { titulo: error.message, indicacion: 'Reduce el archivo o divide la red en partes más pequeñas' };
        }
        if (error.estadoHttp >= 500) {
            return { titulo: 'El servidor tuvo un problema al analizar la red', indicacion: 'Espera un momento y vuelve a intentarlo' };
        }
        return { titulo: error.message, indicacion: FORMATO };
    }
    return {
        titulo: MENSAJE_SIN_CONEXION,
        indicacion: 'Verifica tu conexión o espera a que inicie el servidor antes de reintentar',
    };
}

const MIB = 1024 * 1024;
const LIMITE_MIB = 64;

export function validarArchivo(archivo) {
    if (!archivo.name.toLowerCase().endsWith('.json')) {
        return { titulo: `"${archivo.name}" no es un archivo JSON`, indicacion: 'Elige un archivo con extensión .json' };
    }
    if (archivo.size > LIMITE_MIB * MIB) {
        return { titulo: `El archivo supera los ${LIMITE_MIB} MiB`, indicacion: 'Reduce el archivo o divide la red en partes más pequeñas' };
    }
    return null;
}
