import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/** Añade herramientas aquí. Consulta docs/create-mcp.md para un ejemplo completo. */
export function registerTools(server: McpServer) {
  server.registerTool(
    "echo",
    {
      title: "Repetir un mensaje",
      description: "Repite el mensaje recibido.",
      inputSchema: {
        message: z
          .string()
          .min(1)
          .max(500)
          .describe("Mensaje que quieres repetir"),
      },
    },
    async ({ message }) => ({
      content: [{ type: "text", text: `Echo: ${message}` }],
    }),
  );
  server.registerTool(
    "roll_dice",
    {
      title: "Tirar un dado",
      description: "Tira un dado de entre 2 y 100 caras.",
      inputSchema: {
        sides: z
          .number()
          .int()
          .min(2)
          .max(100)
          .describe("Número de caras; por ejemplo, 6"),
      },
    },
    async ({ sides }) => ({
      content: [
        {
          type: "text",
          text: `🎲 ${1 + Math.floor(Math.random() * sides)} (d${sides})`,
        },
      ],
    }),
  );
}
