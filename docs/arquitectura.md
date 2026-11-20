# Arquitectura modular

El panel envía el archivo a FastAPI. La consola lee el archivo del disco

Ambas entradas entregan el contenido a `ProcesadorDataset`, que valida y construye el grafo, y luego llama a `AnalizadorRed`

`AnalizadorRed` reúne los resultados de costo, capacidad y fallas, y prepara el subgrafo para la interfaz

```text
Panel → API ───┐
               ├→ ProcesadorDataset → CargadorDataset → RedElectrica
Consola ───────┘          │
                          └→ AnalizadorRed
                             ├→ Costo → Kruskal y UFDS
                             ├→ Capacidad → Edmonds-Karp
                             ├→ Fallas → articulaciones y componentes
                             └→ Visualización → subgrafo
```

## Responsabilidades

| Carpeta/archivo | Responsabilidad |
|---|---|
| `app.py` | Iniciar el servidor |
| `main.py` | Leer argumentos y archivos de la consola y emitir JSON |
| `backend/fabrica.py` | Configurar FastAPI, conectar rutas y servir archivos de la interfaz |
| `backend/api/` | Recibir peticiones HTTP, servir la página y devolver resultados |
| `backend/services/procesar_dataset.py` | Compartir la carga y el análisis entre la API y la consola |
| `backend/data/` | Leer JSON/CSV y validar su estructura |
| `backend/domain/red.py` | Representar el grafo con listas de adyacencia |
| `backend/algorithms/` | Un algoritmo o estructura auxiliar por archivo |
| `backend/services/analisis.py` | Coordinar los cálculos y reunir sus resultados |
| `backend/services/costo.py` | Obtener el árbol o bosque mínimo y comparar su costo con el de la red completa |
| `backend/services/capacidad.py` | Calcular flujo máximo, caminos aumentantes y corte mínimo entre los extremos elegidos |
| `backend/services/extremos.py` | Elegir y validar los extremos de la consulta de capacidad |
| `backend/services/visualizacion.py` | Elegir y preparar el subgrafo visible |
| `backend/services/fallas.py` | Identificar nodos críticos y medir su impacto en la conectividad |
| `backend/schemas/` | Declarar la estructura de las respuestas de FastAPI |
| `frontend/templates/` | Fragmentos HTML por sección de la pantalla |
| `frontend/static/js/` | Módulos por comportamiento de la interfaz |
| `frontend/static/css/` | Estilos por componente |
| `tests/` | Casos pequeños verificables y pruebas del dataset completo |

Se usan funciones,
listas, diccionarios, conjuntos, colas y clases pequeñas

No hay un framework
adicional de arquitectura ni herencia innecesaria

## SOLID aplicado

- **S, responsabilidad única:** leer CSV no calcula flujo ni conoce HTTP
- **O, abierto a extensión:** otro formato implementa `leer(texto)` y se registra
  en `ProcesadorDataset`

  El cargador y los algoritmos permanecen iguales
- **L, sustitución:** `LectorJson` y `LectorCsv` cumplen el mismo contrato de
  devolver un diccionario de datos crudos o un error de validación
- **I, interfaces pequeñas:** `LectorDataset` tiene solamente `leer`
- **D, inversión de dependencias:** el cargador recibe lectores compatibles con
  ese contrato y las rutas de FastAPI reciben el procesador con `Depends`

`Protocol` describe lo que un lector debe hacer

No obliga a heredar de una clase

Los algoritmos son funciones independientes: SOLID no exige convertir todo en clases

## Decisiones simples

En local, la API y el panel pueden servirse en el mismo puerto

El frontend también funciona en un alojamiento estático. `bootstrap.js` carga los
fragmentos HTML y espera a que los módulos registren sus eventos antes de habilitar
los controles

No requiere Python ni compilación

`config.js` contiene la dirección del backend; vacía significa el mismo origen

El grafo tiene dos motores de dibujo con la misma interfaz
`motor-three.js` usa three.js con WebGL y es el que se carga por defecto
`motor-canvas.js` usa canvas 2D y queda como respaldo con `?motor=canvas`
`grafo.js` elige el motor y lleva el bucle de animación compartido
`distribucion.js` ubica los puntos con Pivot MDS a partir de distancias BFS
`algoritmos.js` agrupa los algoritmos en cinco preguntas: costo, capacidad, rutas, fallas y refuerzo
`reproductor.js` recorre los pasos de cada algoritmo sobre el mapa
`estado.js` guarda el estado de la interfaz

Los resultados siempre vienen del backend

Al separar servidores, `ALLOWED_ORIGINS` permite sus dominios exactos mediante CORS

Los archivos subidos se leen sin guardarlos con el nombre enviado por el usuario

El límite leído por la ruta es 10 MiB; el parser multipart puede usar temporales

El último análisis se guarda en `app.state`, separado entre instancias de la app

Los GET tradicionales muestran el último análisis terminado del proceso, compartido
entre visitantes

Es una demostración local con **un solo worker**, sin usuarios ni
persistencia

Cada POST devuelve su propio resultado; un error no borra el anterior

Al reiniciar se pierde el resultado

Para varios usuarios se necesitarían IDs y almacenamiento

Las rutas de cálculo son síncronas: FastAPI las ejecuta fuera del bucle asíncrono

Esto no acelera algoritmos de CPU ni sustituye una cola de trabajos de producción

## Orden sugerido de lectura

1. `red.py`: nodos, líneas y vecinos
2. `bfs.py`: cola y recorrido por niveles
3. `union_find.py` y `kruskal.py`: evitar ciclos y minimizar costos
4. `articulacion.py`: DFS con pila y valores de descubrimiento
5. `flujo.py` y `corte.py`: caminos aumentantes y capacidad residual
6. `costo.py`, `capacidad.py` y `fallas.py`: preparar los resultados de cada cálculo
7. `analisis.py` y `procesar_dataset.py`: reunir los resultados y exponer el procesamiento a ambas entradas

No hay llamadas HTTP dentro de los algoritmos ni código de algoritmos en JavaScript
