import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "echo",
      {
        title: "Echo",
        description: "Echo a message back",
        inputSchema: {
          message: z.string().min(1).max(500),
        },
      },
      async ({ message }) => ({
        content: [{ type: "text", text: `Echo: ${message}` }],
      })
    );

    server.registerTool(
      "roll_dice",
      {
        title: "Roll Dice",
        description: "Roll an N-sided die",
        inputSchema: {
          sides: z.number().int().min(2).max(100),
        },
      },
      async ({ sides }) => {
        const value = 1 + Math.floor(Math.random() * sides);
        return {
          content: [
            {
              type: "text",
              text: `🎲 You rolled a ${value} (d${sides})!`,
            },
          ],
        };
      }
    );
  },
  {
    serverInfo: {
      name: "mcp-host-server",
      version: "1.0.0",
    },
  },
  {
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV === "development",
    disableSse: true,
  }
);

export { handler as GET, handler as POST, handler as DELETE };
