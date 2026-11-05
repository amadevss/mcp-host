# Crear tu propio MCP

[Volver al README](../README.md)

## 1. Parte del ejemplo

Completa el inicio rápido del README. Comprueba que puedes ejecutar `echo` antes de modificar el proyecto.

## 2. Añade una herramienta

Abre `lib/mcp-tools.ts`. El archivo ya importa Zod como `z`. Dentro de `registerTools(server)`, añade:

```ts
server.registerTool(
  "saludar",
  {
    title: "Saludar a una persona",
    description: "Devuelve un saludo personalizado usando el nombre recibido.",
    inputSchema: {
      nombre: z
        .string()
        .trim()
        .min(1)
        .max(100)
        .describe("Nombre de la persona"),
    },
  },
  async ({ nombre }) => ({
    content: [{ type: "text", text: `Hola, ${nombre}!` }],
  }),
);
```

El nombre identifica la herramienta y debe ser único dentro de tu servidor. La descripción ayuda a personas y modelos a decidir cuándo usarla. Zod valida los argumentos antes de ejecutar la función. `content` es una lista de bloques MCP, no una respuesta HTTP.

## 3. Prueba desde el panel y el chat

1. Guarda el archivo y vuelve al panel.
2. Pulsa **Conectar** en el servidor de esta app para actualizar las herramientas.
3. En `saludar`, introduce `Ana`.
4. Ejecuta la herramienta. Debes ver `Hola, Ana!`.
5. Si activaste Gemini, selecciona ese MCP en el chat y escribe «Saluda a Ana usando la herramienta saludar».

También puedes ejecutar `npm run test:mcp` para comprobar las dos herramientas originales. El script no ejecuta herramientas nuevas automáticamente: añade una llamada explícita al script o pruébalas en el panel.

## 4. Consultar servicios reales

Usa variables privadas como `process.env.MI_API_KEY` dentro de la función. No incluyas claves en nombres, descripciones, logs o resultados. Para HTTP externo, fija un tiempo límite:

```ts
const response = await fetch("https://api.tu-servicio.com/datos", {
  headers: { Authorization: `Bearer ${process.env.MI_API_KEY}` },
  signal: AbortSignal.timeout(10_000),
});
if (!response.ok) {
  return {
    isError: true,
    content: [{ type: "text", text: "No se pudieron consultar los datos." }],
  };
}
```

Devuelve errores comprensibles y datos mínimos. Si la herramienta modifica información, implementa autorización y confirmación dentro de tu producto antes de ejecutarla: el agente puede invocar herramientas automáticamente.

## 5. Personalizar y compartir

- Cambia el nombre y versión del servidor en `app/api/mcp/route.ts`.
- Personaliza título y descripción en `app/layout.tsx`.
- Edita el panel y la guía para tu caso de uso.
- Mantén `.env.example` actualizado con nombres de variables, nunca valores reales.
- Sigue [Despliegue](deployment.md) para publicar el endpoint y conectarlo desde otra app.

No necesitas cambiar el transporte HTTP para añadir herramientas.
