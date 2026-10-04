import { $, crear, fmtNum } from './dom.js';
import { estado, actualizar, suscribir, toca } from './state.js';
import { recalcularFlujo, deshacerFlujo } from './flow.js';

const origen = $('origen');
const destino = $('destino');

function pintarResumen(datos) {
    const meta = datos.metadata;
    const extra = meta.seleccion_flujo === 'automatica'
        ? ' Extremos elegidos automáticamente: dos puntos muy alejados entre sí.'
        : '';
    $('resumen-flujo').replaceChildren(
        crear('strong', '', `${fmtNum.format(datos.flujo_maximo_red)} A`), ' de ',
        crear('strong', '', meta.origen_flujo), ' a ',
        crear('strong', '', meta.destino_flujo), `.${extra}`,
    );
}

function pintarOpciones(ids) {
    $('lista-nodos').replaceChildren(...ids.map((id) => {
        const opcion = document.createElement('option');
        opcion.value = id;
        return opcion;
    }));
}

suscribir((s, cambios) => {
    if (toca(cambios, 'datos') && s.datos) pintarResumen(s.datos);
    if (toca(cambios, 'fase') && s.fase === 'results') pintarOpciones(s.datos.metadata.ids_nodos);
    if (toca(cambios, 'origen') && origen.value !== s.origen) origen.value = s.origen;
    if (toca(cambios, 'destino') && destino.value !== s.destino) destino.value = s.destino;
    if (toca(cambios, 'siguiente')) {
        origen.classList.toggle('is-next', s.siguiente === 'origen');
        destino.classList.toggle('is-next', s.siguiente === 'destino');
    }
    if (toca(cambios, 'errorFlujo')) {
        $('error-flujo').hidden = !s.errorFlujo;
        $('error-flujo').textContent = s.errorFlujo;
    }
    if (toca(cambios, 'previo', 'calculando')) {
        $('btn-deshacer').disabled = !s.previo || s.calculando;
        $('btn-calcular').disabled = s.calculando;
        $('btn-calcular').textContent = s.calculando ? 'Calculando…' : 'Calcular';
    }
});

origen.addEventListener('input', () => actualizar({ origen: origen.value, errorFlujo: '' }));
destino.addEventListener('input', () => actualizar({ destino: destino.value, errorFlujo: '' }));

$('btn-intercambiar').addEventListener('click', () => {
    actualizar({ origen: estado.destino, destino: estado.origen });
});

$('form-flujo').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!estado.calculando) recalcularFlujo(estado.origen, estado.destino);
});

$('btn-deshacer').addEventListener('click', deshacerFlujo);
