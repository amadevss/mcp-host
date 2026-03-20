"use client";

import { useState, useEffect, useCallback } from "react";

type McpTool = {
  name: string;
  description?: string;
  inputSchema?: {
    type?: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
};

type McpClient = {
  id: string;
  name: string;
  url: string;
  tools: McpTool[];
  loading: boolean;
  error?: string;
};

const STORAGE_KEY = "mcp-host-clients";

function getDefaultUrl() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/mcp`;
  }
  return "http://localhost:3000/api/mcp";
}

function loadClients(): Omit<McpClient, "tools" | "loading" | "error">[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Omit<McpClient, "tools" | "loading" | "error">[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveClients(clients: Omit<McpClient, "tools" | "loading" | "error">[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(clients.map(({ id, name, url }) => ({ id, name, url })))
  );
}

export default function Home() {
  const [clients, setClients] = useState<McpClient[]>([]);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState(getDefaultUrl());
  const [toolInputs, setToolInputs] = useState<Record<string, string>>({});
  const [toolResults, setToolResults] = useState<Record<string, string>>({});

  const loadStoredClients = useCallback(() => {
    const stored = loadClients();
    const list =
      stored.length > 0
        ? stored
        : [
            {
              id: crypto.randomUUID(),
              name: "Servidor local",
              url: getDefaultUrl(),
            },
          ];
    if (stored.length === 0 && list.length > 0) {
      saveClients(list);
    }
    setClients(
      list.map((c) => ({
        ...c,
        tools: [],
        loading: false,
      }))
    );
  }, []);

  useEffect(() => {
    loadStoredClients();
  }, [loadStoredClients]);

  const addClient = () => {
    if (!newName.trim() || !newUrl.trim()) return;
    const id = crypto.randomUUID();
    const client: McpClient = {
      id,
      name: newName.trim(),
      url: newUrl.trim(),
      tools: [],
      loading: false,
    };
    setClients((prev) => {
      const next = [...prev, client];
      saveClients(next.map((c) => ({ id: c.id, name: c.name, url: c.url })));
      return next;
    });
    setNewName("");
    setNewUrl(getDefaultUrl());
  };

  const removeClient = (id: string) => {
    setClients((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveClients(next.map((c) => ({ id: c.id, name: c.name, url: c.url })));
      return next;
    });
  };

  const connectClient = async (client: McpClient) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === client.id ? { ...c, loading: true, error: undefined } : c
      )
    );
    try {
      const res = await fetch("/api/clients/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: client.url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setClients((prev) =>
          prev.map((c) =>
            c.id === client.id
              ? { ...c, loading: false, tools: [], error: data.error }
              : c
          )
        );
        return;
      }
      setClients((prev) =>
        prev.map((c) =>
          c.id === client.id
            ? { ...c, loading: false, tools: data.tools ?? [], error: undefined }
            : c
        )
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setClients((prev) =>
        prev.map((c) =>
          c.id === client.id
            ? { ...c, loading: false, tools: [], error: msg }
            : c
        )
      );
    }
  };

  const callTool = async (
    clientUrl: string,
    toolName: string,
    args: Record<string, unknown>
  ) => {
    const key = `${clientUrl}:${toolName}`;
    setToolResults((prev) => ({ ...prev, [key]: "Llamando..." }));
    try {
      const res = await fetch("/api/clients/call-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: clientUrl, toolName, args }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToolResults((prev) => ({
          ...prev,
          [key]: `Error: ${data.error ?? "Error desconocido"}`,
        }));
        return;
      }
      const content = data.content ?? [];
      const text = content
        .map((c: { type?: string; text?: string }) =>
          c.type === "text" ? c.text : JSON.stringify(c)
        )
        .join("\n");
      setToolResults((prev) => ({ ...prev, [key]: text || "(vacío)" }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setToolResults((prev) => ({ ...prev, [key]: `Error: ${msg}` }));
    }
  };

  const getToolArgs = (tool: McpTool): Record<string, unknown> => {
    const props = tool.inputSchema?.properties ?? {};
    const required = tool.inputSchema?.required ?? [];
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(props)) {
      const raw = String(toolInputs[`${tool.name}:${key}`] ?? "").trim();
      const prop = props[key] as { type?: string | string[] };
      const propType = Array.isArray(prop?.type) ? prop.type[0] : prop?.type;
      const isNumber = propType === "number" || propType === "integer";
      if (isNumber) {
        const num = raw ? Number(raw) : NaN;
        result[key] = !Number.isNaN(num) ? num : (required.includes(key) ? 6 : undefined);
      } else {
        result[key] = raw || (required.includes(key) ? "" : undefined);
      }
    }
    return result;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <header className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold tracking-tight">
            MCP Host
          </h1>
          <a
            href="/chat"
            className="text-sm text-amber-400 hover:text-amber-300"
          >
            Chat con Gemini →
          </a>
        </div>
        <p className="mt-1 text-sm text-zinc-400">
          Conecta clientes MCP y prueba sus tools
        </p>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-medium text-zinc-200">
            Nuevo cliente
          </h2>
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Nombre"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <input
              type="url"
              placeholder="URL del servidor MCP"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="min-w-[280px] flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              onClick={addClient}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
            >
              Añadir
            </button>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-medium text-zinc-200">
            Clientes ({clients.length})
          </h2>
          {clients.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 px-6 py-8 text-center text-zinc-500">
              Añade un cliente para empezar. El servidor local está en{" "}
              <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-amber-400">
                {getDefaultUrl()}
              </code>
            </p>
          ) : (
            <div className="space-y-6">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-zinc-100">
                        {client.name}
                      </h3>
                      <code className="mt-1 block text-xs text-zinc-500">
                        {client.url}
                      </code>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => connectClient(client)}
                        disabled={client.loading}
                        className="rounded-lg bg-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-200 hover:bg-zinc-600 disabled:opacity-50"
                      >
                        {client.loading ? "Conectando…" : "Conectar"}
                      </button>
                      <button
                        onClick={() => removeClient(client.id)}
                        className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-400 hover:border-red-500/50 hover:text-red-400"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {client.error && (
                    <p className="mt-3 rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-400">
                      {client.error}
                    </p>
                  )}

                  {client.tools.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <h4 className="text-sm font-medium text-zinc-400">
                        Tools
                      </h4>
                      {client.tools.map((tool) => (
                        <div
                          key={tool.name}
                          className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-mono text-sm text-amber-400">
                              {tool.name}
                            </span>
                            <button
                              onClick={() =>
                                callTool(
                                  client.url,
                                  tool.name,
                                  getToolArgs(tool)
                                )
                              }
                              className="rounded bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-500"
                            >
                              Ejecutar
                            </button>
                          </div>
                          {tool.description && (
                            <p className="mb-3 text-xs text-zinc-500">
                              {tool.description}
                            </p>
                          )}
                          {tool.inputSchema?.properties &&
                            Object.keys(tool.inputSchema.properties).length >
                              0 && (
                              <div className="space-y-2">
                                {Object.entries(
                                  tool.inputSchema.properties
                                ).map(([key, schema]) => {
                                  const s = schema as {
                                    type?: string | string[];
                                    description?: string;
                                  };
                                  const schemaType = Array.isArray(s.type)
                                    ? s.type[0]
                                    : s.type;
                                  const isNumeric =
                                    schemaType === "number" ||
                                    schemaType === "integer";
                                  const inputKey = `${tool.name}:${key}`;
                                  return (
                                    <div key={key}>
                                      <label className="mb-1 block text-xs text-zinc-500">
                                        {key}
                                        {s.description && ` — ${s.description}`}
                                      </label>
                                      <input
                                        type={isNumeric ? "number" : "text"}
                                        value={
                                          toolInputs[inputKey] ?? ""
                                        }
                                        onChange={(e) =>
                                          setToolInputs((prev) => ({
                                            ...prev,
                                            [inputKey]: e.target.value,
                                          }))
                                        }
                                        className="w-full rounded border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          {toolResults[`${client.url}:${tool.name}`] && (
                            <pre className="mt-3 max-h-32 overflow-auto rounded bg-zinc-950 p-2 text-xs text-zinc-300">
                              {
                                toolResults[
                                  `${client.url}:${tool.name}`
                                ]
                              }
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
