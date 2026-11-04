import assert from "node:assert/strict";
import { test, after } from "node:test";
import {
  canonicalUrl,
  approvedUrl,
  allowedMcpUrls,
  serverHeaders,
  guardHost,
  readJson,
  HttpError,
  mcpFetch,
  secretMatches,
} from "../lib/server-config.ts";
import { toolAlias } from "../lib/chat-tools.ts";

const original = { ...process.env };
after(() => {
  for (const key of Object.keys(process.env))
    if (!(key in original)) delete process.env[key];
  Object.assign(process.env, original);
});
test("URL allowlist keeps complete endpoint paths and rejects unsafe inputs", () => {
  process.env.MCP_LOCAL_URL = "http://localhost:3000/api/mcp";
  process.env.MCP_ALLOWED_URLS =
    " https://EXAMPLE.com/custom/rpc,https://example.com/custom/rpc ";
  assert.deepEqual(allowedMcpUrls(), [
    "http://localhost:3000/api/mcp",
    "https://example.com/custom/rpc",
  ]);
  assert.equal(
    approvedUrl("https://example.com/custom/rpc"),
    "https://example.com/custom/rpc",
  );
  for (const value of [
    "https://example.com/custom/rpc/",
    "https://example.com/other",
    "http://169.254.169.254/",
    "http://127.0.0.1:9000/",
  ])
    assert.throws(() => approvedUrl(value), HttpError);
  for (const value of [
    "file:///etc/passwd",
    "https://user:secret@example.com/mcp",
    "https://example.com/#token",
    "no-url",
  ])
    assert.throws(() => canonicalUrl(value), HttpError);
});
test("credentials belong to exact URLs and local token is independent", () => {
  process.env.MCP_SERVER_HEADERS =
    '{"https://example.com/mcp":{"Authorization":"Bearer test-only"}}';
  process.env.MCP_BEARER_TOKEN = "local-test";
  assert.deepEqual(serverHeaders("https://example.com/mcp"), {
    Authorization: "Bearer test-only",
  });
  assert.deepEqual(serverHeaders("https://example.com/other"), {});
  assert.deepEqual(serverHeaders("http://localhost:3000/api/mcp"), {
    Authorization: "Bearer local-test",
  });
  for (const bad of ["{", "[]", '{"https://example.com/mcp":{"secret":12}}']) {
    process.env.MCP_SERVER_HEADERS = bad;
    assert.throws(() => serverHeaders("https://example.com/mcp"), HttpError);
  }
});
test("host requires configured token and same browser origin; production fails closed", () => {
  process.env.HOST_ACCESS_TOKEN = "host-test";
  const req = (headers = {}) =>
    new Request("http://localhost/api/clients/connect", { headers });
  assert.throws(() => guardHost(req()), { status: 401 });
  assert.throws(
    () =>
      guardHost(
        req({ "x-host-token": "host-test", origin: "https://evil.example" }),
      ),
    { status: 403 },
  );
  assert.doesNotThrow(() =>
    guardHost(req({ "x-host-token": "host-test", origin: "http://localhost" })),
  );
  assert.doesNotThrow(() =>
    guardHost(
      req({
        "x-host-token": "host-test",
        origin: "http://127.0.0.1",
        host: "127.0.0.1",
      }),
    ),
  );
  Object.assign(process.env, { NODE_ENV: "production" });
  delete process.env.HOST_ACCESS_TOKEN;
  assert.throws(() => guardHost(req()), { status: 503 });
  Object.assign(process.env, { NODE_ENV: "test" });
  assert.equal(secretMatches("test", "test"), true);
  assert.equal(secretMatches("bad", "test"), false);
});
test("JSON parser rejects malformed and oversized bodies without trusting Content-Length", async () => {
  const req = (body: string) =>
    new Request("http://localhost", { method: "POST", body });
  assert.deepEqual(await readJson(req('{"ok":true}')), { ok: true });
  await assert.rejects(readJson(req("{")), { status: 400 });
  await assert.rejects(
    readJson(req(JSON.stringify({ value: "x".repeat(128_001) }))),
    { status: 413 },
  );
});
test("tool namespaces stay stable and distinguish same names on different servers", () => {
  const a = toolAlias("https://a.test/mcp", "echo");
  assert.equal(a, toolAlias("https://a.test/mcp", "echo"));
  assert.notEqual(a, toolAlias("https://b.test/mcp", "echo"));
  assert.notEqual(
    toolAlias("https://a.test/mcp", "a.b"),
    toolAlias("https://a.test/mcp", "a_b"),
  );
  assert.match(
    toolAlias("https://a.test/mcp", "á".repeat(100)),
    /^[a-zA-Z0-9_-]{1,64}$/,
  );
});
test("network adapter rejects unapproved destinations and enforces redirect:error", async () => {
  const originalFetch = globalThis.fetch;
  let seen: RequestInit | undefined;
  globalThis.fetch = async (_input, init) => {
    seen = init;
    return new Response("ok");
  };
  try {
    await mcpFetch(new AbortController().signal)(
      "https://example.com/custom/rpc",
      { redirect: "follow" },
    );
    assert.equal(seen?.redirect, "error");
    await assert.rejects(
      mcpFetch(new AbortController().signal)("https://evil.test/mcp"),
      { status: 403 },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
