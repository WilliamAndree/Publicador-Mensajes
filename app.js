/* ==========================================================
   Publicador de mensajes · app.js
   JavaScript puro: eventos, validación, Fetch API y DOM.
   ========================================================== */
"use strict";

/* ---------- 1. Configuración ---------- */

// API obligatoria del ejercicio.
const API_URL = "https://jsonplaceholder.typicode.com/posts";

// Límites de longitud (coinciden con maxlength del HTML).
const LIMITS = { title: 100, body: 500 };

// MODO DE PRUEBA (solo se activa con ?test=... en la URL).
// Sirve para probar errores sin depender de que la API real falle.
// Sin el parámetro, la aplicación funciona con normalidad.
const TEST_ENDPOINTS = {
  "http-error": "https://jsonplaceholder.typicode.com/posts-inexistente", // devuelve 404
  "network-error": "https://jsonplaceholder.invalid/posts"                // dominio que no existe
};

/* ---------- 2. Selección de elementos del DOM ---------- */

const dom = {
  form: document.querySelector("#post-form"),
  titleInput: document.querySelector("#post-title"),
  bodyInput: document.querySelector("#post-body"),
  titleError: document.querySelector("#title-error"),
  bodyError: document.querySelector("#body-error"),
  titleCounter: document.querySelector("#title-counter"),
  bodyCounter: document.querySelector("#body-counter"),
  submitBtn: document.querySelector("#submit-btn"),
  submitLabel: document.querySelector("#submit-label"),
  submitSpinner: document.querySelector("#submit-spinner"),
  clearBtn: document.querySelector("#clear-btn"),

  apiStatus: document.querySelector("#api-status"),
  apiStatusText: document.querySelector("#api-status-text"),
  testBanner: document.querySelector("#test-banner"),

  statusPanel: document.querySelector("#status-panel"),
  statusSpinner: document.querySelector("#status-spinner"),
  statusLabel: document.querySelector("#status-label"),
  statusText: document.querySelector("#status-text"),

  resultSection: document.querySelector("#result-section"),
  sentTitle: document.querySelector("#sent-title"),
  sentBody: document.querySelector("#sent-body"),
  sentUser: document.querySelector("#sent-user"),
  respStatus: document.querySelector("#resp-status"),
  respId: document.querySelector("#resp-id"),
  respTitle: document.querySelector("#resp-title"),
  respBody: document.querySelector("#resp-body"),

  historyList: document.querySelector("#history-list"),
  historyEmpty: document.querySelector("#history-empty"),
  clearHistoryBtn: document.querySelector("#clear-history-btn")
};

/* ---------- 3. Estado de la aplicación ---------- */

let isSending = false;   // true mientras hay una petición en curso
let historyCount = 0;    // publicaciones exitosas de esta sesión

/* ---------- 4. Utilidades ---------- */

// Crea un error con un "tipo" para distinguir HTTP, JSON y red.
function createError(type, message, status) {
  const error = new Error(message);
  error.type = type;
  error.status = status;
  return error;
}

// Devuelve la URL a usar: la real, o la de prueba si hay ?test=...
function getEndpoint() {
  const mode = new URLSearchParams(window.location.search).get("test");
  if (mode && TEST_ENDPOINTS[mode]) {
    return { url: TEST_ENDPOINTS[mode], testMode: mode };
  }
  return { url: API_URL, testMode: null };
}

/* ---------- 5. Validación ---------- */

// Lee los campos, aplica trim() y devuelve los errores encontrados.
function validateForm() {
  const title = dom.titleInput.value.trim();
  const body = dom.bodyInput.value.trim();
  const errors = {};

  if (title === "") {
    errors.title = "Escribe un título. No puede estar vacío ni tener solo espacios.";
  } else if (title.length > LIMITS.title) {
    errors.title = `El título no puede superar los ${LIMITS.title} caracteres.`;
  }

  if (body === "") {
    errors.body = "Escribe el contenido. No puede estar vacío ni tener solo espacios.";
  } else if (body.length > LIMITS.body) {
    errors.body = `El contenido no puede superar los ${LIMITS.body} caracteres.`;
  }

  return { valid: Object.keys(errors).length === 0, title, body, errors };
}

function showFieldError(input, errorElement, message) {
  errorElement.textContent = message;
  errorElement.hidden = false;
  input.setAttribute("aria-invalid", "true");
}

function clearFieldError(input, errorElement) {
  errorElement.textContent = "";
  errorElement.hidden = true;
  input.removeAttribute("aria-invalid");
}

function clearAllFieldErrors() {
  clearFieldError(dom.titleInput, dom.titleError);
  clearFieldError(dom.bodyInput, dom.bodyError);
}

/* ---------- 6. Presentación: estado, carga y contadores ---------- */

// type: "idle" | "loading" | "success" | "error"
function setStatus(type, label, text) {
  dom.statusPanel.className = `status status--${type}`;
  dom.statusLabel.textContent = label;
  dom.statusText.textContent = text;
  dom.statusSpinner.hidden = type !== "loading";
}

// Activa o desactiva el estado de carga y bloquea el envío repetido.
function setLoading(loading) {
  isSending = loading;
  dom.submitBtn.disabled = loading;
  dom.clearBtn.disabled = loading;
  dom.titleInput.readOnly = loading;
  dom.bodyInput.readOnly = loading;
  dom.submitSpinner.hidden = !loading;
  dom.submitLabel.textContent = loading ? "Publicando..." : "Publicar mensaje";
  dom.form.setAttribute("aria-busy", String(loading));
}

function updateCounter(input, counter, max) {
  counter.textContent = `${input.value.length} / ${max}`;
}

function setApiIndicator(state, text) {
  dom.apiStatus.className = `api-status api-status--${state}`;
  dom.apiStatusText.textContent = text;
}

/* ---------- 7. Resultado e historial ---------- */

// Muestra por separado lo enviado y lo que devolvió el servidor.
// Se usa textContent: el texto nunca se interpreta como HTML.
function renderResult(payload, result) {
  const data = result.data;

  dom.sentTitle.textContent = payload.title;
  dom.sentBody.textContent = payload.body;
  dom.sentUser.textContent = `userId: ${payload.userId}`;

  dom.respStatus.textContent = `${result.status} ${result.statusText}`.trim();
  dom.respId.textContent = data.id !== undefined ? String(data.id) : "No incluido en la respuesta";
  dom.respTitle.textContent = data.title !== undefined ? String(data.title) : "No incluido en la respuesta";
  dom.respBody.textContent = data.body !== undefined ? String(data.body) : "No incluido en la respuesta";

  dom.resultSection.hidden = false;
}

// Añade un elemento al historial de la sesión (solo en memoria).
function addToHistory(payload, result) {
  historyCount += 1;

  const item = document.createElement("li");
  item.className = "history__item";

  const title = document.createElement("span");
  title.className = "history__title";
  title.textContent = payload.title;

  const meta = document.createElement("span");
  meta.className = "history__meta";
  const id = result.data.id !== undefined ? result.data.id : "sin id";
  meta.textContent = `ID simulado: ${id} · Estado HTTP ${result.status} · ${new Date().toLocaleTimeString()}`;

  item.append(title, meta);
  dom.historyList.prepend(item);

  dom.historyList.hidden = false;
  dom.historyEmpty.hidden = true;
  dom.clearHistoryBtn.hidden = false;
}

function clearHistory() {
  dom.historyList.replaceChildren();
  historyCount = 0;
  dom.historyList.hidden = true;
  dom.historyEmpty.hidden = false;
  dom.clearHistoryBtn.hidden = true;
}

function resetForm() {
  dom.form.reset();
  clearAllFieldErrors();
  updateCounter(dom.titleInput, dom.titleCounter, LIMITS.title);
  updateCounter(dom.bodyInput, dom.bodyCounter, LIMITS.body);
}

/* ---------- 8. Comunicación con la API ---------- */

// Envía la publicación y devuelve { status, statusText, data }.
// Lanza errores con tipo "http" o "parse" (los de red los lanza fetch).
async function sendPost(payload, url) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  // fetch() NO rechaza la promesa con un 404 o 500: hay que revisar response.ok.
  if (!response.ok) {
    throw createError(
      "http",
      `El servidor respondió con el estado HTTP ${response.status} ${response.statusText}`.trim() + ".",
      response.status
    );
  }

  let data;
  try {
    data = await response.json();
  } catch (parseError) {
    throw createError("parse", "El servidor respondió, pero el contenido no es un JSON válido.", response.status);
  }

  return { status: response.status, statusText: response.statusText, data };
}

// Comprueba si la API responde (petición GET de solo lectura).
async function checkApiStatus() {
  setApiIndicator("checking", "Comprobando API…");
  try {
    const response = await fetch(`${API_URL}/1`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    setApiIndicator("online", "API de prueba disponible");
  } catch (error) {
    setApiIndicator("offline", "API no disponible");
  }
}

/* ---------- 9. Manejo de errores y envío ---------- */

function describeError(error) {
  if (error.type === "http") {
    return { label: "Error del servidor.", text: `${error.message} La publicación no se envió correctamente.` };
  }
  if (error.type === "parse") {
    return { label: "Respuesta no válida.", text: error.message };
  }
  return {
    label: "Error de conexión.",
    text: "No se pudo contactar con la API. Revisa tu conexión a internet e inténtalo de nuevo."
  };
}

async function handleSubmit(event) {
  event.preventDefault();          // evita que el formulario recargue la página
  if (isSending) return;           // protege contra clics repetidos

  // 1. Validar antes de enviar
  clearAllFieldErrors();
  const validation = validateForm();

  if (!validation.valid) {
    if (validation.errors.title) showFieldError(dom.titleInput, dom.titleError, validation.errors.title);
    if (validation.errors.body) showFieldError(dom.bodyInput, dom.bodyError, validation.errors.body);
    setStatus("error", "Datos incompletos.", "Corrige los campos marcados. No se envió ninguna petición.");
    (validation.errors.title ? dom.titleInput : dom.bodyInput).focus();
    return;
  }

  // 2. Preparar la petición
  const payload = { userId: 1, title: validation.title, body: validation.body };
  const endpoint = getEndpoint();

  // 3. Enviar y procesar
  setLoading(true);
  setStatus("loading", "Enviando…", "Publicando tu mensaje en la API de prueba.");

  try {
    const result = await sendPost(payload, endpoint.url);
    renderResult(payload, result);
    addToHistory(payload, result);
    setStatus(
      "success",
      "Publicación enviada.",
      `La API de prueba respondió con el estado ${result.status}. Recuerda que no almacena el mensaje de forma permanente.`
    );
    resetForm();
  } catch (error) {
    const info = describeError(error);
    setStatus("error", info.label, info.text);
  } finally {
    setLoading(false);             // se ejecuta siempre: éxito o error
  }
}

/* ---------- 10. Eventos e inicialización ---------- */

function handleClear() {
  resetForm();
  setStatus("idle", "En espera.", "Formulario limpio. Escribe una nueva publicación.");
  dom.titleInput.focus();
}

function init() {
  dom.form.addEventListener("submit", handleSubmit);
  dom.clearBtn.addEventListener("click", handleClear);
  dom.clearHistoryBtn.addEventListener("click", clearHistory);

  dom.titleInput.addEventListener("input", () => {
    updateCounter(dom.titleInput, dom.titleCounter, LIMITS.title);
    clearFieldError(dom.titleInput, dom.titleError);
  });
  dom.bodyInput.addEventListener("input", () => {
    updateCounter(dom.bodyInput, dom.bodyCounter, LIMITS.body);
    clearFieldError(dom.bodyInput, dom.bodyError);
  });

  // Aviso visible si se está usando el modo de prueba.
  const endpoint = getEndpoint();
  if (endpoint.testMode) {
    dom.testBanner.textContent = `Modo de prueba activo (${endpoint.testMode}): las publicaciones se envían a una dirección de prueba para provocar un error controlado.`;
    dom.testBanner.hidden = false;
  }

  updateCounter(dom.titleInput, dom.titleCounter, LIMITS.title);
  updateCounter(dom.bodyInput, dom.bodyCounter, LIMITS.body);
  checkApiStatus();
}

init();
