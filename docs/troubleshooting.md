# Solución de problemas

[Volver al README](../README.md)

| Síntoma                                       | Qué comprobar                                                                                   |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| «Servidor no permitido»                       | Añade la URL completa a MCP_ALLOWED_URLS y reinicia; comprueba ruta, query y barra final.       |
| «Introduce la clave de acceso» / 401 del host | Introduce HOST_ACCESS_TOKEN en «Acceso al host». Es una clave distinta de las del proveedor.    |
| 503 al ejecutar en producción                 | Configura HOST_ACCESS_TOKEN en el servidor y vuelve a desplegar.                                |
| MCP remoto devuelve 401/403                   | Revisa MCP_SERVER_HEADERS, URL exacta y permisos de la clave del proveedor.                     |
| MCP propio devuelve 401                       | Usa Authorization: Bearer MCP_BEARER_TOKEN; la app lo envía automáticamente para MCP_LOCAL_URL. |
| No conecta al ejemplo                         | Comprueba MCP_LOCAL_URL y el puerto real de Next.js.                                            |
| No conecta desde el hosting                   | localhost apunta al hosting, no a tu laptop. Usa una URL accesible desde el servidor.           |
| El endpoint redirige                          | Utiliza su URL final. Las redirecciones se rechazan para no reenviar claves.                    |
| La lista está vacía                           | Un MCP puede conectar y no publicar herramientas. Resources y prompts no aparecen como tools.   |
| Chat no usa el servidor añadido               | Selecciónalo en Chat y comprueba su conexión en el panel.                                       |
| Falta la clave Gemini                         | Configura GOOGLE_GENERATIVE_AI_API_KEY en el servidor y reinicia.                               |
| Respuesta Gemini interrumpida                 | Comprueba clave, acceso al modelo, cuota, red y disponibilidad de los MCP.                      |
| Una herramienta falla                         | Revisa el mensaje, esquema y argumentos. Un HTTP 200 puede contener isError: true de MCP.       |
| Campos complejos no funcionan                 | Usa «Argumentos JSON» con un objeto y revisa el esquema publicado.                              |
| 413 / conversación demasiado grande           | Inicia una conversación nueva; la solicitud máxima es de 128 KB.                                |
| 429                                           | Espera un minuto. Las cuotas de Google o del MCP también pueden tener sus propios límites.      |
| No aparecen cambios de .env                   | Reinicia Next.js; en el hosting, vuelve a desplegar.                                            |
| Navegador no guarda servidores                | Habilita localStorage. No se sincronizan entre dispositivos; puedes volver a añadirlos.         |
| Perdí el chat al recargar o cambiar selección | Es el comportamiento actual: el historial vive en memoria y no se persiste.                     |
| Usaba NEON_API_KEY                            | Migra a MCP_ALLOWED_URLS + MCP_SERVER_HEADERS y añade/selecciona Neon: docs/connect-servers.md. |

## Diagnóstico reproducible

1. Ejecuta `npm run check` y `npm run build`.
2. Con la build lista, ejecuta `npm run test:integration` sin claves externas.
3. Con tu app iniciada, ejecuta `npm run test:mcp -- https://tu-dominio/api/mcp`.
4. Si protegiste el endpoint MCP, proporciona MCP_BEARER_TOKEN como variable de entorno al script.
5. Describe la URL sin credenciales, el paso que falla y el mensaje visible al abrir una issue. No publiques tokens, headers privados ni conversaciones con datos sensibles.

El script manual prueba solo echo y roll_dice si existen, lista todas las herramientas y cierra la conexión incluso si falla.
