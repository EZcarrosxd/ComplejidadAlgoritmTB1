import { $, crear, fmtInt, plural } from './dom.js';
import { estado, actualizar, suscribir, toca } from './state.js';
import { simularFalla, restaurar } from './actions.js';

const MOSTRAR = 12;

function pintarFalla(falla) {
    $('falla').hidden = !falla;
    $('sin-falla').hidden = Boolean(falla);
    if (!falla) return;
    $('falla').classList.toggle('is-split', falla.perdidos > 0);
    $('falla-titulo').textContent = `Si falla ${falla.id}`;
    $('falla-texto').textContent = falla.perdidos > 0
        ? `${plural(falla.perdidos, 'punto queda', 'puntos quedan')} sin luz.`
        : 'La red sigue funcionando.';
}

function crearItem(critico, maximo, falla) {
    const boton = crear('button', 'crit-item');
    boton.type = 'button';
    boton.setAttribute('aria-pressed', String(Boolean(falla) && falla.id === critico.id));
    const barra = crear('span', 'crit-bar');
    barra.setAttribute('aria-hidden', 'true');
    const relleno = crear('span');
    relleno.style.width = `${Math.max(3, critico.nodos_aislados / maximo * 100)}%`;
    barra.append(relleno);
    boton.append(
        crear('span', 'crit-id', critico.id), barra,
        crear('span', 'crit-lost', plural(critico.nodos_aislados, 'punto', 'puntos')),
    );
    boton.addEventListener('click', () => simularFalla(critico.id));
    const item = crear('li');
    item.append(boton);
    return item;
}

suscribir((s, cambios) => {
    if (!toca(cambios, 'datos', 'falla', 'todosCriticos') || !s.datos) return;
    const lista = s.datos.impacto_criticos;
    const maximo = Math.max(1, ...lista.map((c) => c.nodos_aislados));
    const visibles = s.todosCriticos ? lista : lista.slice(0, MOSTRAR);

    $('nota-criticos').hidden = lista.length > 0;
    $('nota-criticos').textContent = 'No se encontraron puntos débiles.';
    $('conteo-criticos').textContent = plural(lista.length, 'punto débil', 'puntos débiles');
    pintarFalla(s.falla);
    $('lista-criticos').replaceChildren(...visibles.map((c) => crearItem(c, maximo, s.falla)));

    const verTodos = $('btn-ver-todos');
    verTodos.hidden = lista.length <= MOSTRAR;
    verTodos.textContent = s.todosCriticos ? 'Ver menos' : `Ver todos (${fmtInt.format(lista.length)})`;
});

$('btn-restaurar').addEventListener('click', restaurar);
$('btn-ver-todos').addEventListener('click', () => actualizar({ todosCriticos: !estado.todosCriticos }));
