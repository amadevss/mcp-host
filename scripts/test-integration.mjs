#!/usr/bin/env node
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const host = "http://127.0.0.1:3400";
const remote = "http://127.0.0.1:3401";
const calls = [];
const fixtures = createServer(async (req, res) => {
  if (req.url === "/redirect") {
    res.writeHead(307, { Location: remote + "/a" });
    res.end();
    return;
  }
  if (req.url === "/unavailable") {
    res.writeHead(503);
    res.end();
    return;
  }
  if (!["/a", "/b"].includes(req.url)) {
    res.writeHead(404);
    res.end();
    return;
  }
  if (req.headers.authorization !== "Bearer fixture") {
    res.writeHead(401);
    res.end();
    return;
  }
  const label = req.url.slice(1);
  const server = new McpServer({ name: label, version: "1.0.0" });
  server.registerTool(
    "echo",
    { description: "Fixture echo", inputSchema: { message: z.string() } },
    async ({ message }) => {
      calls.push({ server: label, message });
      return { content: [{ type: "text", text: label + ":" + message }] };
    },
  );
  server.registerTool("fail", { inputSchema: {} }, async () => ({
    isError: true,
    content: [{ type: "text", text: "Error controlado" }],
  }));
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  res.on("close", () => {
    void transport.close();
    void server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } catch {
    if (!res.headersSent) res.writeHead(500);
    res.end();
  }
});
let app;
const post = (path, body, headers = {}) =>
  fetch(host + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-host-token": "host-fixture",
      ...headers,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });
try {
  await new Promise((resolve, reject) => {
    fixtures.once("error", reject);
    fixtures.listen(3401, "127.0.0.1", resolve);
  });
  const urls = ["/a", "/b", "/redirect", "/unavailable"].map((p) => remote + p);
  const env = {
    ...process.env,
    MCP_LOCAL_URL: host + "/api/mcp",
    HOST_ACCESS_TOKEN: "host-fixture",
    MCP_BEARER_TOKEN: "mcp-fixture",
    MCP_ALLOWED_URLS: urls.join(","),
    MCP_SERVER_HEADERS: JSON.stringify(
      Object.fromEntries(
        urls.map((u) => [u, { Authorization: "Bearer fixture" }]),
      ),
    ),
    GOOGLE_GENERATIVE_AI_API_KEY: "fixture-never-sent",
    NODE_OPTIONS: `--import=${pathToFileURL(process.cwd() + "/scripts/fixtures/mock-google.mjs").href}`,
  };
  app = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3400",
    ],
    { env, stdio: ["ignore", "pipe", "pipe"] },
  );
  let logs = "";
  app.stdout.on("data", (d) => {
    logs += d;
  });
  app.stderr.on("data", (d) => {
    logs += d;
  });
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (app.exitCode !== null) throw new Error("Next.js no inició: " + logs);
    try {
      if ((await fetch(host + "/api/config")).ok) {
        ready = true;
        break;
      }
    } catch {
      /* Wait for startup. */
    }
    await delay(200);
  }
  assert.ok(ready, "El servidor no estuvo listo a tiempo. " + logs);
  for (const path of ["/", "/chat", "/guide"]) {
    const response = await fetch(host + path);
    assert.equal(response.status, 200);
    assert.ok((await response.text()).includes('lang="es"'));
  }
  const config = await (await fetch(host + "/api/config")).json();
  assert.equal(config.localUrl, host + "/api/mcp");
  assert.equal(JSON.stringify(config).includes("host-fixture"), false);
  assert.equal(
    (
      await post(
        "/api/clients/connect",
        { url: host + "/api/mcp" },
        { "x-host-token": "" },
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await post(
        "/api/clients/connect",
        { url: host + "/api/mcp" },
        { origin: "https://evil.test" },
      )
    ).status,
    403,
  );
  assert.equal(
    (await post("/api/clients/connect", { url: "http://169.254.169.254/" }))
      .status,
    403,
  );
  assert.equal((await post("/api/clients/connect", {})).status, 400);
  assert.equal(
    (
      await post("/api/clients/call-tool", {
        url: remote + "/a",
        toolName: "echo",
        args: [],
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await post("/api/clients/connect", {
        url: host + "/api/mcp",
        extra: "x".repeat(128_000),
      })
    ).status,
    413,
  );
  assert.equal(
    (await fetch(host + "/api/mcp", { method: "POST" })).status,
    401,
  );
  const local = await post(
    "/api/clients/connect",
    { url: host + "/api/mcp" },
    { origin: host },
  );
  assert.equal(local.status, 200);
  assert.deepEqual((await local.json()).tools.map((t) => t.name).sort(), [
    "echo",
    "roll_dice",
  ]);
  const probe = spawnSync(
    process.execPath,
    ["scripts/test-mcp-client.mjs", host + "/api/mcp"],
    {
      env: { ...process.env, MCP_BEARER_TOKEN: "mcp-fixture" },
      encoding: "utf8",
      timeout: 20_000,
    },
  );
  assert.equal(probe.status, 0, probe.stdout + probe.stderr);
  for (const label of ["a", "b"]) {
    const response = await post("/api/clients/connect", {
      url: remote + "/" + label,
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).tools.length, 2);
    const result = await (
      await post("/api/clients/call-tool", {
        url: remote + "/" + label,
        toolName: "echo",
        args: { message: label },
      })
    ).json();
    assert.equal(result.content[0].text, label + ":" + label);
  }
  const failure = await (
    await post("/api/clients/call-tool", {
      url: remote + "/a",
      toolName: "fail",
      args: {},
    })
  ).json();
  assert.equal(failure.isError, true);
  assert.equal(failure.content[0].text, "Error controlado");
  assert.equal(
    (await post("/api/clients/connect", { url: remote + "/redirect" })).status,
    502,
  );
  const messages = [
    {
      id: "test-user",
      role: "user",
      parts: [{ type: "text", text: "Consulta echo en ambos servidores" }],
    },
  ];
  const unavailable = await post("/api/chat", {
    messages,
    servers: [{ name: "No disponible", url: remote + "/unavailable" }],
  });
  assert.equal(unavailable.status, 502);
  assert.match((await unavailable.json()).error, /No disponible/);
  const chat = await post("/api/chat", {
    messages,
    servers: ["a", "b"].map((name) => ({ name, url: remote + "/" + name })),
  });
  const stream = await chat.text();
  assert.equal(chat.status, 200, stream);
  assert.match(stream, /tool-output-available/);
  assert.match(stream, /Respuesta simulada/);
  for (const label of ["a", "b"])
    assert.ok(
      calls.some((c) => c.server === label && c.message === "prueba de chat"),
      "Falta llamada del chat al MCP " + label,
    );
  const noTools = await post("/api/chat", { messages, servers: [] });
  assert.equal(noTools.status, 200);
  assert.match(await noTools.text(), /Respuesta simulada/);
  console.log(
    "Integración correcta: páginas, acceso, validación, MCP local, dos MCP remotos, errores, redirecciones y chat con Gemini simulado.",
  );
} finally {
  if (app && app.exitCode === null) {
    app.kill("SIGTERM");
    await new Promise((resolve) => app.once("exit", resolve));
  }
  fixtures.closeAllConnections();
  await new Promise((resolve) => fixtures.close(resolve));
}
