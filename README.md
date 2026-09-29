# Proyecto 8: Diseño de Redes Eléctricas

## 📌 Descripción General
Este proyecto implementa el diseño, análisis y optimización de una red eléctrica de gran escala (mínimo de 1500 subestaciones) tratándolo como una disciplina estricta de ingeniería de software. 

Siguiendo los principios del libro *"Fundamentals of Software Architecture"*, el sistema adopta un **Estilo de Arquitectura en Capas** con una orquestación centralizada. Esta decisión de diseño garantiza un desacoplamiento absoluto entre la lógica matemática algorítmica (Back-end en Python) y la futura capa de presentación (Front-end en HTML/CSS), comunicándolas únicamente a través de contratos de datos en formato JSON (API REST).

### 🧠 Motor Algorítmico 
El núcleo del proyecto procesa el conjunto de datos mediante estructuras de listas de adyacencia (grafos) y aplica tres algoritmos fundamentales:
1. **Optimización de Costos (Algoritmo de Kruskal con Union-Find):** Calcula el Árbol de Expansión Mínima (MST) para interconectar la red garantizando el menor costo posible de cableado.
2. **Distribución de Capacidad (Algoritmo de Ford-Fulkerson con BFS):** Encuentra caminos aumentantes y calcula el flujo máximo de energía que puede soportar la red.
3. **Robustez y Tolerancia a Fallos (Búsqueda en Profundidad - DFS):** Detecta puntos de articulación para identificar nodos críticos (subestaciones) que, en caso de fallo, provocarían apagones aislando secciones de la red.

## 📂 Estructura Modular del Proyecto
* `data_loader.py`: Componente de ingesta que procesa archivos JSON/CSV y valida el requisito mínimo de 1500 nodos.
* `graph_model.py`: Componente que construye la representación matemática del grafo en memoria.
* `kruskal_mst.py`, `ford_fulkerson.py`, `dfs_connectivity.py`: Módulos aislados que contienen las reglas de negocio y los cálculos matemáticos.
* `main.py`: Controlador orquestador central que asegura el orden de ejecución (cohesión secuencial).
* `app.py`: Capa de servicios web (API) que expone de manera ligera los resultados algorítmicos.

---

## ⚙️ Dependencias Requeridas
Toda la lógica de grafos y algoritmos está implementada nativamente para evitar depender de bibliotecas externas pesadas. El proyecto requiere **Python 3.8 o superior**.

Para la Capa de Servicios Web (API), es necesario instalar el micro-framework y la configuración de seguridad transversal:
* `Flask`: Para levantar el servidor web ligero.
* `Flask-CORS`: Para permitir peticiones HTTP desde el futuro archivo de interfaz (HTML/Javascript) sin bloqueos de seguridad del navegador.

---

## 🚀 Instrucciones de Instalación y Ejecución

### 1. Preparar el Entorno Virtual (Opcional pero recomendado)
Abra una terminal o consola de comandos en la carpeta raíz del proyecto y cree un entorno virtual para aislar las dependencias:
```bash
python -m venv venv

# En Windows:
venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate
```

### 2. Instalar las Dependencias
Con el entorno activado, ejecute el siguiente comando para instalar Flask y CORS:
```bash
pip install Flask flask-cors
```

### 3. Configurar el Dataset
Asegúrese de contar con su archivo de datos reales de la red eléctrica (ej. `dataset.json`). 
Abra el archivo `app.py` en un editor de texto y actualice la variable `RUTA_DATASET` para que apunte a la ubicación exacta de su archivo:
```python
RUTA_DATASET = r"C:\Ruta\Hacia\Su\dataset.json"
```

### 4. Ejecutar el Servidor (Compilación inicial)
El sistema está diseñado para leer el dataset y calcular todos los algoritmos (Kruskal, DFS, Ford-Fulkerson) **una sola vez** al arrancar. Para iniciarlo, ejecute:
```bash
python app.py
```
Verá mensajes en la consola indicando que se están procesando los algoritmos. Una vez finalizados, el servidor quedará activo en `http://localhost:5000`.

### 5. Consumir los Resultados
Con el servidor corriendo, puede validar el procesamiento abriendo su navegador o herramientas como *Postman* e ingresando a las siguientes rutas de la API:
* **Nodos críticos y rendimiento:** [http://localhost:5000/api/network-status](http://localhost:5000/api/network-status)
* **Costo mínimo de instalación:** [http://localhost:5000/api/optimization/mst](http://localhost:5000/api/optimization/mst)
* **Flujo máximo de red:** [http://localhost:5000/api/optimization/flow](http://localhost:5000/api/optimization/flow)
