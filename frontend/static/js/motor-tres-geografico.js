import * as THREE from 'three';

function geometriaLineas(aristas) {
    let cantidad = 0;
    for (const arista of aristas) {
        for (const camino of arista.caminos) cantidad += camino.length / 2 - 1;
    }
    const posiciones = new Float32Array(cantidad * 6);
    let destino = 0;
    for (const arista of aristas) {
        for (const camino of arista.caminos) {
            for (let i = 2; i < camino.length; i += 2) {
                posiciones[destino] = camino[i - 2];
                posiciones[destino + 1] = -camino[i - 1];
                posiciones[destino + 3] = camino[i];
                posiciones[destino + 4] = -camino[i + 1];
                destino += 6;
            }
        }
    }
    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));
    return geometria;
}

function crearLineas(escena, aristas, orden, color, colorDiscontinuo) {
    const opciones = { depthTest: false, depthWrite: false };
    const continuo = new THREE.LineBasicMaterial({ color, ...opciones });
    const lineas = new THREE.LineSegments(geometriaLineas(aristas), continuo);
    let discontinuo = null;
    if (colorDiscontinuo && aristas.length) {
        discontinuo = new THREE.LineDashedMaterial({ color: colorDiscontinuo, dashSize: 5, gapSize: 4, ...opciones });
        lineas.computeLineDistances();
    }
    lineas.renderOrder = orden;
    lineas.frustumCulled = false;
    lineas.visible = aristas.length > 0;
    escena.add(lineas);
    return {
        colorear(colorBase, colorDetalle, detalle, escala) {
            continuo.color.set(colorBase);
            if (discontinuo && detalle) {
                discontinuo.color.set(colorDetalle);
                discontinuo.scale = escala;
                lineas.material = discontinuo;
            } else lineas.material = continuo;
        },
        liberar() {
            escena.remove(lineas);
            lineas.geometry.dispose();
            continuo.dispose();
            discontinuo?.dispose();
        },
    };
}

function crearPuntos(escena, nodos) {
    const posiciones = new Float32Array(nodos.length / 2 * 3);
    for (let i = 0; i < nodos.length / 2; i++) {
        posiciones[3 * i] = nodos[2 * i];
        posiciones[3 * i + 1] = -nodos[2 * i + 1];
    }
    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));
    const material = new THREE.ShaderMaterial({
        depthTest: false,
        depthWrite: false,
        uniforms: { diametro: { value: 3 } },
        vertexShader: `
            uniform float diametro;
            void main() {
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = diametro;
            }
        `,
        fragmentShader: `
            void main() {
                if (distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;
                gl_FragColor = vec4(vec3(0.09), 1.0);
            }
        `,
    });
    const puntos = new THREE.Points(geometria, material);
    puntos.frustumCulled = false;
    puntos.renderOrder = 10;
    escena.add(puntos);
    return puntos;
}

export function crearMotorTres(lienzo, contexto, grafo) {
    const renderizador = new THREE.WebGLRenderer({ canvas: lienzo, context: contexto, antialias: false });
    renderizador.setClearColor('#ffffff');
    const escena = new THREE.Scene();
    const camara = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camara.position.z = 1;
    const tramos = crearLineas(escena, grafo.tramos, 1, '#171717');
    const candidatas = crearLineas(escena, grafo.candidatas, 2, '#cfcfcf', '#616161');
    const puntos = crearPuntos(escena, grafo.nodos);
    let arbolActual = null, elegidas = [], anchoActual = 0, altoActual = 0, densidadActual = 0;

    return {
        dibujar(vista, ancho, alto, densidad, radio, arbol, detalle) {
            if (contexto.isContextLost()) return false;
            if (densidad !== densidadActual || ancho !== anchoActual || alto !== altoActual) {
                if (densidad !== densidadActual) renderizador.setPixelRatio(densidad);
                renderizador.setSize(ancho, alto, false);
                anchoActual = ancho;
                altoActual = alto;
                densidadActual = densidad;
            }
            if (arbolActual !== arbol) {
                elegidas.forEach((lineas) => lineas.liberar());
                elegidas = arbol ? [
                    crearLineas(escena, arbol.tramos, 3, '#2f6430'),
                    crearLineas(escena, arbol.candidatas, 4, '#8ca98d', '#619063'),
                ] : [];
                arbolActual = arbol;
            }
            tramos.colorear(arbol ? '#d2d2d2' : '#171717');
            candidatas.colorear(arbol ? '#dedede' : '#cfcfcf', arbol ? '#d2d2d2' : '#616161', detalle, vista.escala);
            if (arbol) elegidas[1].colorear('#8ca98d', '#619063', detalle, vista.escala);

            camara.right = ancho / (2 * vista.escala);
            camara.left = -camara.right;
            camara.top = alto / (2 * vista.escala);
            camara.bottom = -camara.top;
            camara.position.x = (ancho / 2 - vista.x) / vista.escala;
            camara.position.y = (vista.y - alto / 2) / vista.escala;
            camara.updateProjectionMatrix();
            puntos.material.uniforms.diametro.value = 2 * radio * densidad;
            renderizador.render(escena, camara);
            return !contexto.isContextLost();
        },
        liberar() {
            tramos.liberar();
            candidatas.liberar();
            elegidas.forEach((lineas) => lineas.liberar());
            puntos.geometry.dispose();
            puntos.material.dispose();
            renderizador.dispose();
            if (!contexto.isContextLost()) renderizador.forceContextLoss();
        },
    };
}
