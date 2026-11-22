import { ErrorServidor, LIMITE_ESPERA_MINUTOS, MENSAJE_SIN_CONEXION } from './api.js';

const FORMATO = 'Usa un .json con la lista "conexiones" (origen, destino y distancia_m) o un .csv con las columnas origen,destino,distancia_m';

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
const LIMITE_SERVIDOR_MIB = 10;
const LIMITE_NAVEGADOR_MIB = 64;

export function validarArchivo(archivo, geografico = false) {
    const extension = (archivo.name.split('.').pop() || '').toLowerCase();
    if (extension !== 'json' && extension !== 'csv') {
        return { titulo: `"${archivo.name}" no es un archivo .json ni .csv`, indicacion: 'Elige un archivo con una de esas extensiones' };
    }
    const limite = geografico ? LIMITE_NAVEGADOR_MIB : LIMITE_SERVIDOR_MIB;
    if (archivo.size > limite * MIB) {
        return { titulo: `El archivo supera los ${limite} MiB`, indicacion: 'Reduce el archivo o divide la red en partes más pequeñas' };
    }
    return null;
}
