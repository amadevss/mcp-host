# Desplegar tu copia y controlar el acceso

[Volver al README](../README.md)

## Despliegue Next.js

Puedes usar Vercel u otro hosting con Node.js 22.18+ o 24+, conexiones HTTP salientes y soporte de respuestas en streaming. No funciona como exportación HTML estática.

1. Importa tu fork en el hosting.
2. Usa `npm ci` para instalar y `npm run build` para compilar.
3. En un servidor Node propio, arranca con `npm start` detrás de un proxy HTTPS.
4. Configura las variables privadas en el hosting y vuelve a desplegar.

Ejemplo (sustituye dominio y claves):

```dotenv
MCP_LOCAL_URL=https://tu-dominio.com/api/mcp
HOST_ACCESS_TOKEN=una-clave-larga-aleatoria
MCP_BEARER_TOKEN=otra-clave-distinta
GOOGLE_GENERATIVE_AI_API_KEY=tu-clave-google
MCP_ALLOWED_URLS=https://tu-otro-mcp.com/mcp
MCP_SERVER_HEADERS={}
```

La ruta MCP y el chat declaran una duración máxima de 60 segundos; el hosting puede imponer otros límites. Verifica que permite a la app llamar a su propio dominio. Una protección externa del despliegue puede bloquear esa llamada; configura un acceso de servicio adecuado.

## Dos claves con funciones diferentes

| Clave               | Protege                          | Cómo se envía                                    |
| ------------------- | -------------------------------- | ------------------------------------------------ |
| `HOST_ACCESS_TOKEN` | Panel: conectar, ejecutar y chat | `x-host-token`; se introduce en «Acceso al host» |
| `MCP_BEARER_TOKEN`  | Endpoint público de tu MCP       | `Authorization: Bearer ...`                      |

Sin `HOST_ACCESS_TOKEN`, las operaciones del host devuelven 503 en producción. La documentación y la configuración pública (URLs permitidas y si el chat está configurado, sin secretos) siguen siendo visibles.

El MCP de ejemplo puede ser público si omites `MCP_BEARER_TOKEN`; sus herramientas solo repiten texto y tiran dados. Antes de añadir información privada o acciones reales, configura esa clave y permisos adecuados. La app utiliza automáticamente el token MCP al consultar `MCP_LOCAL_URL`.

## Conectar tu MCP desde Cursor u otro cliente

Publica tu endpoint y añade en la configuración del cliente:

```json
{
  "mcpServers": {
    "mi-mcp": {
      "url": "https://tu-dominio.com/api/mcp",
      "headers": {
        "Authorization": "Bearer TU_MCP_BEARER_TOKEN"
      }
    }
  }
}
```

Si tu MCP no tiene token, omite headers. No publiques esta configuración con un token real. Comprueba el formato de secretos/variables que admita tu cliente.

## Uso local frente a uso compartido

El repositorio público es una plantilla; no implica publicar una instancia con tus claves para todo Internet. Para desarrollo, limita el servidor a loopback si no necesitas acceso desde la red: `npm run dev -- --hostname 127.0.0.1`.

La clave compartida del host es una barrera básica, no un sistema multiusuario. Todas las personas con esa clave pueden consultar los mismos MCP y consumir tu cuota de Gemini. No hay roles ni separación por organización.

Se incluyen:

- Lista exacta de destinos permitidos, sin redirecciones.
- Comprobación de origen en solicitudes del navegador y comparación de tokens.
- Solicitudes de hasta 128 KB.
- Límite **por proceso y por ruta**: 20 solicitudes/minuto en chat; 60/minuto en cada ruta de clientes.
- Tiempos límite y cierre de conexiones.

El limitador se reinicia al reiniciar el proceso y no se comparte entre instancias. Para un servicio multiusuario, añade autenticación real, autorización por herramienta, límites por usuario con almacenamiento compartido, controles de gasto y monitoreo. Protege las herramientas de escritura con permisos y confirmaciones de tu producto.

Las descripciones y resultados remotos no son confiables por defecto. Las instrucciones al modelo ayudan, pero no sustituyen controles de acceso.
