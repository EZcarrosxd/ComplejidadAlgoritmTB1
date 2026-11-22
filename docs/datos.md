# Formato y procedencia de los datos

El JSON del aplicativo contiene las listas `nodos` y `aristas`

```json
{
  "nodos": [
    {"id": "poste-1", "coordenadas": [-77.05, -12.05]},
    {"id": "poste-2", "coordenadas": [-77.04, -12.04]}
  ],
  "aristas": [
    {
      "id": "tramo-1",
      "origen": "poste-1",
      "destino": "poste-2",
      "peso_mm": 1800000,
      "clase": "tramo_documentado",
      "trazado": [[-77.05, -12.05], [-77.044, -12.048], [-77.04, -12.04]]
    }
  ]
}
```

- `id` es un texto y debe ser único dentro de su lista
- `coordenadas` es un par WGS 84 en orden longitud, latitud
- `origen` y `destino` apuntan a nodos distintos ya declarados
- `peso_mm` es una longitud entera positiva en milímetros
- `clase` admite `tramo_documentado` y `candidata_geografica` y determina el estilo visual de la conexión
- `trazado` es opcional e incluye el punto de origen, los puntos intermedios en su orden y el punto de destino
- Si la conexión es recta, se omite `trazado` y el visor une las coordenadas de los nodos

Se admiten nodos aislados y aristas paralelas
Kruskal y Prim devuelven un bosque de expansión mínima si la red tiene varias componentes
El precio del cable por metro se ingresa como parámetro opcional en soles y el importe se calcula multiplicando ese precio por la longitud seleccionada

## Conversión reproducible

El conversor toma un JSON original de colecciones GeoJSON y escribe un archivo nuevo
Conserva las conexiones presentes en ese JSON, sus identificadores, sus pesos y todos sus puntos intermedios
La opción `--verificar` comprueba una salida existente

```powershell
python -m dataset.convertir_red ruta/al/original.json ruta/a/red.json
python -m dataset.convertir_red ruta/al/original.json ruta/a/red.json --verificar
```

## Datos de referencia

Los dos archivos reúnen estructuras de baja tensión publicadas por OSINERGMIN
Las conexiones candidatas representan propuestas de diseño

| Archivo | Nodos | Aristas | Kruskal y Prim | Componentes con BFS |
|---|---:|---:|---:|---:|
| [red_osinergmin.json](../dataset/red_osinergmin.json) | 7208 | 17 818 | 137 416,341 m | 1 |
| [red_osinergmin_ampliada.json](../dataset/red_osinergmin_ampliada.json) | 7208 | 33 709 | 137 411,789 m | 1 |

Los JSON originales georreferenciados se conservaron en la carpeta local `tmp/respaldo-datasets/`
Cuando los respaldos están disponibles, las pruebas comparan cada nodo y arista con su original

`dataset/dataset.json`, `dataset/conexiones.csv`, `dataset/precios.csv` y `dataset/Dataset.pdf` conservan los datos del avance previo
Los identificadores y las distancias de ese avance carecen de coordenadas geográficas
