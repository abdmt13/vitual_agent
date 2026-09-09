export async function generateGeminiReply({ apiKey, model, instructions, history = [], message }) {
  let response;
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(45000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instructions }] },
        contents: [...history.slice(-20).map(item => ({ role: item.role === "assistant" ? "model" : "user", parts: [{ text: item.content }] })),
          { role: "user", parts: [{ text: message }] }],
        generationConfig: { maxOutputTokens: 2048 }
      })
    });
  } catch {
    throw new Error("No se pudo conectar con Gemini o se agotó el tiempo de espera. Intenta de nuevo.");
  }
  const data = await response.json().catch(() => ({}));
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
