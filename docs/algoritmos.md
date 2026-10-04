# Propuesta y complejidad

Se modela una red no dirigida con costos y capacidades. Sea V el número de nodos y
E el número de líneas. Se eligen técnicas permitidas por el enunciado para el caso 8.

| Técnica | Motivo de elección | Tiempo peor caso | Memoria auxiliar |
|---|---|---|---|
| BFS, doble barrido | Elegir extremos para una consulta automática | O(V + E) | O(V) |
| Kruskal con UFDS | Minimizar el costo de conectar los nodos | O(V + E log E) | O(V + E) |
| DFS, articulaciones | Detectar nodos cuya falla aumenta las componentes | O(V + E) | O(V) |
| Ford-Fulkerson con BFS (Edmonds-Karp) | Capacidad máxima entre origen y destino | O(V E²) | O(V + E) |
| Recorrido residual | Obtener el corte de mínima capacidad | O(V + E) | O(V) |

La cota habitual de Edmonds-Karp supone trabajar sobre los vértices incidentes de
la red. Esta implementación también inicializa nodos aislados en cada BFS; una cota
general incluyendo esos aislados es O(V E (V + E)). En una red conectada se reduce
a O(V E²). No se usa la cota O(E · flujo) de Ford-Fulkerson con caminos arbitrarios.

## Cómo entender los cálculos

**Kruskal:** ordenar líneas por costo; agregar una si conecta grupos diferentes.
UFDS guarda el grupo de cada nodo y une grupos sin formar ciclos.
Si la red está conectada, se obtienen V-1 líneas. Si no, el resultado es un bosque
mínimo y la interfaz lo anuncia. Se devuelve la lista completa de líneas elegidas.

**DFS:** registrar cuándo se visita cada nodo y hasta qué antepasado puede volver
su subárbol. Si no puede volver por encima del padre, este puede ser crítico.
La raíz es crítica si tiene más de un hijo en el árbol DFS. La pila explícita
permite procesar cadenas largas sin superar el límite de recursión de Python.

**Flujo:** BFS busca un camino con capacidad disponible; se toma su cuello de botella,
se resta esa capacidad en el camino y se agrega en sentido inverso para permitir
corregir decisiones anteriores. Se repite hasta que no hay camino aumentante.
Cada línea no dirigida se representa en ambos sentidos. Las paralelas suman capacidad.

**Corte:** los nodos alcanzables desde el origen al terminar forman un lado del corte.
Se devuelven las líneas que cruzan al otro lado. Minimiza capacidad total, no cantidad
de líneas cuando las capacidades son diferentes.

## Alcance de los resultados

- El doble BFS es una heurística de extremos; no garantiza el diámetro en grafos cíclicos.
- El costo corresponde al MST; flujo y articulaciones corresponden a la red original.
- El MST minimiza cableado, pero elimina redundancia. No garantiza robustez ni demanda.
- El flujo es una capacidad idealizada entre dos puntos, en A. No equivale a MW,
  energía consumida ni una simulación eléctrica: faltan voltajes, pérdidas y demandas.
- La ausencia de articulaciones no garantiza tolerancia a fallas de líneas.
- El tiempo informado mide el análisis y preparación del subgrafo, no carga, red HTTP
  ni renderizado del navegador. No se presentan resultados de rendimiento inventados.

## Referencias para sustentar la elección

1. Sedgewick, R. y Wayne, K. *Algorithms*, 4.ª edición, sección
   [Minimum Spanning Trees](https://algs4.cs.princeton.edu/43mst/): Kruskal y bosques mínimos.
2. Sedgewick, R. y Wayne, K. [Maximum Flow](https://algs4.cs.princeton.edu/64maxflow/):
   redes residuales y flujo máximo.
3. Tarjan, R. E. (1972). *Depth-first search and linear graph algorithms*.
   SIAM Journal on Computing, 1(2), 146–160. DOI: 10.1137/0201010.
4. [FastAPI: archivos y formularios](https://fastapi.tiangolo.com/tutorial/request-forms-and-files/),
   documentación técnica para la migración web; no reemplaza la justificación algorítmica.
