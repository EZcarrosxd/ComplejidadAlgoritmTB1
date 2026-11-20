import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { vista } from './camara.js';
import { COLOR, radioNodo, estaApagado, dibujarEtiquetas } from './dibujo-grafo.js';
import { dibujarExtremos } from './capas-grafo.js';

const PARTICULAS_POR_TRAMO = 2;
const VELOCIDAD_CORRIENTE = 0.9;
const ARISTAS_RECIENTES = 25;
const DURACION_ONDA = 1.6;
const SEPARACION_FONDO = 24;

const color = (valor) => new THREE.Color(valor);
const TONOS = {
    tinta: color(COLOR.ink), tenue: color('#B9B2A6'), blanco: color('#FFFFFF'),
    rojo: color(COLOR.red), rojoSuave: color('#FBEDEA'), rojoClaro: color('#E3A097'),
};

function capa(escena, objeto, orden) {
    objeto.renderOrder = orden;
    objeto.frustumCulled = false;
    for (const material of [objeto.material].flat()) {
        material.depthTest = false;
        material.depthWrite = false;
    }
    escena.add(objeto);
    return objeto;
}

function crearFondo() {
    return new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
        uniforms: { desplazamiento: { value: new THREE.Vector2() }, densidad: { value: 1 } },
        vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader: `
            uniform vec2 desplazamiento;
            uniform float densidad;
            void main() {
                vec2 celda = mod(gl_FragCoord.xy / densidad - desplazamiento, ${SEPARACION_FONDO.toFixed(1)});
                bool punto = celda.x < 2.0 && celda.y < 2.0;
                gl_FragColor = punto ? vec4(0.894, 0.871, 0.831, 1.0) : vec4(0.980, 0.973, 0.961, 1.0);
            }`,
    }));
}

function crearTexturaCirculo() {
    const lienzo = document.createElement('canvas');
    lienzo.width = lienzo.height = 64;
    const pincel = lienzo.getContext('2d');
    pincel.fillStyle = '#FFFFFF';
    pincel.beginPath(); pincel.arc(32, 32, 30, 0, Math.PI * 2); pincel.fill();
    return new THREE.CanvasTexture(lienzo);
}

function crearInstancias(escena, geometria, cantidad, orden, opciones = {}) {
    const material = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, ...opciones });
    const malla = new THREE.InstancedMesh(geometria, material, Math.max(cantidad, 1));
    malla.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    malla.setColorAt(0, TONOS.blanco);
    return capa(escena, malla, orden);
}

export function crearMotor(lienzo) {
    const textos = document.createElement('canvas');
    textos.className = 'graph-canvas graph-textos';
    textos.setAttribute('aria-hidden', 'true');
    lienzo.after(textos);
    const ctxTextos = textos.getContext('2d');

    const renderizador = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
    const escena = new THREE.Scene();
    const camara = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
    const materialesGruesos = [];
    const auxiliar = new THREE.Object3D();
    const circulo = new THREE.CircleGeometry(1, 24);
    const diamante = new THREE.CircleGeometry(1, 4);
    const anillo = new THREE.RingGeometry(0.84, 1, 48);
    let densidad = 1;
    const tamano = new THREE.Vector2(1, 1);
    let actual = null;
    let partes = null;
    let lineasCapa = [];

    const fondo = capa(escena, crearFondo(), 0);

    function gruesa(orden, tono, grosor, opacidad = 1) {
        const material = new LineMaterial({ color: tono, linewidth: grosor, transparent: opacidad < 1, opacity: opacidad, resolution: tamano.clone() });
        materialesGruesos.push(material);
        return capa(escena, new LineSegments2(new LineSegmentsGeometry(), material), orden);
    }

    function posicionesDe(m, pares) {
        const valores = new Float32Array(Math.max(pares.length, 1) * 6);
        pares.forEach(([a, b], k) => valores.set([m.pos.x[a], -m.pos.y[a], 0, m.pos.x[b], -m.pos.y[b], 0], k * 6));
        return valores;
    }

    function construir(m) {
        if (partes) {
            for (const objeto of [...Object.values(partes), ...lineasCapa]) {
                escena.remove(objeto);
                objeto.geometry?.dispose();
            }
        }
        lineasCapa = [];
        const cantidad = m.pos.cantidad;
        const criticos = m.esCritico.filter(Boolean).length;
        const geometriaLineas = new THREE.BufferGeometry();
        geometriaLineas.setAttribute('position', new THREE.BufferAttribute(posicionesDe(m, m.aristas), 3));
        const texturaCirculo = crearTexturaCirculo();

        partes = {
            lineas: capa(escena, new THREE.LineSegments(geometriaLineas,
                new THREE.LineBasicMaterial({ color: '#787064', transparent: true, opacity: 0.4 })), 1),
            lineasFalla: capa(escena, new THREE.LineSegments(new THREE.BufferGeometry(),
                new THREE.LineDashedMaterial({ color: COLOR.red, dashSize: 4, gapSize: 5 })), 2),
            mst: gruesa(3, COLOR.lime, 2.5),
            mstReciente: gruesa(4, '#5CBE56', 6, 0.55),
            flujoHalo: gruesa(3, '#D98A1C', 6, 0.22),
            flujo: gruesa(4, COLOR.amber, 2.5),
            corte: gruesa(5, COLOR.red, 3),
            particulas: capa(escena, new THREE.Points(
                new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(Math.max(m.caminos.length, 1) * PARTICULAS_POR_TRAMO * 3), 3)),
                new THREE.PointsMaterial({ color: '#F2A23A', map: texturaCirculo, transparent: true, alphaTest: 0.5, sizeAttenuation: false })), 6),
            halosApagados: crearInstancias(escena, circulo, cantidad, 7, { opacity: 0.14 }),
            sombras: crearInstancias(escena, circulo, cantidad, 8, { opacity: 0.12 }),
            aros: crearInstancias(escena, circulo, cantidad, 9),
            rellenos: crearInstancias(escena, circulo, cantidad, 10),
            centros: crearInstancias(escena, circulo, cantidad, 11),
            halosCriticos: crearInstancias(escena, circulo, criticos, 12),
            sombrasCriticas: crearInstancias(escena, diamante, criticos, 13, { opacity: 0.12 }),
            bordesCriticos: crearInstancias(escena, diamante, criticos, 14),
            rombos: crearInstancias(escena, diamante, criticos, 15),
            ondas: crearInstancias(escena, anillo, 2, 16),
            cruz: gruesa(17, COLOR.red, 4),
            marcas: crearInstancias(escena, anillo, 3, 18),
            capaNodos: crearInstancias(escena, circulo, cantidad * 3 + 4, 11.5),
            focoBorde: gruesa(16.5, COLOR.ink, 6),
            focoCentro: gruesa(16.6, '#FFFFFF', 2.5),
        };
        partes.mst.geometry.setPositions(posicionesDe(m, m.mst));
        partes.flujo.geometry.setPositions(posicionesDe(m, m.caminos));
        partes.flujoHalo.geometry.setPositions(posicionesDe(m, m.caminos));
        partes.corte.geometry.setPositions(posicionesDe(m, m.corte));
        partes.sombras.material.color.set('#1F1E1B');
        partes.sombrasCriticas.material.color.set('#1F1E1B');
        partes.halosApagados.material.color.set(COLOR.red);
        actual = { modelo: m, falla: null, capa: null };
    }

    function colocar(malla, k, x, y, escala) {
        auxiliar.position.set(x, y, 0);
        auxiliar.scale.setScalar(escala);
        auxiliar.updateMatrix();
        malla.setMatrixAt(k, auxiliar.matrix);
    }

    function actualizarLineasFalla(m, falla) {
        if (actual.falla === falla) return;
        actual.falla = falla;
        const visibles = falla ? m.aristas.filter((e) => e[0] !== falla.indice && e[1] !== falla.indice) : m.aristas;
        partes.lineas.geometry.setAttribute('position', new THREE.BufferAttribute(posicionesDe(m, visibles), 3));
        const caidas = falla ? m.aristas.filter((e) => e[0] === falla.indice || e[1] === falla.indice) : [];
        partes.lineasFalla.geometry.setAttribute('position', new THREE.BufferAttribute(posicionesDe(m, caidas), 3));
        partes.lineasFalla.geometry.setDrawRange(0, caidas.length * 2);
        partes.lineasFalla.computeLineDistances();
    }

    function actualizarNodos(c, escalaPixel) {
        const { m, pos, modo, falla } = c;
        let comunes = 0, apagados = 0;
        for (let i = 0; i < pos.cantidad; i++) {
            if (m.esCritico[i] || (falla && i === falla.indice)) continue;
            const x = pos.x[i], y = -pos.y[i], r = radioNodo(m, i) * escalaPixel;
            let aro = modo === 'general' ? TONOS.tinta : TONOS.tenue;
            let relleno = TONOS.blanco;
            if (falla) {
                const apagado = estaApagado(c, i);
                aro = apagado ? TONOS.rojo : TONOS.tenue;
                relleno = apagado ? TONOS.rojoSuave : TONOS.blanco;
                if (apagado) colocar(partes.halosApagados, apagados++, x, y, r * 2.4);
            }
            colocar(partes.sombras, comunes, x, y - 1.2 * escalaPixel, r + 0.8 * escalaPixel);
            colocar(partes.aros, comunes, x, y, r);
            colocar(partes.rellenos, comunes, x, y, Math.max(r - 1.6 * escalaPixel, 0.8 * escalaPixel));
            const conCentro = m.grado[i] >= 4 && r / escalaPixel > 2.6;
            colocar(partes.centros, comunes, x, y, conCentro ? r * 0.38 : 0);
            partes.aros.setColorAt(comunes, aro);
            partes.rellenos.setColorAt(comunes, relleno);
            partes.centros.setColorAt(comunes, aro);
            comunes++;
        }
        for (const nombre of ['sombras', 'aros', 'rellenos', 'centros']) {
            partes[nombre].count = comunes;
            partes[nombre].instanceMatrix.needsUpdate = true;
            if (partes[nombre].instanceColor) partes[nombre].instanceColor.needsUpdate = true;
        }
        partes.halosApagados.count = apagados;
        partes.halosApagados.instanceMatrix.needsUpdate = true;
    }

    function actualizarCriticos(c, escalaPixel) {
        const { m, pos, falla, t, modo } = c;
        const destacado = modo === 'general' || modo === 'fallas';
        let k = 0, dibujados = 0;
        for (let i = 0; i < pos.cantidad; i++) {
            if (!m.esCritico[i]) continue;
            k++;
            if (falla && i === falla.indice) continue;
            const x = pos.x[i], y = -pos.y[i], r = (radioNodo(m, i) + 2) * escalaPixel;
            const apagado = falla && !estaApagado(c, i);
            const pulso = 1 + Math.sin(t * 3 + k) * 0.18;
            colocar(partes.halosCriticos, dibujados, x, y, destacado ? r * 2.1 * pulso : 0);
            partes.halosCriticos.setColorAt(dibujados, apagado ? TONOS.rojoSuave : TONOS.rojoClaro);
            colocar(partes.sombrasCriticas, dibujados, x, y - 1.2 * escalaPixel, r + 0.8 * escalaPixel);
            colocar(partes.bordesCriticos, dibujados, x, y, r + 1.5 * escalaPixel);
            colocar(partes.rombos, dibujados, x, y, r);
            partes.rombos.setColorAt(dibujados, apagado || !destacado ? TONOS.rojoClaro : TONOS.rojo);
            dibujados++;
        }
        partes.halosCriticos.material.opacity = 0.45;
        for (const nombre of ['halosCriticos', 'sombrasCriticas', 'bordesCriticos', 'rombos']) {
            partes[nombre].count = dibujados;
            partes[nombre].instanceMatrix.needsUpdate = true;
            if (partes[nombre].instanceColor) partes[nombre].instanceColor.needsUpdate = true;
        }
    }

    function actualizarMst(c) {
        const cantidad = Math.floor(c.m.mst.length * c.kruskal);
        partes.mst.visible = c.modo === 'mst';
        partes.mst.geometry.instanceCount = cantidad;
        const recientes = c.modo === 'mst' && c.kruskal < 1;
        partes.mstReciente.visible = recientes && cantidad > 0;
        if (partes.mstReciente.visible) {
            partes.mstReciente.geometry.setPositions(posicionesDe(c.m, c.m.mst.slice(Math.max(0, cantidad - ARISTAS_RECIENTES), cantidad)));
        }
    }

    function actualizarFlujo(c) {
        const activo = c.modo === 'flujo';
        for (const nombre of ['flujo', 'flujoHalo', 'corte', 'particulas']) partes[nombre].visible = activo;
        if (!activo) return;
        const { m, pos, t } = c;
        const atributo = partes.particulas.geometry.attributes.position;
        m.caminos.forEach(([a, b], tramo) => {
            for (let p = 0; p < PARTICULAS_POR_TRAMO; p++) {
                const avance = (t * VELOCIDAD_CORRIENTE + p / PARTICULAS_POR_TRAMO) % 1;
                const k = (tramo * PARTICULAS_POR_TRAMO + p) * 3;
                atributo.array[k] = pos.x[a] + (pos.x[b] - pos.x[a]) * avance;
                atributo.array[k + 1] = -(pos.y[a] + (pos.y[b] - pos.y[a]) * avance);
            }
        });
        atributo.needsUpdate = true;
        partes.particulas.geometry.setDrawRange(0, m.caminos.length * PARTICULAS_POR_TRAMO);
        partes.particulas.material.size = 6 * densidad;
    }

    function actualizarFalla(c, escalaPixel) {
        const { m, pos, falla, t } = c;
        actualizarLineasFalla(m, falla);
        partes.lineasFalla.visible = Boolean(falla);
        partes.lineasFalla.material.dashSize = 4 * escalaPixel;
        partes.lineasFalla.material.gapSize = 5 * escalaPixel;
        const caido = falla && falla.indice >= 0;
        partes.cruz.visible = caido;
        partes.ondas.count = caido && falla.perdidos > 0 ? 2 : 0;
        if (!caido) return;
        const x = pos.x[falla.indice], y = -pos.y[falla.indice], d = 9 * escalaPixel;
        partes.cruz.geometry.setPositions([x - d, y - d, 0, x + d, y + d, 0, x + d, y - d, 0, x - d, y + d, 0]);
        for (let onda = 0; onda < 2; onda++) {
            const fase = ((t - falla.inicio) / DURACION_ONDA + onda / 2) % 1;
            colocar(partes.ondas, onda, x, y, (10 + fase * 90) * escalaPixel);
            partes.ondas.setColorAt(onda, new THREE.Color(COLOR.red).lerp(TONOS.blanco, fase));
        }
        partes.ondas.instanceMatrix.needsUpdate = true;
        if (partes.ondas.instanceColor) partes.ondas.instanceColor.needsUpdate = true;
    }

    function lineaDeCapa(k) {
        if (!lineasCapa[k]) lineasCapa[k] = gruesa(5.5 + k * 0.01, '#FFFFFF', 2);
        return lineasCapa[k];
    }

    function reconstruirCapa(c) {
        const { m, capa } = c;
        actual.capa = capa;
        lineasCapa.forEach((linea) => { linea.visible = false; });
        partes.focoBorde.visible = partes.focoCentro.visible = false;
        if (!capa) return;
        capa.aristas.forEach((grupo, k) => {
            if (!grupo.pares.length) return;
            const linea = lineaDeCapa(k);
            linea.material.color.set(grupo.color);
            linea.material.linewidth = grupo.grosor;
            linea.geometry.setPositions(posicionesDe(m, grupo.pares));
            linea.visible = true;
        });
        if (capa.foco?.par) {
            const posiciones = posicionesDe(m, [capa.foco.par]);
            partes.focoBorde.geometry.setPositions(posiciones);
            partes.focoCentro.geometry.setPositions(posiciones);
            partes.focoBorde.visible = partes.focoCentro.visible = true;
        }
    }

    function actualizarCapa(c, escalaPixel) {
        if (c.capa !== actual.capa) reconstruirCapa(c);
        let k = 0;
        for (const grupo of c.capa?.nodos ?? []) {
            const tono = new THREE.Color(grupo.color);
            for (const i of grupo.indices) {
                if (i < 0) continue;
                colocar(partes.capaNodos, k, c.pos.x[i], -c.pos.y[i], (radioNodo(c.m, i) + grupo.radio) * escalaPixel);
                partes.capaNodos.setColorAt(k++, tono);
            }
        }
        partes.capaNodos.count = k;
        partes.capaNodos.instanceMatrix.needsUpdate = true;
        if (partes.capaNodos.instanceColor) partes.capaNodos.instanceColor.needsUpdate = true;
    }

    function actualizarMarcas(c, escalaPixel) {
        const { m, pos, bajoPuntero, sel, modo, capa, t } = c;
        let k = 0;
        const foco = capa?.foco?.nodo;
        if (foco !== undefined && foco >= 0) {
            colocar(partes.marcas, k, pos.x[foco], -pos.y[foco], (radioNodo(m, foco) + 8 + Math.sin(t * 6) * 1.5) * escalaPixel);
            partes.marcas.setColorAt(k++, TONOS.tinta);
        }
        if (bajoPuntero >= 0) {
            colocar(partes.marcas, k, pos.x[bajoPuntero], -pos.y[bajoPuntero], (radioNodo(m, bajoPuntero) + 6) * escalaPixel);
            partes.marcas.setColorAt(k++, new THREE.Color(COLOR.amber));
        }
        if (sel >= 0 && (modo === 'general' || modo === 'mst')) {
            colocar(partes.marcas, k, pos.x[sel], -pos.y[sel], (radioNodo(m, sel) + 7.5) * escalaPixel);
            partes.marcas.setColorAt(k++, TONOS.tinta);
        }
        partes.marcas.count = k;
        partes.marcas.instanceMatrix.needsUpdate = true;
        if (partes.marcas.instanceColor) partes.marcas.instanceColor.needsUpdate = true;
    }

    function redimensionar(w, h, escala) {
        densidad = escala;
        renderizador.setPixelRatio(escala);
        renderizador.setSize(w, h, false);
        textos.width = Math.round(w * escala);
        textos.height = Math.round(h * escala);
        tamano.set(w, h);
        materialesGruesos.forEach((material) => material.resolution.set(w, h));
    }

    function dibujar(entrada) {
        const c = entrada.capa ? { ...entrada, modo: 'capa', falla: null } : entrada;
        if (!partes || actual.modelo !== c.m) construir(c.m);
        const { w, h, modo } = c;
        const escalaPixel = 1 / vista.escala;
        camara.left = -vista.desplazamientoX / vista.escala;
        camara.right = (w - vista.desplazamientoX) / vista.escala;
        camara.top = vista.desplazamientoY / vista.escala;
        camara.bottom = -(h - vista.desplazamientoY) / vista.escala;
        camara.updateProjectionMatrix();

        fondo.material.uniforms.densidad.value = densidad;
        fondo.material.uniforms.desplazamiento.value.set(vista.desplazamientoX, h - vista.desplazamientoY);
        partes.lineas.material.opacity = (modo === 'general' ? 0.4 : 0.18) * (0.25 + 0.75 * c.entrada);

        actualizarMst(c);
        actualizarFlujo(c);
        actualizarFalla(c, escalaPixel);
        actualizarNodos(c, escalaPixel);
        actualizarCriticos(c, escalaPixel);
        actualizarCapa(c, escalaPixel);
        actualizarMarcas(c, escalaPixel);
        renderizador.render(escena, camara);

        ctxTextos.setTransform(densidad, 0, 0, densidad, 0, 0);
        ctxTextos.clearRect(0, 0, w, h);
        const conTexto = { ...c, ctx: ctxTextos };
        dibujarEtiquetas(conTexto);
        if (modo === 'flujo') dibujarExtremos(conTexto);
    }

    return { redimensionar, dibujar };
}
