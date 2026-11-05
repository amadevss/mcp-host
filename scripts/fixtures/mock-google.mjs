// Test-only preload used by test-integration.mjs. Never loaded by npm start.
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = input instanceof Request ? input.url : String(input);
  if (new URL(url).hostname !== "generativelanguage.googleapis.com")
    return originalFetch(input, init);
  const body = JSON.parse(String(init?.body || "{}"));
  const hasResults = body.contents?.some((c) =>
    c.parts?.some((p) => p.functionResponse),
  );
  const functions =
    body.tools?.flatMap((t) => t.functionDeclarations || []) || [];
  const echoes = functions.filter((f) =>
    f.description?.includes("Herramienta: echo."),
  );
  const parts =
    !hasResults && echoes.length
      ? echoes.map((f) => ({
          functionCall: { name: f.name, args: { message: "prueba de chat" } },
        }))
      : [{ text: "Respuesta simulada: se consultaron los MCP seleccionados." }];
  const payload = {
    candidates: [
      { index: 0, content: { role: "model", parts }, finishReason: "STOP" },
    ],
    usageMetadata: {
      promptTokenCount: 10,
      candidatesTokenCount: 5,
      totalTokenCount: 15,
    },
  };
  return new Response(`data: ${JSON.stringify(payload)}\n\n`, {
    headers: { "Content-Type": "text/event-stream" },
  });
};
