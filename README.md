# MCP Host

Una plantilla abierta para **crear tu propio servidor MCP** o **conectar varios MCP y consultarlos desde una misma app**.

Incluye un servidor con dos herramientas de ejemplo, un panel para probar herramientas y un chat con Gemini. Puedes explorar el panel sin pagar un proveedor de IA ni configurar claves.

## Empieza en 5 minutos

Necesitas **Node.js 22.18+ o 24+**, npm y Git.

1. Haz un **fork** de este repositorio en GitHub para tener tu propia copia.
2. Clona tu copia e instala las dependencias:

   ```bash
   git clone https://github.com/TU_USUARIO/mcp-host.git
   cd mcp-host
   npm ci
   ```

3. Copia la configuración de ejemplo:

   ```bash
   cp .env.example .env.local
   # PowerShell: Copy-Item .env.example .env.local
   ```

4. Inicia la app:

   ```bash
   npm run dev
   ```

5. Abre http://localhost:3000, pulsa **Añadir MCP de ejemplo**, después **Conectar**.
6. Ejecuta `echo` con un mensaje o `roll_dice` con `sides = 6`.

**Resultado esperado:** echo devuelve tu mensaje y el dado un número entre 1 y 6. No necesitas Gemini para este recorrido. La [guía dentro de la app](http://localhost:3000/guide) explica los mismos pasos.

> Si Next.js inicia en otro puerto, cambia también `MCP_LOCAL_URL` en `.env.local` y reinicia. Las URLs se utilizan completas, sin añadir rutas automáticamente.

## Elige tu recorrido

| Quiero…                                       | Empieza aquí                                     |
| --------------------------------------------- | ------------------------------------------------ |
| Entender MCP y la arquitectura                | [Cómo funciona](docs/architecture.md)            |
| Crear herramientas para mi propio MCP         | [Crear un MCP](docs/create-mcp.md)               |
| Conectar varios servidores y sus credenciales | [Conectar servidores](docs/connect-servers.md)   |
| Preguntar a los servidores con Gemini         | [Usar el chat](docs/chat.md)                     |
| Publicar mi copia o conectar Cursor           | [Despliegue y acceso](docs/deployment.md)        |
| Resolver un error                             | [Solución de problemas](docs/troubleshooting.md) |
| Contribuir al proyecto                        | [Contribuciones](CONTRIBUTING.md)                |

## Activar el chat (opcional)

Añade tu clave de Google AI Studio a `.env.local`:

```dotenv
GOOGLE_GENERATIVE_AI_API_KEY=tu_clave
GEMINI_MODEL=gemini-2.5-flash
```

Reinicia la app, abre **Chat**, selecciona el MCP de ejemplo y pregunta: «Tira un dado de 6 caras».

El chat utiliza **los servidores seleccionados en el panel o en la pantalla de chat**. No basta con añadirlos: deben estar permitidos y disponibles. Cambiar la selección inicia una conversación nueva. Gemini recibe los mensajes y los resultados necesarios; sus cuotas y costes dependen de tu cuenta de Google.

## Configuración

Copia siempre [`.env.example`](.env.example); nunca publiques claves reales.

| Variable                       | Para qué sirve                                        | Valor inicial / requisito                              |
| ------------------------------ | ----------------------------------------------------- | ------------------------------------------------------ |
| `MCP_LOCAL_URL`                | Endpoint de esta instalación                          | `http://localhost:3000/api/mcp`; cámbialo al desplegar |
| `MCP_ALLOWED_URLS`             | Endpoints adicionales permitidos, separados por comas | Vacío; URLs exactas, sin comodines                     |
| `MCP_SERVER_HEADERS`           | Objeto JSON: URL exacta → headers privados            | `{}`                                                   |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Credencial de Gemini                                  | Solo para el chat                                      |
| `GEMINI_MODEL`                 | Modelo de Google                                      | `gemini-2.5-flash`                                     |
| `HOST_ACCESS_TOKEN`            | Clave compartida para el panel/API/chat               | Obligatoria al ejecutar en producción                  |
| `MCP_BEARER_TOKEN`             | Protege tu endpoint `/api/mcp`                        | Opcional; recomendable al añadir datos privados        |

Las claves de servicios remotos permanecen en el servidor. **No uses variables `NEXT_PUBLIC_*` para secretos.**

## Qué admite esta plantilla

- Herramientas MCP mediante **Streamable HTTP**.
- Servidores sin autenticación o con **headers estáticos** configurados por el administrador.
- Formularios para argumentos simples y editor JSON para esquemas complejos.
- Resultados de herramientas con contenido y contenido estructurado; errores MCP visibles.
- Chat con hasta **6 servidores**, **100 herramientas** y **5 pasos de agente** por respuesta.
- Listado manual de hasta **200 herramientas** por servidor.

No implementa transporte stdio, SSE heredado, inicio de sesión OAuth, resources/prompts MCP, cuentas de usuario ni almacenamiento de conversaciones. Los «servidores locales» también deben ofrecer HTTP; esta app no ejecuta comandos de tu equipo.

## Comprobaciones

```bash
npm run check             # ESLint, TypeScript y pruebas unitarias
npm run format:check      # Revisa el formato del código y la documentación
npm run build             # Compilación de producción
npm run test:integration  # Inicia la build y dos MCP de prueba; no usa claves reales
npm run test:mcp          # Prueba manual contra localhost:3000/api/mcp ya iniciado
```

`test:integration` usa los puertos 3400 y 3401; deben estar libres. El chat real con Gemini requiere una clave y debe verificarse aparte. CI ejecuta las comprobaciones sin credenciales.

## Estructura

```text
app/
  page.tsx                    Panel de servidores y herramientas
  chat/page.tsx               Selección de servidores y conversación
  guide/page.tsx              Guía integrada
  components/host-shell.tsx   Navegación y acceso al host
  api/
    config/route.ts          Configuración pública (sin claves)
    mcp/route.ts             Transporte de tu MCP
    clients/connect/route.ts Listado de herramientas remotas
    clients/call-tool/route.ts Ejecución manual
    chat/route.ts            Gemini + herramientas seleccionadas
lib/
  mcp-tools.ts               ← Añade tus herramientas aquí
  mcp-client.ts              Conexiones MCP con cierre y tiempo límite
  server-config.ts           URLs permitidas, credenciales y controles de API
  chat-tools.ts              Identificadores estables por servidor/herramienta
  browser-store.ts           Lista compartida entre panel y chat
docs/                        Guías paso a paso
tests/                       Pruebas de configuración y seguridad
scripts/                     Pruebas de integración y cliente manual
```

## Antes de desplegar

El repositorio es público; **cada persona debe desplegar su propia copia con sus propias claves**. Una instalación compartida usa las credenciales de quien la administra para todas las personas con acceso.

En producción, configura `HOST_ACCESS_TOKEN` e introdúcelo en **Acceso al host**. El endpoint MCP usa una clave independiente, `MCP_BEARER_TOKEN`. El limitador incluido funciona por proceso: un servicio público con múltiples instancias requiere autenticación por usuario, autorización y límites compartidos. Lee [la guía de despliegue](docs/deployment.md).
