import { $ } from './dom.js';
import { localizarNodo } from './graph.js';

export function renderCriticos(criticos, visibles) {
    const lista = $('list-criticos');
    const hint = $('critical-hint');
    lista.replaceChildren();

    if (criticos.length === 0) {
        $('critical-note').textContent = 'No hay puntos de articulación. Esto no garantiza tolerancia a fallas de líneas.';
        hint.hidden = true;
        return;
    }

    $('critical-note').textContent = 'Si falla uno, parte de la red queda incomunicada. Detectados con DFS.';

    const enGrafo = criticos.filter((id) => visibles.has(id));
    const fueraDelGrafo = criticos.filter((id) => !visibles.has(id));

    hint.hidden = false;
    hint.textContent = enGrafo.length
        ? 'Haz clic en un nodo eléctrico para ubicarlo en el grafo.'
        : 'Ninguno aparece en el subgrafo mostrado.';

    enGrafo.forEach((id) => {
        const li = document.createElement('li');
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'chip';
        boton.textContent = id;
        boton.addEventListener('click', () => localizarNodo(id));
        li.appendChild(boton);
        lista.appendChild(li);
    });

    fueraDelGrafo.forEach((id) => {
        const li = document.createElement('li');
        const chip = document.createElement('span');
        chip.className = 'chip chip--muted';
        chip.textContent = id;
        chip.title = 'No aparece en el subgrafo mostrado';
        li.appendChild(chip);
        lista.appendChild(li);
    });
}
