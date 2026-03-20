import { createAgentUIStreamResponse } from "ai";
import { google } from "@ai-sdk/google";
import { createMCPClient } from "@ai-sdk/mcp";
import { ToolLoopAgent } from "ai";

export const maxDuration = 30;

function getMcpUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.origin}/api/mcp`;
}

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "GOOGLE_GENERATIVE_AI_API_KEY no está configurada en .env.local",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages } = (await request.json()) as { messages: unknown[] };
  const mcpUrl = getMcpUrl(request);

  const mcpClient = await createMCPClient({
    transport: {
      type: "http",
      url: mcpUrl,
    },
  });

  let tools = await mcpClient.tools();
  const clientsToClose = [mcpClient];

  const neonApiKey = process.env.NEON_API_KEY;
  if (neonApiKey) {
    const neonClient = await createMCPClient({
      transport: {
        type: "http",
        url: "https://mcp.neon.tech/mcp",
        headers: {
          Authorization: `Bearer ${neonApiKey}`,
          "x-read-only": "true",
        },
      },
    });
    const neonTools = await neonClient.tools();
    tools = { ...tools, ...neonTools };
    clientsToClose.push(neonClient);
  }

  const instructions = neonApiKey
    ? `Eres un asistente útil con acceso a tools locales (echo, roll_dice) y a la base de datos Neon Postgres.
Puedes consultar tablas, ejecutar SQL de solo lectura y analizar datos (encuestas, etc.) en lenguaje natural.
Usa las tools de Neon cuando el usuario pregunte por datos, estadísticas o análisis de la base de datos.
Responde en español.`
    : "Eres un asistente útil con acceso a tools. Puedes usar echo para repetir mensajes y roll_dice para tirar dados. Responde en español.";

  return createAgentUIStreamResponse({
    agent: new ToolLoopAgent({
      model: google("gemini-2.5-flash"),
      instructions,
      tools,
    }),
    uiMessages: messages,
    onFinish: async () => {
      await Promise.all(clientsToClose.map((c) => c.close()));
    },
  });
}
