# Dataset y procedencia

La fuente inmediata es `dataset/Dataset.pdf`, copia sin cambios del PDF indicado
por el estudiante en Descargas. Contiene 45 páginas: conexiones en las páginas
1 a 44 y precios y bibliografía en la página 45.

El 04/10/2026 se extrajeron las ternas `(origen, destino, distancia_m)` del PDF y
se compararon con el JSON usando un multiconjunto, conservando posibles duplicados:
**2767 de 2767 conexiones coinciden exactamente**, incluidas sus distancias.
La prueba de integración también comprueba que CSV y JSON producen el mismo análisis.

## Características

| Dato | Valor |
|---|---|
| Nodos distintos | 1500, identificados de N-1 a N-1500 |
| Conexiones | 2767 |
| Componentes topológicas | 1 |
| Distancia | Metros |
| Precio de referencia utilizado | S/ 3.98 por metro, primera fila del PDF |
| Segundo precio registrado | S/ 4.90 por metro; no se usa automáticamente |
| Capacidad ausente en el PDF | Se supone 20 A por línea |

Los nodos se deducen de los extremos de las conexiones. Las fuentes citadas son de
baja tensión; por eso se presentan como **nodos eléctricos**, sin afirmar que los
1500 sean subestaciones de transmisión. No se inventan coordenadas geográficas.

## Fuentes citadas por el PDF

- [Estructuras de baja tensión, OSINERGMIN](https://www.datosabiertos.gob.pe/dataset/estructuras-de-baja-tensi%C3%B3n-organismo-supervisor-de-la-inversi%C3%B3n-en-energ%C3%ADa-y-miner%C3%ADa).
- [Instalaciones de distribución de baja tensión y alumbrado público](https://www.datosabiertos.gob.pe/dataset/instalaciones-de-distribuci%C3%B3n-en-baja-tensi%C3%B3n-servicio-de-alumbrado-p%C3%BAblico-de-las-empresas).
- [Cable Elcope, Sodimac](https://www.sodimac.com.pe/sodimac-pe/articulo/116266218/Cable-THW-12-AWG-Elcope-450-750V-Rojo-por-Metro-Lineal).
- [Cable Celsa, Promart](https://www.promart.pe/cable-thw-90-450-750v-12-awg-celsa-negro-venta-por-metro/p).

Los importes son los registrados en el PDF, no precios actuales verificados.
La bibliografía permite identificar las fuentes declaradas, pero el PDF no explica
el filtrado geográfico, la fecha de extracción, el mapeo de IDs originales a N-1…,
ni cómo se generaron las conexiones/distancias. El grupo debe documentar ese proceso
para demostrar la trazabilidad hasta los datos primarios exigida por la rúbrica.

## Formatos de entrada

JSON principal: objeto con `conexiones` y, opcionalmente, `precios` y `nodos`.
También se acepta una lista JSON de conexiones.

```json
{
  "precios": [{"precio_por_metro": 3.98}],
  "conexiones": [{"origen": "A", "destino": "B", "distancia_m": 10}]
}
```

Este ejemplo solo ilustra el formato: la API exige al menos 1500 nodos.
Una conexión puede declarar `costo` y `capacidad`. Si no declara costo, se calcula
como distancia × primer precio. Si no declara precio o capacidad, se usan los
supuestos anteriores. Se conserva la capacidad explícita, incluso si es cero.

CSV: `origen,destino,distancia_m` o `origen,destino,costo,capacidad`.
`conexiones.csv` sirve para subir la red; `precios.csv` es una tabla de referencia,
no una red y no se sube por separado. El CSV usa S/ 3.98 como precio predeterminado.

Para incluir aislados en JSON, añadir `"nodos": [{"id":"A"}, ...]` con **todos**
los nodos: cada extremo debe estar declarado. Sin esa lista, se deducen de las líneas.
Se rechazan IDs vacíos, bucles, valores negativos/no finitos y filas mal formadas.
Las líneas paralelas se permiten: sus capacidades se suman en el flujo.

La pantalla dibuja el subgrafo inducido por los primeros 100 nodos e indica el total.
Todos los cálculos usan los 1500 nodos y las 2767 líneas.
