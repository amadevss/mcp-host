# Usar Gemini con tus MCP

[Volver al README](../README.md)

## Configuración

1. Obtén una clave de Google AI Studio para una cuenta con acceso a Gemini.
2. En `.env.local`, configura `GOOGLE_GENERATIVE_AI_API_KEY`.
3. Opcionalmente configura `GEMINI_MODEL`; el valor inicial es `gemini-2.5-flash`.
4. Reinicia Next.js. En producción, configura también `HOST_ACCESS_TOKEN`.
5. Añade los MCP en el panel, comprueba su conexión y selecciónalos en Chat.

## Primer mensaje

Con el servidor de ejemplo seleccionado, escribe «Tira un dado de 6 caras usando roll_dice». Verás la ejecución dentro de la conversación y una respuesta de Gemini.

Para otro MCP, formula una pregunta que corresponda a sus herramientas: «Consulta las tablas disponibles» solo tiene sentido si ese servidor publica una herramienta que las liste.

## Qué sucede al enviar

El chat envía el historial y la selección a la API. La API obtiene las herramientas actuales, les asigna identificadores por URL/nombre y las ofrece a Gemini. El modelo decide cuándo utilizarlas.

Cada resultado muestra el identificador de la herramienta; los resultados también incluyen su servidor de origen. Si un MCP seleccionado no está disponible, se detiene la preparación con un mensaje que identifica el servidor. Si falla una herramienta durante la respuesta, se informa al modelo como error.

## Historial y selección

- **Nueva conversación** elimina el historial visible.
- Cambiar servidores seleccionados inicia una conversación nueva para no reutilizar resultados de una selección anterior.
- Recargar o salir de la pantalla pierde el historial.
- **Detener** cancela la respuesta y cierra las conexiones.
- Una selección vacía permite conversar con Gemini sin herramientas.

## Límites

Hasta seis servidores, cien herramientas, cien mensajes y 128 KB de solicitud. El agente puede realizar hasta cinco pasos por respuesta; un paso puede contener varias llamadas. El tiempo global es de 55 segundos; las herramientas individuales tienen hasta 15 segundos. Las cuotas de Google son independientes.

La selección no garantiza que el modelo llame a una herramienta ni que su interpretación sea correcta. Usa el panel para verificar un resultado directamente.

## Datos y credenciales

Los mensajes, las descripciones de herramientas y los resultados usados se envían a Google Gemini. Los MCP reciben las llamadas correspondientes y usan las credenciales del servidor. No pegues secretos en mensajes. Usa permisos mínimos y solo lectura para análisis.

No hay aprobaciones interactivas de llamadas: al seleccionar un MCP permites que el agente ejecute sus herramientas. No publiques herramientas de escritura sin diseñar su autorización y confirmación.
