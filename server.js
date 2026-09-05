import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./public", import.meta.url));
const conversations = new Map();

await loadEnv();

const port = Number(process.env.PORT || 3000);
const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const instructions = process.env.BOT_INSTRUCTIONS ||
  "Eres un asistente de atención al cliente. Responde en español, con claridad y honestidad. No inventes información.";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml"
};

const server = createServer(async (request, response) => {
  try {
    if (request.method === "POST" && request.url === "/api/chat") {
      return await handleChat(request, response);
    }

    if (request.method === "DELETE" && request.url?.startsWith("/api/chat/")) {
      const sessionId = decodeURIComponent(request.url.slice("/api/chat/".length));
      conversations.delete(sessionId);
      return sendJson(response, 200, { ok: true });
    }

    if (request.method === "GET") {
      return await serveStatic(request.url || "/", response);
    }

    sendJson(response, 404, { error: "Ruta no encontrada" });
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: "Ocurrió un error inesperado." });
  }
});

server.listen(port, () => {
  console.log(`Chatbot disponible en http://localhost:${port}`);
  if (!process.env.OPENAI_API_KEY) {
    console.log("Modo demostración activo: configura OPENAI_API_KEY en .env para usar IA.");
  }
});

async function handleChat(request, response) {
  const body = await readJson(request);
  const message = String(body.message || "").trim();
  const sessionId = String(body.sessionId || "").trim();

  if (!message || !sessionId) {
    return sendJson(response, 400, { error: "Faltan el mensaje o el identificador de sesión." });
  }

  if (message.length > 4000) {
    return sendJson(response, 400, { error: "El mensaje es demasiado largo." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return sendJson(response, 200, {
      reply: demoReply(message),
      demo: true
    });
  }

  const previousResponseId = conversations.get(sessionId);
  const payload = {
    model,
    instructions,
    input: message,
    max_output_tokens: 500
  };

  if (previousResponseId) payload.previous_response_id = previousResponseId;

  const apiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await apiResponse.json();
  if (!apiResponse.ok) {
    console.error("OpenAI API:", data);
    return sendJson(response, 502, {
      error: "No pude generar la respuesta. Revisa la clave, el modelo y tu conexión."
    });
  }

  conversations.set(sessionId, data.id);
  sendJson(response, 200, { reply: extractOutputText(data), demo: false });
}

async function serveStatic(url, response) {
  const pathname = new URL(url, "http://localhost").pathname;
  const requested = pathname === "/" ? "index.html" : pathname.slice(1);
  const safePath = normalize(requested).replace(/^(\.\.(\\|\/|$))+/, "");
  const filePath = join(root, safePath);

  if (!filePath.startsWith(root)) {
    return sendJson(response, 403, { error: "Acceso denegado" });
  }

  try {
    const contents = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(contents);
  } catch (error) {
    if (error.code === "ENOENT") return sendJson(response, 404, { error: "Archivo no encontrado" });
    throw error;
  }
}

function extractOutputText(data) {
  if (data.output_text) return data.output_text;
  return (data.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === "output_text")
    .map((item) => item.text)
    .join("\n") || "No pude elaborar una respuesta.";
}

function demoReply(message) {
  const text = message.toLowerCase();
  if (/hola|buen(os|as)|qué tal|que tal/.test(text)) {
    return "¡Hola! Soy el asistente virtual. ¿En qué puedo ayudarte hoy?";
  }
  if (/precio|costo|cuánto|cuanto/.test(text)) {
    return "Puedo ayudarte con precios, pero primero necesito saber qué producto o servicio te interesa.";
  }
  if (/pedido|envío|envio|entrega/.test(text)) {
    return "Con gusto revisamos tu pedido. En una versión conectada podría solicitar el número de pedido y consultar su estado.";
  }
  return "Entendí tu mensaje. Ahora estoy en modo demostración; agrega tu OPENAI_API_KEY para generar respuestas inteligentes y contextuales.";
}

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 20_000) throw new Error("Solicitud demasiado grande");
  }
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

async function loadEnv() {
  try {
    const file = await readFile(fileURLToPath(new URL("./.env", import.meta.url)), "utf8");
    for (const line of file.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator < 1) continue;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
