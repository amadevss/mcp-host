"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { HostShell } from "./components/host-shell";
import {
  api,
  saveServers,
  useServers,
  type SavedServer,
  type HostConfig,
} from "@/lib/browser-store";

type McpTool = {
  name: string;
  description?: string;
  inputSchema?: {
    properties?: Record<
      string,
      {
        type?: string;
        description?: string;
        default?: unknown;
        enum?: unknown[];
      }
    >;
    required?: string[];
  };
};
type Connection = {
  loading?: boolean;
  connected?: boolean;
  tools?: McpTool[];
  error?: string;
};
type ToolResult = {
  content: unknown[];
  structuredContent?: unknown;
  isError: boolean;
};

function ToolCard({ server, tool }: { server: SavedServer; tool: McpTool }) {
  // Component state belongs to this server + tool, including tools with identical names.
  const properties = tool.inputSchema?.properties || {};
  const initial = Object.fromEntries(
    Object.entries(properties)
      .filter(([, s]) => s.default !== undefined)
      .map(([k, s]) => [k, s.default]),
  );
  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [json, setJson] = useState(JSON.stringify(initial, null, 2));
  const [advanced, setAdvanced] = useState(false);
  const [result, setResult] = useState<ToolResult>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const needsJson = Object.values(properties).some(
    (s) => !["string", "number", "integer", "boolean"].includes(s.type || ""),
  );
  const execute = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(undefined);
    try {
      const args: unknown = advanced || needsJson ? JSON.parse(json) : values;
      if (!args || typeof args !== "object" || Array.isArray(args))
        throw new Error("Los argumentos deben ser un objeto JSON.");
      setResult(
        await api<ToolResult>("/api/clients/call-tool", {
          url: server.url,
          toolName: tool.name,
          args,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form
      className="rounded-xl border border-slate-200 bg-white p-5"
      onSubmit={execute}
    >
      <h3 className="font-mono font-semibold">{tool.name}</h3>
      <p className="hint mt-2">
        {tool.description || "Sin descripción publicada por el servidor."}
      </p>
      {!needsJson && (
        <label className="my-4 flex items-center gap-2 text-sm">
          <input
            className="!w-auto"
            type="checkbox"
            checked={advanced}
            onChange={(e) => {
              setAdvanced(e.target.checked);
              setJson(JSON.stringify(values, null, 2));
            }}
          />
          Editar argumentos como JSON
        </label>
      )}
      {advanced || needsJson ? (
        <label className="mt-4 block">
          Argumentos JSON
          <textarea
            className="font-mono"
            rows={5}
            value={json}
            onChange={(e) => setJson(e.target.value)}
            spellCheck={false}
          />
          <span className="hint">
            Admite objetos, listas y esquemas complejos. Revisa el esquema
            debajo.
          </span>
        </label>
      ) : (
        <div className="my-4 grid gap-4 sm:grid-cols-2">
          {Object.entries(properties).map(([name, schema]) => {
            const required = tool.inputSchema?.required?.includes(name);
            return (
              <label key={name}>
                {name}
                {required ? " *" : " (opcional)"}
                {schema.type === "boolean" ? (
                  <select
                    value={
                      values[name] === undefined ? "" : String(values[name])
                    }
                    required={required}
                    onChange={(e) =>
                      setValues((v) => {
                        const next = { ...v };
                        if (e.target.value === "") delete next[name];
                        else next[name] = e.target.value === "true";
                        return next;
                      })
                    }
                  >
                    <option value="">Sin definir</option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : (
                  <input
                    type={
                      ["number", "integer"].includes(schema.type || "")
                        ? "number"
                        : "text"
                    }
                    step={schema.type === "integer" ? "1" : "any"}
                    required={required}
                    value={String(values[name] ?? "")}
                    placeholder={schema.description}
                    onChange={(e) =>
                      setValues((v) => {
                        const next = { ...v };
                        if (e.target.value === "") delete next[name];
                        else
                          next[name] = ["number", "integer"].includes(
                            schema.type || "",
                          )
                            ? Number(e.target.value)
                            : e.target.value;
                        return next;
                      })
                    }
                  />
                )}
                <span className="hint">{schema.description}</span>
              </label>
            );
          })}
        </div>
      )}
      <details className="my-4 text-sm">
        <summary className="cursor-pointer">Ver esquema de argumentos</summary>
        <pre className="result">
          {JSON.stringify(tool.inputSchema || {}, null, 2)}
        </pre>
      </details>
      <button className="button" disabled={busy}>
        {busy ? "Ejecutando…" : "Ejecutar herramienta"}
      </button>
      {error && (
        <p className="error mt-3" role="alert">
          {error}
        </p>
      )}
      {result && (
        <div className="mt-4" role="status">
          <p
            className={
              result.isError
                ? "error"
                : "text-sm font-semibold text-emerald-800"
            }
          >
            {result.isError ? "La herramienta informó un error" : "Resultado"}
          </p>
          <pre className="result">
            {JSON.stringify(
              result.structuredContent ?? result.content,
              null,
              2,
            )}
          </pre>
        </div>
      )}
    </form>
  );
}

export default function Home() {
  const servers = useServers();
  const [config, setConfig] = useState<HostConfig>();
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [connections, setConnections] = useState<Record<string, Connection>>(
    {},
  );
  useEffect(() => {
    api<HostConfig>("/api/config")
      .then(setConfig)
      .catch((e) => setError(e.message));
  }, []);
  const save = (next: SavedServer[]) => {
    try {
      saveServers(next);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = new URL(url.trim());
      if (
        !["http:", "https:"].includes(endpoint.protocol) ||
        endpoint.username ||
        endpoint.password ||
        endpoint.hash
      )
        throw new Error(
          "Usa HTTP(S), sin credenciales ni fragmentos en la URL.",
        );
      if (servers.some((s) => s.url === endpoint.href))
        throw new Error("Este servidor ya está en tu lista.");
      saveServers([
        ...servers,
        {
          id: crypto.randomUUID(),
          name: name.trim(),
          url: endpoint.href,
          selected: true,
        },
      ]);
      setName("");
      setUrl("");
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revisa la URL.");
    }
  };
  const addLocal = () => {
    if (!config || servers.some((s) => s.url === config.localUrl)) return;
    save([
      ...servers,
      {
        id: crypto.randomUUID(),
        name: "Servidor de esta app",
        url: config.localUrl,
        selected: true,
      },
    ]);
  };
  const connect = async (server: SavedServer) => {
    setConnections((v) => ({ ...v, [server.id]: { loading: true } }));
    try {
      const result = await api<{ tools: McpTool[] }>("/api/clients/connect", {
        url: server.url,
      });
      setConnections((v) => ({
        ...v,
        [server.id]: { connected: true, tools: result.tools },
      }));
    } catch (e) {
      setConnections((v) => ({
        ...v,
        [server.id]: { error: (e as Error).message },
      }));
    }
  };
  return (
    <HostShell>
      <section className="panel">
        <p className="eyebrow">Tu punto de partida con MCP</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Tus herramientas y servidores, en una app.
        </h1>
        <p className="mt-4 max-w-3xl text-slate-600">
          Usa esta plantilla para crear tu propio servidor MCP o reunir varios
          servidores y consultar sus herramientas desde el chat.
        </p>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          <li className="step">
            <b>1. Prueba el ejemplo</b>
            <p>
              Añade el servidor de esta app, conecta y ejecuta echo o roll_dice.
              No necesitas una clave de IA.
            </p>
          </li>
          <li className="step">
            <b>2. Conecta tus MCP</b>
            <p>
              Añade sus URLs completas. Quien administra la app debe permitirlas
              en la configuración.
            </p>
          </li>
          <li className="step">
            <b>3. Consulta desde el chat</b>
            <p>
              Selecciona los servidores que puede usar Gemini. Necesitas
              configurar su clave en el servidor.
            </p>
          </li>
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="button"
            onClick={addLocal}
            disabled={!config || servers.some((s) => s.url === config.localUrl)}
          >
            Añadir MCP de ejemplo
          </button>
          <Link className="button secondary" href="/guide">
            Cómo crear mi propio MCP
          </Link>
          <Link className="button secondary" href="/chat">
            Ir al chat →
          </Link>
        </div>
      </section>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <section className="panel">
        <h2 className="text-xl font-semibold">Añadir un servidor</h2>
        <p className="hint mt-2">
          Conexión mediante HTTP Streamable. La URL se usa tal como la
          introduces; incluye la ruta del MCP.
        </p>
        <form onSubmit={add} className="mt-4 flex flex-wrap items-end gap-4">
          <label className="min-w-48 flex-1">
            Nombre
            <input
              required
              maxLength={80}
              value={name}
              placeholder="Ej. Mi base de datos"
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="min-w-56 flex-[2]">
            URL completa
            <input
              type="url"
              required
              maxLength={2048}
              value={url}
              placeholder="https://mi-servidor.com/api/mcp"
              onChange={(e) => setUrl(e.target.value)}
            />
          </label>
          <button className="button" type="submit">
            Añadir servidor
          </button>
        </form>
        {config && (
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer">
              URLs permitidas en esta instalación
            </summary>
            <ul className="mt-3 space-y-2">
              {config.allowedUrls.map((u) => (
                <li className="break-all font-mono text-xs" key={u}>
                  {u}
                </li>
              ))}
            </ul>
            <p className="hint mt-3">
              Para permitir otra URL, configura MCP_ALLOWED_URLS en el servidor.
              Las claves privadas van en MCP_SERVER_HEADERS.{" "}
              <Link className="underline" href="/guide#connect">
                Ver instrucciones
              </Link>
              .
            </p>
          </details>
        )}
      </section>
      <section className="grid gap-4" aria-label="Servidores guardados">
        <div>
          <h2 className="text-xl font-semibold">
            Tus servidores ({servers.length})
          </h2>
          <p className="hint mt-2">
            Esta lista se guarda en este navegador. Las conexiones se abren al
            consultar; «Conectar» comprueba las herramientas disponibles.
          </p>
        </div>
        {servers.length === 0 && (
          <div className="panel border-dashed text-center">
            <p>Aún no tienes servidores.</p>
            <p className="hint mt-2">
              Empieza con «Añadir MCP de ejemplo» o introduce una URL arriba.
            </p>
          </div>
        )}
        {servers.map((server) => {
          const c = connections[server.id] || {};
          return (
            <article key={server.id} className="panel">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{server.name}</h3>
                  <p className="mt-1 break-all font-mono text-xs text-slate-500">
                    {server.url}
                  </p>
                  <p className="hint mt-2" role="status">
                    {c.loading
                      ? "Conectando…"
                      : c.connected
                        ? `Disponible · ${c.tools?.length || 0} herramientas`
                        : c.error
                          ? "Error de conexión"
                          : "Sin comprobar"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      className="!w-auto"
                      type="checkbox"
                      checked={server.selected}
                      onChange={(e) =>
                        save(
                          servers.map((s) =>
                            s.id === server.id
                              ? { ...s, selected: e.target.checked }
                              : s,
                          ),
                        )
                      }
                    />
                    Usar en chat
                  </label>
                  <button
                    className="button"
                    onClick={() => connect(server)}
                    disabled={c.loading}
                  >
                    {c.loading ? "Conectando…" : "Conectar"}
                  </button>
                  <button
                    className="button secondary"
                    onClick={() =>
                      save(servers.filter((s) => s.id !== server.id))
                    }
                  >
                    Quitar
                  </button>
                </div>
              </div>
              {c.error && (
                <p className="error mt-4" role="alert">
                  {c.error}
                </p>
              )}
              {c.connected && c.tools?.length === 0 && (
                <p className="hint mt-4">
                  La conexión funciona, pero este servidor no publica
                  herramientas.
                </p>
              )}
              <div className="mt-5 grid gap-4">
                {c.tools?.map((t) => (
                  <ToolCard key={t.name} server={server} tool={t} />
                ))}
              </div>
            </article>
          );
        })}
      </section>
    </HostShell>
  );
}
