const form = document.querySelector("#chat-form");
const input = document.querySelector("#message");
const sendButton = document.querySelector("#send");
const messages = document.querySelector("#messages");
const notice = document.querySelector("#notice");
const newChatButton = document.querySelector("#new-chat");

let sessionId = crypto.randomUUID();
let waiting = false;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = input.value.trim();
  if (!message || waiting) return;

  addMessage(message, "user");
  input.value = "";
  resizeInput();
  setWaiting(true);
  const typing = addTyping();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, message })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "No se pudo enviar el mensaje.");
    typing.remove();
    addMessage(data.reply, "assistant");
    notice.hidden = !data.demo;
    notice.textContent = data.demo
      ? "Modo demostración: agrega tu clave de OpenAI en el archivo .env para activar respuestas inteligentes."
      : "";
  } catch (error) {
    typing.remove();
    addMessage(error.message, "assistant");
  } finally {
    setWaiting(false);
    input.focus();
  }
});

input.addEventListener("input", resizeInput);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

newChatButton.addEventListener("click", async () => {
  const oldSessionId = sessionId;
  sessionId = crypto.randomUUID();
  await fetch(`/api/chat/${encodeURIComponent(oldSessionId)}`, { method: "DELETE" }).catch(() => {});
  messages.replaceChildren();
  addMessage("¡Hola! Empecemos de nuevo. ¿En qué puedo ayudarte?", "assistant");
  notice.hidden = true;
  input.focus();
});

function addMessage(text, role) {
  const article = document.createElement("article");
  article.className = `message ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  article.append(bubble);
  messages.append(article);
  scrollToBottom();
  return article;
}

function addTyping() {
  const article = document.createElement("article");
  article.className = "message assistant typing";
  article.setAttribute("aria-label", "El asistente está escribiendo");
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = "<span></span><span></span><span></span>";
  article.append(bubble);
  messages.append(article);
  scrollToBottom();
  return article;
}

function setWaiting(value) {
  waiting = value;
  sendButton.disabled = value;
  input.disabled = value;
}

function resizeInput() {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 150)}px`;
}

function scrollToBottom() {
  messages.scrollTop = messages.scrollHeight;
}
