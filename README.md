# Chatbot IA

MVP de un asistente conversacional: el cliente escribe libremente y recibe una respuesta contextual, sin formularios ni menús rígidos.

## Requisitos

- Node.js 20 o superior.
- Una API key de OpenAI para activar la IA. Sin ella, la aplicación funciona en modo demostración.

## Ejecutar

1. Abre una terminal dentro de esta carpeta.
2. Copia `.env.example` como `.env`.
3. Coloca tu API key en `OPENAI_API_KEY`.
4. Personaliza `BOT_INSTRUCTIONS` con el nombre, políticas y tono de tu negocio.
5. Ejecuta:

```powershell
npm start
```

6. Abre <http://localhost:3000>.

No es necesario ejecutar `npm install`, porque este MVP utiliza únicamente funciones incluidas en Node.js.

## Estructura

```text
chatbot-ia/
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

## Qué incluye

- Interfaz adaptable a móvil y escritorio.
- Mensajes escritos en lenguaje natural.
- Memoria por sesión mediante `previous_response_id`.
- Clave de OpenAI protegida en el backend.
- Instrucciones configurables.
- Indicador de escritura, manejo de errores y nueva conversación.
- Modo demostración sin API key.

## Antes de producción

- Guardar conversaciones en una base de datos en vez de memoria del proceso.
- Autenticar usuarios y limitar solicitudes.
- Agregar moderación, métricas y transferencia a una persona.
- Conectar funciones controladas para pedidos, citas o inventario.
- Incorporar una base de conocimiento con información verificada del negocio.

La implementación usa la Responses API siguiendo la documentación oficial:
<https://developers.openai.com/api/reference/typescript/resources/beta/subresources/responses/methods/create>
