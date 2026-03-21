"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

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

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3Z" />
      <path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" />
      <path d="M5 15l1.2 2.8L9 19l-2.8 1.2L5 23l-1.2-2.8L1 19l2.8-1.2L5 15Z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M7 10h10" />
      <path d="M7 14h6" />
      <path d="M5 20l1.8-3.6A8 8 0 1 1 20 12a8 8 0 0 1-8 8H5Z" />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <rect x="4" y="4" width="16" height="6" rx="2" />
      <rect x="4" y="14" width="16" height="6" rx="2" />
      <path d="M8 7h.01M8 17h.01M12 7h6M12 17h6" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 3.8 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}

function ToolIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.8L3 18.4V21h2.6l6.3-6.3a4 4 0 0 0 5.8-5.4l-3 3-2.8-.6-.6-2.8 3-2.6Z" />
    </svg>
  );
}

function SectionBadge({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-sky-700 uppercase shadow-sm backdrop-blur">
      <span className="text-sky-500">{icon}</span>
      {label}
    </span>
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
    const frame = window.requestAnimationFrame(() => {
      loadStoredClients();
    });
    return () => window.cancelAnimationFrame(frame);
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
        result[key] = !Number.isNaN(num) ? num : required.includes(key) ? 6 : undefined;
      } else {
        result[key] = raw || (required.includes(key) ? "" : undefined);
      }
    }
    return result;
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.28),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.18),_transparent_24%),linear-gradient(180deg,_#f8fbff_0%,_#eef6ff_48%,_#f8fafc_100%)] text-slate-900">
      <header className="border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-[0_14px_32px_-16px_rgba(14,165,233,0.95)]">
              <ServerIcon />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-950">
                MCP Host
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Centro visual para conectar clientes MCP y probar tools con mejor feedback.
              </p>
            </div>
          </div>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-white"
          >
            <ChatIcon />
            Abrir chat Gemini
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/78 p-8 shadow-[0_35px_80px_-45px_rgba(30,41,59,0.45)] backdrop-blur-xl">
            <SectionBadge icon={<SparklesIcon />} label="Inicio" />
            <h2 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950">
              Una pantalla más clara, útil y agradable para gestionar tus servidores MCP.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Añade clientes, conéctalos y ejecuta tools con tarjetas más visuales, estados más claros y una experiencia de uso más cercana a un producto real.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sky-500 shadow-sm">
                  <ServerIcon />
                </div>
                <p className="text-sm font-semibold text-slate-900">Clientes visibles</p>
                <p className="mt-1 text-sm text-slate-600">Resumen claro de cada servidor y su estado.</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-500 shadow-sm">
                  <BoltIcon />
                </div>
                <p className="text-sm font-semibold text-slate-900">Tools accesibles</p>
                <p className="mt-1 text-sm text-slate-600">Inputs, ejecución y resultados mejor presentados.</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-500 shadow-sm">
                  <ChatIcon />
                </div>
                <p className="text-sm font-semibold text-slate-900">Salto al chat</p>
                <p className="mt-1 text-sm text-slate-600">Acceso directo a una experiencia conversacional más real.</p>
              </div>
            </div>
          </div>

          <section className="rounded-[28px] border border-white/70 bg-white/82 p-6 shadow-[0_35px_80px_-45px_rgba(30,41,59,0.45)] backdrop-blur-xl">
            <SectionBadge icon={<BoltIcon />} label="Nuevo Cliente" />
            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Nombre visible</span>
                <input
                  type="text"
                  placeholder="Ej. Servidor local"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">URL del servidor MCP</span>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </label>
              <button
                onClick={addClient}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_-18px_rgba(2,132,199,0.9)] transition hover:from-sky-500 hover:to-cyan-400"
              >
                <SparklesIcon />
                Añadir cliente
              </button>
              <p className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
                Sugerencia: el servidor local está listo en{" "}
                <code className="rounded-lg bg-white px-2 py-1 text-sky-700">{getDefaultUrl()}</code>
              </p>
            </div>
          </section>
        </section>

        <section className="rounded-[28px] border border-white/70 bg-white/82 p-6 shadow-[0_35px_80px_-45px_rgba(30,41,59,0.45)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <SectionBadge icon={<ServerIcon />} label="Clientes" />
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                Clientes conectables ({clients.length})
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Cada cliente muestra su endpoint, conexión, tools disponibles y resultados de ejecución.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
              Feedback visual mejorado para estados de carga, error y respuesta.
            </div>
          </div>

          {clients.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-slate-50/70 px-6 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-sky-500 shadow-sm">
                <ServerIcon />
              </div>
              <p className="mt-5 text-lg font-semibold text-slate-900">Todavía no hay clientes añadidos</p>
              <p className="mt-2 text-sm text-slate-600">
                Crea uno desde el panel superior para empezar a probar tools y flujos MCP.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6">
              {clients.map((client) => (
                <article
                  key={client.id}
                  className="overflow-hidden rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(248,250,252,0.96))] shadow-[0_22px_50px_-34px_rgba(30,41,59,0.5)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 px-6 py-5">
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                        <ServerIcon />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-slate-950">{client.name}</h3>
                          {client.error ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                              <AlertIcon />
                              Error de conexión
                            </span>
                          ) : client.tools.length > 0 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              <CheckCircleIcon />
                              {client.tools.length} tools disponibles
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              <BoltIcon />
                              Pendiente de conectar
                            </span>
                          )}
                        </div>
                        <code className="mt-2 block break-all text-sm text-slate-500">{client.url}</code>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => connectClient(client)}
                        disabled={client.loading}
                        className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {client.loading ? "Conectando..." : "Conectar ahora"}
                      </button>
                      <button
                        onClick={() => removeClient(client.id)}
                        className="rounded-2xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {client.error && (
                    <div className="px-6 pt-5">
                      <p className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        <span className="mt-0.5">
                          <AlertIcon />
                        </span>
                        <span>{client.error}</span>
                      </p>
                    </div>
                  )}

                  {client.tools.length > 0 && (
                    <div className="px-6 py-6">
                      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <ToolIcon />
                        Tools disponibles
                      </div>
                      <div className="grid gap-4">
                        {client.tools.map((tool) => (
                          <div
                            key={tool.name}
                            className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.7)]"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-amber-700 uppercase">
                                  <ToolIcon />
                                  Tool
                                </div>
                                <h4 className="mt-3 font-mono text-base font-semibold text-slate-950">
                                  {tool.name}
                                </h4>
                                {tool.description && (
                                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                    {tool.description}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() =>
                                  callTool(client.url, tool.name, getToolArgs(tool))
                                }
                                className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-amber-400 hover:to-orange-400"
                              >
                                Ejecutar tool
                              </button>
                            </div>

                            {tool.inputSchema?.properties &&
                              Object.keys(tool.inputSchema.properties).length > 0 && (
                                <div className="mt-5 grid gap-3 md:grid-cols-2">
                                  {Object.entries(tool.inputSchema.properties).map(([key, schema]) => {
                                    const s = schema as {
                                      type?: string | string[];
                                      description?: string;
                                    };
                                    const schemaType = Array.isArray(s.type) ? s.type[0] : s.type;
                                    const isNumeric =
                                      schemaType === "number" || schemaType === "integer";
                                    const inputKey = `${tool.name}:${key}`;
                                    return (
                                      <label key={key} className="block">
                                        <span className="mb-2 block text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                          {key}
                                        </span>
                                        <input
                                          type={isNumeric ? "number" : "text"}
                                          value={toolInputs[inputKey] ?? ""}
                                          onChange={(e) =>
                                            setToolInputs((prev) => ({
                                              ...prev,
                                              [inputKey]: e.target.value,
                                            }))
                                          }
                                          placeholder={s.description ?? `Introduce ${key}`}
                                          className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                                        />
                                      </label>
                                    );
                                  })}
                                </div>
                              )}

                            {toolResults[`${client.url}:${tool.name}`] && (
                              <div className="mt-5 rounded-[22px] border border-sky-100 bg-sky-50/60 p-4">
                                <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-sky-700 uppercase">
                                  <SparklesIcon />
                                  Resultado
                                </div>
                                <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                                  {toolResults[`${client.url}:${tool.name}`]}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
