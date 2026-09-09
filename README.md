# Chatbot IA

MVP de un asistente conversacional: el cliente escribe libremente y recibe una respuesta contextual, sin formularios ni menús rígidos.

## Configurar Gemini

En `.env`, usa `AI_PROVIDER=gemini`, `GEMINI_API_KEY=tu_clave` y `GEMINI_MODEL=gemini-3.6-flash`. Reinicia con `npm start` después de cambiar la configuración. La clave se envía únicamente desde el servidor a Google. No uses `OPENAI_API_KEY` para una clave de Gemini.

Gemini recibe los últimos 20 mensajes de la sesión guardados en MySQL y las instrucciones de `BOT_INSTRUCTIONS`. Para volver a OpenAI, usa `AI_PROVIDER=openai` y una clave propia de OpenAI. Sin clave del proveedor seleccionado, se activa el modo demostración.

## Requisitos de ejecución

- Node.js 20 o superior.
- MySQL en ejecución y una base de datos existente (`agentevirtualmvp`).
- Una API key de OpenAI para activar la IA. Sin ella, la aplicación funciona en modo demostración.

## Ejecutar

1. Abre una terminal dentro de esta carpeta.
2. Si todavía no existe `.env`, copia `.env.example` como `.env`.
3. Coloca tu API key en `OPENAI_API_KEY`.
4. Personaliza `BOT_INSTRUCTIONS` con el nombre, políticas y tono de tu negocio.
5. Configura `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` en `.env`.
6. Ejecuta:

```powershell
npm install
npm start
```

7. Abre <http://localhost:3000>.

El proyecto utiliza `mysql2` para conectarse a MySQL desde el servidor. Las credenciales permanecen en `.env`, que está excluido de Git.

## Base de datos de la demo

La configuración local usa el servidor `127.0.0.2`, puerto `3306`, usuario `root` y base `agentevirtualmvp`. `127.0.0.2` es una dirección IP, no un puerto. Coloca la contraseña en `DB_PASSWORD`; no la agregues al código ni a `.env.example`.

Al iniciar, el servidor crea las tablas `chatbot_conversations` y `chatbot_messages` si no existen. El usuario de MySQL necesita permisos para crear tablas, consultar, insertar, actualizar y eliminar registros en esa base. No se crean ni modifican tablas del negocio.

Cada intercambio guarda ambos mensajes en una transacción, incluso sin clave de OpenAI. El identificador de contexto de OpenAI también se guarda para continuar la sesión tras reiniciar el servidor. Al recargar la pestaña se consulta el historial de MySQL; «Nueva conversación» elimina la conversación anterior y sus mensajes. La sesión del navegador se conserva en `sessionStorage` durante la vida de la pestaña.

Si MySQL no está disponible, el servidor no inicia y muestra el código del error. Revisa que el servicio esté activo, el puerto y las credenciales sean correctos y la base exista.

Esta conexión guarda conversaciones. Para que el asistente consulte productos, precios, citas o pedidos reales, todavía se necesitan las tablas y reglas correspondientes al negocio. Sin `OPENAI_API_KEY`, las respuestas siguen siendo las predefinidas de demostración.

La dirección `127.0.0.2` apunta a esta computadora. Para una demo remota, el servidor debe poder acceder a MySQL y el cliente debe abrir la dirección donde se aloje la aplicación.

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
├── database.js
└── server.js
```

## Qué incluye

- Interfaz adaptable a móvil y escritorio.
- Mensajes escritos en lenguaje natural.
- Memoria por sesión mediante `previous_response_id` persistido en MySQL.
- Historial de mensajes en MySQL y recuperación al recargar la pestaña.
- Clave de OpenAI protegida en el backend.
- Instrucciones configurables.
- Indicador de escritura, manejo de errores y nueva conversación.
- Modo demostración sin API key.

## Antes de producción

- Usar un usuario MySQL dedicado con permisos limitados en lugar de `root`.
- Autenticar usuarios y limitar solicitudes.
- Agregar moderación, métricas y transferencia a una persona.
- Conectar funciones controladas para pedidos, citas o inventario.
- Incorporar una base de conocimiento con información verificada del negocio.

La implementación usa la Responses API siguiendo la documentación oficial:
<https://developers.openai.com/api/reference/typescript/resources/beta/subresources/responses/methods/create>
