"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { mermaid } from "@streamdown/mermaid";
import { math } from "@streamdown/math";
import { cjk } from "@streamdown/cjk";
import "katex/dist/katex.min.css";
import "streamdown/styles.css";
import Link from "next/link";

export default function ChatPage() {
  const { messages, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Chat con Gemini + MCP</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Usa los tools echo y roll_dice del servidor MCP
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-amber-400 hover:text-amber-300"
        >
          ← Volver al Host
        </Link>
      </header>

      <main className="flex-1 overflow-auto px-6 py-6 max-w-3xl mx-auto w-full">
        <div className="space-y-6">
          {messages.length === 0 && (
            <p className="text-center text-zinc-500 py-12">
              Escribe un mensaje para empezar. Prueba &quot;tira un dado de 6
              caras&quot; o &quot;di echo de hola&quot;.
            </p>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-xl p-4 ${
                message.role === "user"
                  ? "bg-zinc-800/50 ml-8"
                  : "bg-zinc-900/50 mr-8"
              }`}
            >
              <div className="mb-2 text-xs font-medium text-zinc-500">
                {message.role === "user" ? "Tú" : "Gemini"}
              </div>
              <div className="space-y-2">
                {message.parts.map((part, index) => {
                  if (part.type === "text") {
                    return (
                      <Streamdown
                        key={index}
                        plugins={{ code, mermaid, math, cjk }}
                        isAnimating={status === "streaming"}
                        animated
                        className="prose prose-invert prose-sm max-w-none [&_pre]:bg-zinc-800 [&_pre]:rounded-lg [&_pre]:p-4"
                      >
                        {part.text}
                      </Streamdown>
                    );
                  }
                  if (part.type === "tool-call") {
                    return (
                      <div
                        key={index}
                        className="rounded-lg bg-amber-950/30 border border-amber-800/50 px-3 py-2 text-sm text-amber-200"
                      >
                        🔧 Tool: {(part as { toolName?: string }).toolName}
                      </div>
                    );
                  }
                  if (part.type?.toString().startsWith("tool-")) {
                    const toolPart = part as { state?: string; output?: unknown };
                    return (
                      <div
                        key={index}
                        className="rounded-lg bg-zinc-800/80 px-3 py-2 text-sm text-zinc-300"
                      >
                        {toolPart.state === "output-available" &&
                        toolPart.output ? (
                          <pre className="whitespace-pre-wrap text-xs">
                            {JSON.stringify(toolPart.output, null, 2)}
                          </pre>
                        ) : (
                          <span className="text-zinc-500">
                            Ejecutando tool...
                          </span>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-zinc-800 bg-zinc-900/50 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const input = form.querySelector("input") as HTMLInputElement;
            const text = input?.value?.trim();
            if (text) {
              sendMessage({ text });
              input.value = "";
            }
          }}
          className="flex gap-2 max-w-3xl mx-auto"
        >
          <input
            type="text"
            placeholder="Escribe tu mensaje..."
            disabled={status !== "ready"}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status !== "ready"}
            className="rounded-lg bg-amber-600 px-6 py-3 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            {status === "streaming" || status === "submitted"
              ? "..."
              : "Enviar"}
          </button>
        </form>
      </footer>
    </div>
  );
}
