import { $, crear, formatoEntero, formatoMoneda } from './dom.js';
import { suscribir, toca } from './estado.js';

suscribir((s, cambios) => {
    if (!toca(cambios, 'datos') || !s.datos) return;
    const datos = s.datos;
    const meta = datos.metadata;
    const costo = datos.costo_minimo_instalacion;
    const total = meta.costo_total_red;
    const ahorro = total > 0 ? Math.round((1 - costo / total) * 100) : 0;

    const aviso = $('aviso-bosque');
    aviso.hidden = meta.red_conectada;
    aviso.textContent = `Tu red tiene ${meta.componentes} partes separadas: se muestra el cableado más barato de cada parte`;

    const filas = [
        ['Costo', `S/ ${formatoMoneda.format(costo)}`],
        ['Ahorro frente a todas las líneas', `S/ ${formatoMoneda.format(total - costo)} (${ahorro}%)`],
        ['Líneas usadas', `${formatoEntero.format(datos.aristas_mst.length)} de ${formatoEntero.format(meta.total_aristas)}`],
    ];
    $('filas-mst').replaceChildren(...filas.map(([clave, valor]) => {
        const fila = crear('div');
        fila.append(crear('dt', '', clave), crear('dd', '', valor));
        return fila;
    }));
});
