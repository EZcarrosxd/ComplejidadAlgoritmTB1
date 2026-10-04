# Publicación manual del frontend y backend

Todo se configura desde los paneles de las plataformas. No hay archivos de
Cloudflare/Render, Docker ni scripts de despliegue. Los ejemplos de dominio deben
reemplazarse por las direcciones reales de tu proyecto.

## 1. Backend en Render

Crear un **Web Service** conectado al repositorio:

| Campo del panel | Valor |
|---|---|
| Branch | `desarrollo` (los cambios deben estar subidos a GitHub) |
| Runtime | Python |
| Root Directory | Vacío: raíz del repositorio, donde está `app.py` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app:app --host 0.0.0.0 --port $PORT --workers 1` |
| Health Check Path | `/health` |

No usar `python app.py` en Render: ese comando conserva el arranque local en
127.0.0.1:5000. El comando Uvicorn de la tabla acepta conexiones externas y usa el
puerto que proporciona Render. `$PORT` se escribe literalmente en su panel.
Usar una versión Python compatible con las dependencias; se probó localmente con 3.14.

Al terminar, comprobar `https://TU-BACKEND.onrender.com/health`: debe responder
`{"status":"ok"}`. La documentación estará en `/docs`.

## 2. Indicar al frontend dónde está el backend

Editar **solamente la última línea** de `frontend/static/js/config.js`:

```javascript
export const API_URL = 'https://TU-BACKEND.onrender.com';
```

Usar HTTPS, sin `/api`, `/upload` ni `/docs`. Es una dirección pública, no una clave.
El navegador lee este archivo; no colocar contraseñas allí. Una variable del panel
de Cloudflare no modifica automáticamente este JavaScript estático.

## 3. Frontend en Cloudflare Pages

Se publica el contenido de la carpeta **`frontend`**, cuyo primer nivel contiene
`index.html`, `static` y `templates`. No subir el repositorio completo ni solo el HTML.
`templates` contiene fragmentos HTML normales que carga el navegador, sin Jinja/Python.

Dos formas manuales de hacerlo:

- **Con Git:** conectar el repositorio, elegir rama `desarrollo`, framework `None`,
  dejar Root Directory vacío, usar `exit 0` como Build Command y `frontend` como
  Build Output Directory. No se necesita compilar.
- **Direct Upload:** subir la carpeta `frontend` completa desde el panel. En un ZIP,
  `index.html` debe quedar en la raíz del ZIP. Cada cambio requiere volver a subirlo.

Elegir el método al crear el proyecto: Cloudflare documenta restricciones para
cambiar después entre integración Git y Direct Upload.

## 4. Permitir la conexión en Render

En **Environment** del servicio Render, agregar:

```text
ALLOWED_ORIGINS = https://TU-FRONTEND.pages.dev
```

El nombre de la variable es `ALLOWED_ORIGINS`; su valor es solo la URL de Cloudflare.
Guardar los cambios y aplicar el reinicio/despliegue desde el panel.
Si también usas dominio propio, escribir ambos separados por coma:

```text
https://TU-FRONTEND.pages.dev,https://www.tu-dominio.com
```

No agregar rutas como `/index.html`. Las URLs de previews son otros orígenes: deben
agregarse explícitamente si quieres probarlas. Esta lista controla CORS del navegador;
no funciona como autenticación de la API.

## 5. Verificar y tener en cuenta

Abrir Cloudflare, subir `dataset.json` y probar el recálculo. Si falla la conexión,
comprobar primero `/health`, después `API_URL` y finalmente `ALLOWED_ORIGINS`.
Si cambias `config.js`, volver a publicar y recargar el navegador sin caché.

Los servicios gratuitos de Render pueden suspenderse por inactividad: la primera
consulta puede tardar mientras inicia. No se agregó un timeout corto ni reintentos
automáticos que dupliquen los cálculos.

El resultado se guarda en memoria: los GET del último análisis son compartidos y
se reinician al reiniciar el proceso. Mantener un worker. El panel usa directamente
la respuesta de su propia carga, así que no depende de esos GET compartidos.

## Desarrollo local

Dejar `API_URL = ''` y ejecutar `python app.py`: todo funciona en el mismo origen.
Para probar separado, servir `frontend` con `python -m http.server 8000 --directory frontend`
y configurar `API_URL = 'http://127.0.0.1:5000'`. Los orígenes localhost:8000 y
127.0.0.1:8000 están permitidos por defecto cuando no defines `ALLOWED_ORIGINS`.
Abrir por HTTP; hacer doble clic en el HTML (`file://`) no permite cargar los módulos.

Fuentes: [Render y FastAPI](https://render.com/docs/deploy-fastapi),
[Cloudflare: HTML estático](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/),
[Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/),
[CORS en FastAPI](https://fastapi.tiangolo.com/tutorial/cors/),
[límites del plan gratuito de Render](https://render.com/docs/free).
