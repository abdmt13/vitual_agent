export async function generateGeminiReply({ apiKey, model, instructions, history = [], message }) {
  const started = Date.now();
  const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS || 45000);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 120000) throw new Error("GEMINI_TIMEOUT_MS debe estar entre 1000 y 120000.");
  let response;
  let data;
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: `${instructions}\nResponde de forma breve y directa, salvo que el usuario solicite detalles.` }] },
        contents: [...history.slice(-20).map(item => ({ role: item.role === "assistant" ? "model" : "user", parts: [{ text: item.content }] })),
          { role: "user", parts: [{ text: message }] }],
        generationConfig: {
          maxOutputTokens: 768,
          ...(model.startsWith("gemini-3") && model.includes("flash")
            ? { thinkingConfig: { thinkingLevel: process.env.GEMINI_THINKING_LEVEL || "minimal" } } : {})
        }
      })
    });
    data = await response.json();
  } catch (error) {
    console.error("Gemini solicitud:", { elapsedMs: Date.now() - started, error: error.name, code: error.cause?.code });
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      throw new Error(`Gemini no respondió en ${timeoutMs / 1000} segundos. Intenta enviar el mensaje de nuevo.`);
    }
    throw new Error("No se pudo completar la conexión con Gemini. Revisa tu conexión e intenta de nuevo.");
  }
  console.log("Gemini solicitud:", { model, elapsedMs: Date.now() - started, status: response.status });
  if (!response.ok) {
    console.error("Gemini API:", { status: response.status, code: data.error?.status });
    if (response.status === 429) throw new Error("Gemini no tiene cuota disponible o alcanzó su límite de solicitudes. Revisa los límites de tu proyecto en Google AI Studio.");
    if ([400, 401, 403].includes(response.status)) throw new Error("Gemini rechazó la solicitud. Revisa GEMINI_API_KEY, sus permisos y las restricciones del proyecto en Google AI Studio.");
    if (response.status === 404) throw new Error("El modelo de Gemini no está disponible. Revisa GEMINI_MODEL en .env.");
    throw new Error("Gemini no pudo generar la respuesta. Intenta de nuevo más tarde.");
  }
  const reply = data.candidates?.[0]?.content?.parts?.filter(part => !part.thought && typeof part.text === "string").map(part => part.text).join("\n");
  if (!reply) throw new Error("Gemini no devolvió una respuesta de texto. Prueba reformular el mensaje.");
  return reply;
}
