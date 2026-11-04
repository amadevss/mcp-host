"use client";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart, getToolName } from "ai";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { mermaid } from "@streamdown/mermaid";
import { math } from "@streamdown/math";
import { cjk } from "@streamdown/cjk";
import "katex/dist/katex.min.css";
import "streamdown/styles.css";
import Link from "next/link";
import { HostShell } from "../components/host-shell";
import {
  api,
  hostFetch,
  useServers,
  saveServers,
  type HostConfig,
  type SavedServer,
} from "@/lib/browser-store";

const transport = new DefaultChatTransport({
  api: "/api/chat",
  fetch: hostFetch,
});

function Conversation({
  selected,
  configured,
}: {
  selected: SavedServer[];
  configured: boolean;
}) {
  const [input, setInput] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status, error, stop } = useChat({ transport });
  const busy = status === "streaming" || status === "submitted";
  useEffect(
    () => () => {
      void stop();
    },
    [stop],
  );
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || busy) return;
    void sendMessage(
      { text: input.trim() },
      { body: { servers: selected.map(({ name, url }) => ({ name, url })) } },
    );
    setInput("");
  };
  return (
    <section className="panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Conversación</h2>
        <p className="hint" role="status">
          {busy
            ? "Gemini está respondiendo…"
            : `${selected.length} servidores seleccionados`}
        </p>
      </div>
      {messages.length === 0 && (
        <div className="my-8 rounded-xl bg-sky-50 p-6">
          <h3 className="font-semibold">Empieza con una pregunta</h3>
          <p className="hint mt-2">
            Con el MCP de ejemplo seleccionado, prueba «Tira un dado de 6 caras»
            o «Repite hola mundo». Para otros servidores, pregunta por los datos
            que sus herramientas pueden consultar.
          </p>
          <p className="hint mt-2">
            Gemini decide cuándo usar una herramienta. Si no hay servidores
            seleccionados, responderá sin herramientas.
          </p>
        </div>
      )}
      <div
        className="my-6 max-h-[60vh] space-y-5 overflow-y-auto"
        aria-live="polite"
      >
        {messages.map((message) => (
          <article
            key={message.id}
            className={
              message.role === "user"
                ? "ml-auto max-w-[90%] rounded-xl bg-sky-50 p-4"
                : "rounded-xl border border-slate-200 p-4"
            }
          >
            <p className="eyebrow mb-2">
              {message.role === "user" ? "Tú" : "Gemini"}
            </p>
            {message.parts.map((part, i) => {
              if (part.type === "text")
                return (
                  <Streamdown
                    key={i}
                    plugins={{ code, mermaid, math, cjk }}
                    isAnimating={busy && message.role === "assistant"}
                  >
                    {part.text}
                  </Streamdown>
                );
              if (isToolUIPart(part))
                return (
                  <details
                    key={i}
                    className="my-3 rounded-lg bg-slate-50 p-3"
                    open={part.state === "output-error"}
                  >
                    <summary className="cursor-pointer break-all text-sm font-semibold">
                      {getToolName(part)
                        .replace(/^mcp_[0-9a-f]{12}_/, "")
                        .replace(/_[0-9a-f]{8}$/, "")}{" "}
                      ·{" "}
                      {part.state === "output-error"
                        ? "Error"
                        : part.state === "output-available"
                          ? "Completada"
                          : "Ejecutando"}
                    </summary>
                    <p className="hint mt-2">
                      El identificador distingue el servidor y la herramienta.
                      Su resultado se incorpora a la respuesta.
                    </p>
                    <pre className="result">
                      {JSON.stringify(
                        part.state === "output-error"
                          ? part.errorText
                          : part.state === "output-available"
                            ? part.output
                            : part.input,
                        null,
                        2,
                      )}
                    </pre>
                  </details>
                );
              return null;
            })}
          </article>
        ))}
        <div ref={bottom} />
      </div>
      {error && (
        <p className="error mb-4" role="alert">
          {error.message}
        </p>
      )}
      <form onSubmit={submit} className="grid gap-3">
        <label>
          Tu mensaje
          <textarea
            required
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!configured}
            placeholder="¿Qué quieres consultar?"
          />
        </label>
        <div className="flex gap-3">
          <button
            className="button"
            disabled={
              busy || !configured || !input.trim() || selected.length > 6
            }
          >
            Enviar mensaje
          </button>
          {busy && (
            <button
              className="button secondary"
              type="button"
              onClick={() => void stop()}
            >
              Detener
            </button>
          )}
        </div>
      </form>
      <p className="hint mt-4">
        El chat puede ejecutar las herramientas seleccionadas automáticamente.
        Usa servidores de confianza y credenciales de solo lectura cuando
        corresponda. No pegues secretos. Los mensajes y datos necesarios se
        envían a Google Gemini.
      </p>
    </section>
  );
}

export default function ChatPage() {
  const servers = useServers();
  const selected = servers.filter((s) => s.selected);
  const [config, setConfig] = useState<HostConfig>();
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  useEffect(() => {
    api<HostConfig>("/api/config")
      .then(setConfig)
      .catch((e) => setError(e.message));
  }, []);
  const conversationKey =
    selected.map((s) => `${s.id}:${s.url}:${s.name}`).join("|") + ":" + version;
  return (
    <HostShell>
      <section className="panel">
        <p className="eyebrow">Consulta tus MCP en lenguaje natural</p>
        <h1 className="mt-3 text-3xl font-bold">Chat con Gemini</h1>
        <p className="hint mt-3">
          Selecciona hasta 6 servidores. Al cambiar la selección o iniciar una
          conversación nueva se limpia el historial de esta pantalla.
        </p>
        <div className="my-4 flex flex-wrap gap-4">
          {servers.map((server) => (
            <label key={server.id} className="flex items-center gap-2 text-sm">
              <input
                className="!w-auto"
                type="checkbox"
                checked={server.selected}
                onChange={(e) => {
                  try {
                    saveServers(
                      servers.map((s) =>
                        s.id === server.id
                          ? { ...s, selected: e.target.checked }
                          : s,
                      ),
                    );
                  } catch (err) {
                    setError((err as Error).message);
                  }
                }}
              />
              {server.name}
            </label>
          ))}
        </div>
        {!servers.length && (
          <p className="hint mb-4">
            Aún no tienes MCP añadidos.{" "}
            <Link className="underline" href="/">
              Añade el servidor de ejemplo en el panel
            </Link>{" "}
            o conversa sin herramientas.
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            className="button secondary"
            onClick={() => setVersion((v) => v + 1)}
          >
            Nueva conversación
          </button>
          <Link className="button secondary" href="/">
            Comprobar conexiones
          </Link>
        </div>
        {selected.length > 6 && (
          <p className="error mt-4">Selecciona como máximo 6 servidores.</p>
        )}
        {config && !config.chatConfigured && (
          <p className="error mt-4">
            Falta configurar GOOGLE_GENERATIVE_AI_API_KEY en el servidor y
            reiniciar la app. El panel funciona sin esa clave.{" "}
            <Link className="underline" href="/guide#chat">
              Ver instrucciones
            </Link>
            .
          </p>
        )}
        {error && (
          <p className="error mt-4" role="alert">
            {error}
          </p>
        )}
      </section>
      <Conversation
        key={conversationKey}
        selected={selected}
        configured={!!config?.chatConfigured}
      />
    </HostShell>
  );
}
