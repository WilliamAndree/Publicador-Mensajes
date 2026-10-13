# Publicador de mensajes

Miniaplicación web hecha con HTML5, CSS3 y JavaScript puro (sin frameworks). Permite redactar una publicación, validarla, enviarla con **Fetch API** (`POST`) a la API de pruebas de JSONPlaceholder y mostrar la respuesta real del servidor sin recargar la página.

API usada: `https://jsonplaceholder.typicode.com/posts`

## Integrantes

-Rojas Zuñiga William Andree
-Rivera Flores Jeanpool
-Ramos Ore Dennis

## Estructura

```
publicador-mensajes/
├── index.html        # Estructura semántica, formulario y contenedores
├── css/styles.css    # Estilos, responsive y animaciones
├── js/app.js         # Eventos, validación, Fetch y DOM
└── README.md
```

## Cómo ejecutarlo en Visual Studio Code

1. Abre la carpeta `publicador-mensajes` en VS Code (Archivo > Abrir carpeta).
2. Instala la extensión **Live Server** (Ritwick Dey) si no la tienes.
3. Haz clic derecho sobre `index.html` y elige **Open with Live Server**.
4. Se abrirá `http://127.0.0.1:5500`. También puedes abrir `index.html` directamente, pero Live Server es lo recomendado.

## Limitación importante de JSONPlaceholder

JSONPlaceholder es una **API de pruebas**. Responde con éxito (`201 Created`) y un identificador simulado (normalmente `101`), pero **no guarda** la publicación. No aparecerá en consultas posteriores. Por eso la aplicación dice «Publicación enviada correctamente a la API de prueba» y no «guardada». El historial de la página vive solo en memoria y se pierde al recargar.

## Pruebas funcionales

| # | Prueba | Cómo hacerla | Resultado esperado |
|---|--------|--------------|--------------------|
| 1 | Campos vacíos | Pulsa «Publicar mensaje» sin escribir nada | Aparecen mensajes bajo ambos campos. En Network no hay ninguna petición POST |
| 2 | Solo espacios | Escribe únicamente espacios en el título o el contenido y publica | `trim()` los detecta como vacíos y no se envía nada |
| 3 | Publicación válida | Escribe un título y un contenido y publica | Petición POST real, estado `201`, tarjeta de resultado con el ID devuelto y entrada en el historial |
| 4 | Control de envíos | Con Network > Throttling en «Slow 3G», pulsa varias veces el botón | El botón queda deshabilitado, dice «Publicando...» y solo se ve **una** petición POST |
| 5 | Error HTTP | Abre `index.html?test=http-error` (con Live Server: `http://127.0.0.1:5500/index.html?test=http-error`) y publica | Se envía a una ruta inexistente, responde `404`, `response.ok` es `false` y se muestra «Error del servidor» |
| 6 | Error de conexión | Opción A: DevTools > Network > marca **Offline** y publica. Opción B: abre `?test=network-error` | Se muestra «Error de conexión» (el `catch` recibe un `TypeError` de `fetch`) |
| 7 | Seguridad | Escribe `<img src=x onerror=alert(1)>` y `<b>negrita</b>` como título y contenido | Se ven como texto literal, no se ejecuta nada, porque se usa `textContent` |
| 8 | Herramientas del navegador | F12 > pestaña **Network** > publica | Revisa URL, método `POST`, cabecera `Content-Type: application/json`, **Payload** (JSON enviado), estado `201` y **Response**. En **Console** no debe haber errores |

El modo de prueba (`?test=...`) solo cambia la dirección de destino cuando está presente en la URL, y muestra un aviso visible en la página. Sin ese parámetro, la aplicación funciona con normalidad.

## Cómo explicar el flujo (para la exposición)

1. La página carga y `init()` registra los eventos. También hace un `GET` de comprobación para el indicador «API disponible».
2. El usuario escribe y pulsa **Publicar mensaje**. Se dispara el evento `submit`.
3. `handleSubmit()` llama a `event.preventDefault()` para que el navegador no recargue la página.
4. `validateForm()` toma los valores, les aplica `trim()` y revisa que no estén vacíos ni pasen del límite. Si hay errores, los muestra y **termina**: no hay petición.
5. Si todo está bien, se arma el objeto `payload` (`userId`, `title`, `body`) y `setLoading(true)` deshabilita el botón y muestra el indicador de carga.
6. `sendPost()` llama a `fetch()` con método `POST`, la cabecera JSON y el cuerpo en texto gracias a `JSON.stringify()`. El `await` pausa la función hasta que llega la respuesta, sin congelar la página.
7. Se revisa `response.ok`. Un 404 o 500 **no** hace que `fetch` falle por sí solo, así que se lanza un error a mano.
8. Si es correcta, `response.json()` convierte el texto recibido en un objeto.
9. `renderResult()` muestra lo enviado y lo devuelto, usando `textContent`. `addToHistory()` añade la entrada al historial de la sesión.
10. En `finally`, `setLoading(false)` restaura el botón, haya funcionado o no.

### Dónde está cada elemento en `js/app.js`

| Elemento | Dónde buscarlo |
|----------|----------------|
| `addEventListener()` | función `init()` (submit, click, input) |
| `event.preventDefault()` | primera línea de `handleSubmit()` |
| `trim()` | función `validateForm()` |
| `fetch()` | función `sendPost()` (y `checkApiStatus()` para el GET) |
| `JSON.stringify()` | dentro de `fetch(...)` en `sendPost()` |
| `await` | `sendPost()` (`await fetch`, `await response.json`), `handleSubmit()` (`await sendPost`) |
| `response.ok` | `sendPost()`, justo después del `fetch` |
| `response.json()` | `sendPost()`, dentro de un `try/catch` propio |
| `try/catch/finally` | `handleSubmit()` |
| `textContent` | `renderResult()`, `addToHistory()`, `setStatus()`, `showFieldError()` |

## Accesibilidad

- Cada campo tiene su `label` asociado y descripciones con `aria-describedby`.
- Foco visible en todos los controles y navegación completa con teclado.
- El panel de estado usa `role="status"` y `aria-live="polite"`.
- Los errores y éxitos llevan texto e icono, no solo color.
- Se respeta `prefers-reduced-motion`.
