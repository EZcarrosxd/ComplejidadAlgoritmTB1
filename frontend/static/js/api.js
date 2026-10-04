import { API_URL } from './config.js';

export const MENSAJE_SIN_CONEXION = 'No se pudo conectar con el servidor. Puede estar iniciándose; espera un momento y vuelve a intentarlo.';

export async function analizarRed(file, origen, destino) {
    const formData = new FormData();
    formData.append('file', file);
    if (origen && destino) {
        formData.append('origen', origen);
        formData.append('destino', destino);
    }

    const base = API_URL.trim().replace(/\/+$/, '');
    const response = await fetch(`${base}/api/upload`, { method: 'POST', body: formData });
    const jsonResponse = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(jsonResponse.error || `El servidor respondió con error ${response.status}.`);
    if (!jsonResponse.datos) throw new Error('Respuesta inesperada. Revisa la URL del backend.');
    return jsonResponse.datos;
}
