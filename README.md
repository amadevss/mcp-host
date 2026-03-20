# MCP Host

App Next.js con servidor MCP, interfaz tipo Host y clientes MCP para conectar a múltiples servidores.

## Características

- **MCP Server**: Servidor MCP en `/api/mcp` con tools `echo` y `roll_dice`
- **Host UI**: Interfaz para gestionar clientes y probar tools
- **Chat con Gemini**: Chat en `/chat` que usa Gemini + tools MCP, con [Streamdown](https://streamdown.ai/) para Markdown en streaming
- **Múltiples clientes**: Añade varios servidores MCP (locales o remotos) y conéctate a ellos

## Inicio rápido

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Verás el Host UI con un cliente "Servidor local" por defecto.

1. Haz clic en **Conectar** para listar los tools del servidor
2. Introduce los parámetros y haz clic en **Ejecutar** para probar cada tool
3. Ve a [/chat](http://localhost:3000/chat) para el chat con Gemini (requiere `GOOGLE_GENERATIVE_AI_API_KEY` en `.env.local`)

## Añadir más clientes

En "Nuevo cliente" introduce un nombre y la URL del servidor MCP (ej: `https://tu-app.vercel.app/api/mcp`) y pulsa **Añadir**.

## Probar desde terminal

```bash
node scripts/test-mcp-client.mjs
# o con URL personalizada:
node scripts/test-mcp-client.mjs https://tu-servidor.com/api/mcp
```

## Estructura

```
app/
├── api/
│   ├── mcp/route.ts           # MCP Server (Streamable HTTP)
│   └── clients/
│       ├── connect/route.ts   # Listar tools de un servidor
│       └── call-tool/route.ts # Invocar un tool
├── page.tsx                   # Host UI
lib/
└── mcp-client.ts              # Cliente MCP (stateless)
```

## Configurar en Cursor

Añade en tu configuración MCP:

```json
{
  "mcpServers": {
    "mcp-host": {
      "url": "http://localhost:3000/api/mcp"
    }
  }
}
```

## Deploy en Vercel

El proyecto está listo para Vercel. Considera habilitar [Fluid compute](https://vercel.com/docs/fluid-compute) y ajustar `maxDuration` en la ruta MCP si usas Pro/Enterprise.
