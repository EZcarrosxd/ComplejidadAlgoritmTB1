# Base del informe TB1: diseño de redes eléctricas

Curso 1ACC0184, ciclo 2026-20. Caso de estudio 8.
Este texto es una base técnica; el grupo debe completar autoría, contexto de la
zona estudiada y metodología de recolección, y preparar el formato de entrega.

## I. Descripción del problema

El caso 8 propone diseñar una red eléctrica que minimice cableado, soporte demanda
y sea robusta ante fallas. Estos objetivos requieren estudiar tanto el costo de
las conexiones como la conectividad y capacidad de transporte de la red.

La propuesta representa cada punto eléctrico como un vértice y cada conexión como
una arista no dirigida, con costo y capacidad. El conjunto provisto cita fuentes de
estructuras y distribución de baja tensión de Perú [1, 2]. Su trazabilidad primaria
debe ampliarse con el procedimiento de selección y transformación del grupo.

**Objetivo general:** desarrollar un prototipo que analice una red de 1500 nodos
mediante algoritmos de grafos y presente indicadores de costo, capacidad y vulnerabilidad.

**Objetivos específicos:** obtener un bosque/árbol de costo mínimo; calcular el flujo
entre dos nodos seleccionados; detectar puntos de articulación; visualizar un subgrafo;
y validar los resultados con casos pequeños conocidos y el conjunto completo.

Los indicadores contribuyen a estudiar el problema. No constituyen una garantía de
cumplimiento eléctrico ni optimizan costo, demanda y robustez simultáneamente.

## II. Descripción y visualización del dataset

La fuente inmediata es `Dataset.pdf`, de 45 páginas, proporcionado por el estudiante.
Registra 2767 conexiones entre 1500 identificadores de nodos, con distancia en metros.
La última página contiene dos precios por metro y las referencias [1, 2] y tiendas.
Se comprobó que todas las conexiones del JSON coinciden con el PDF, incluyendo
distancias y multiplicidades. El CSV contiene las mismas conexiones.

Campos de cada conexión: `origen`, `destino`, `distancia_m`. Se deriva
`costo = distancia_m × 3.98`, usando el primer precio registrado en el documento.
La capacidad de 20 A por línea es una hipótesis del prototipo, no un dato medido.
No se conocen demanda, coordenadas o voltajes a partir de estas tablas.

La red completa tiene una componente. La GUI muestra un subgrafo de 200 nodos que parte
del camino del flujo, los nodos críticos y los nodos que estos aislarían, y se completa
con BFS. Indica cuántos se muestran; todos los algoritmos utilizan la red completa. El grupo puede obtener una captura de esta pantalla para el informe.

Para completar la descripción del origen deben documentarse fecha de extracción,
área geográfica, filtros, cálculo de distancias y correspondencia de IDs con las
fuentes primarias. La presencia de bibliografía no demuestra por sí sola esa cadena.

## III. Propuesta preliminar

Se propone **Kruskal con UFDS** porque el problema de cableado se representa como
selección de conexiones de menor costo sin ciclos [3]. Para una red conectada entrega
1499 líneas; si la entrada está desconectada se informa un bosque por componentes.

Se propone **Ford-Fulkerson con búsqueda BFS**, variante Edmonds-Karp, para obtener
la capacidad máxima idealizada entre origen y destino y un corte de menor capacidad [4].
Un doble barrido BFS selecciona extremos aproximados cuando el usuario no los indica.

Se propone **DFS para puntos de articulación** para detectar nodos cuya eliminación
aumentaría el número de componentes. La pila explícita permite recorrer grafos largos.
Las justificaciones y cotas se desarrollan en `docs/algoritmos.md`.

La metodología consiste en validar la entrada, construir listas de adyacencia,
ejecutar los algoritmos de forma independiente y mostrar los resultados mediante
FastAPI y una GUI. Los cálculos de flujo y articulaciones usan la red original,
mientras que el MST es una propuesta separada de cableado mínimo.

La validación inicial sobre el dataset obtiene costo S/ 132156.46, 1499 líneas del
MST, 14 articulaciones y flujo automático de 20 A entre N-1408 y N-1426. El flujo
depende de los extremos elegidos; no es una capacidad única de toda la red.

## Referencias

1. Portal Nacional de Datos Abiertos. *Estructuras de baja tensión, OSINERGMIN*.
   Enlace declarado en `Dataset.pdf`, reproducido en `docs/dataset.md`.
2. Portal Nacional de Datos Abiertos. *Instalaciones de distribución de baja tensión
   y alumbrado público*. Enlace declarado en el mismo documento.
3. Sedgewick y Wayne. *Algorithms*, 4.ª edición.
   [Minimum Spanning Trees](https://algs4.cs.princeton.edu/43mst/).
4. Sedgewick y Wayne. [Maximum Flow](https://algs4.cs.princeton.edu/64maxflow/).
