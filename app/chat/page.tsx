"use client";

import { useEffect, useRef, useState } from "react";
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

function BotIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M12 3v3" />
      <rect x="4" y="8" width="16" height="11" rx="4" />
      <path d="M9 13h.01M15 13h.01M8 17h8" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
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

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M22 2 11 13" />
      <path d="m22 2-7 20-4-9-9-4Z" />
    </svg>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-[32px] border border-white/70 bg-white/88 p-8 text-center shadow-[0_30px_80px_-45px_rgba(30,41,59,0.45)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-[0_18px_35px_-18px_rgba(14,165,233,0.95)]">
          <BotIcon />
        </div>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
          Empieza una conversación de verdad
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Pregunta algo en lenguaje natural y Gemini responderá dentro de una interfaz de chat clara, con tools integradas como parte del diálogo.
        </p>
        <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
          <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 text-sm text-slate-700">
            “Tira un dado de 6 caras”
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-slate-700">
            “Haz echo de hola mundo”
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-sm text-slate-700">
            “Resume lo que puedes hacer”
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { messages, status, sendMessage, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isBusy = status === "streaming" || status === "submitted";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [input]);

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || isBusy) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.28),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.12),_transparent_20%),linear-gradient(180deg,_#f8fbff_0%,_#eff6ff_52%,_#f8fafc_100%)] text-slate-900">
      <header className="border-b border-white/70 bg-white/78 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-[0_14px_32px_-16px_rgba(14,165,233,0.95)]">
              <BotIcon />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-950">
                Chat con Gemini + MCP
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Conversación en estilo chat, con respuestas renderizadas y tools dentro del hilo.
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-white"
          >
            ← Volver al host
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white/70 shadow-[0_35px_80px_-45px_rgba(30,41,59,0.45)] backdrop-blur-xl">
          <div className="border-b border-slate-200/80 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-emerald-700 uppercase">
                  {isBusy ? "Respondiendo" : "En linea"}
                </div>
                <div className="text-sm text-slate-500">
                  Gemini puede usar `echo` y `roll_dice` dentro de la conversación.
                </div>
              </div>
              <div className="text-xs font-medium text-slate-400">
                {messages.length} mensajes
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            {messages.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-6">
                {messages.map((message) => {
                  const isUser = message.role === "user";
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`flex max-w-[88%] items-start gap-3 sm:max-w-[78%] ${
                          isUser ? "flex-row-reverse" : ""
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                            isUser
                              ? "bg-slate-900 text-white"
                              : "bg-sky-100 text-sky-700"
                          }`}
                        >
                          {isUser ? <UserIcon /> : <BotIcon />}
                        </div>

                        <div
                          className={`overflow-hidden rounded-[26px] border px-4 py-3 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.7)] sm:px-5 ${
                            isUser
                              ? "border-sky-500/10 bg-gradient-to-br from-sky-600 to-cyan-500 text-white"
                              : "border-slate-200 bg-white text-slate-900"
                          }`}
                        >
                          <div
                            className={`mb-2 text-xs font-semibold tracking-[0.16em] uppercase ${
                              isUser ? "text-sky-100/90" : "text-slate-400"
                            }`}
                          >
                            {isUser ? "Tu mensaje" : "Gemini"}
                          </div>

                          <div className="space-y-3">
                            {message.parts.map((part, index) => {
                              if (part.type === "text") {
                                return (
                                  <Streamdown
                                    key={index}
                                    plugins={{ code, mermaid, math, cjk }}
                                    isAnimating={!isUser && status === "streaming"}
                                    animated
                                    className={
                                      isUser
                                        ? "chat-prose-user max-w-none text-sm leading-7"
                                        : "chat-prose-bot max-w-none text-sm leading-7"
                                    }
                                  >
                                    {part.text}
                                  </Streamdown>
                                );
                              }

                              if (part.type === "tool-call") {
                                return (
                                  <div
                                    key={index}
                                    className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                                  >
                                    <div className="flex items-center gap-2 font-semibold">
                                      <ToolIcon />
                                      Ejecutando tool: {(part as { toolName?: string }).toolName}
                                    </div>
                                  </div>
                                );
                              }

                              if (part.type?.toString().startsWith("tool-")) {
                                const toolPart = part as { state?: string; output?: unknown };
                                return (
                                  <div
                                    key={index}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                                  >
                                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                      <ToolIcon />
                                      Resultado de tool
                                    </div>
                                    {toolPart.state === "output-available" && toolPart.output ? (
                                      <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-700">
                                        {JSON.stringify(toolPart.output, null, 2)}
                                      </pre>
                                    ) : (
                                      <span className="text-slate-500">Ejecutando tool...</span>
                                    )}
                                  </div>
                                );
                              }

                              return null;
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isBusy && (
                  <div className="flex justify-start">
                    <div className="flex max-w-[78%] items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                        <BotIcon />
                      </div>
                      <div className="rounded-[26px] border border-slate-200 bg-white px-5 py-4 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.7)]">
                        <div className="mb-2 text-xs font-semibold tracking-[0.16em] uppercase text-slate-400">
                          Gemini
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-sky-400 [animation-delay:-0.2s]" />
                          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-sky-500 [animation-delay:-0.1s]" />
                          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-sky-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <div className="border-t border-slate-200/80 bg-white/70 p-4 sm:p-5">
            {error && (
              <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error.message}
              </div>
            )}

            <div className="rounded-[28px] border border-slate-200 bg-white p-2 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.7)]">
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  placeholder="Escribe tu mensaje..."
                  disabled={isBusy}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  className="max-h-40 min-h-[52px] flex-1 resize-none bg-transparent px-4 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isBusy || !input.trim()}
                  className="mb-1 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 text-sm font-semibold text-white transition hover:from-sky-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300"
                >
                  <SendIcon />
                  {isBusy ? "Enviando" : "Enviar"}
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-2 pt-1 text-xs text-slate-400">
                <span>Enter para enviar, Shift + Enter para salto de linea.</span>
                <span>{isBusy ? "Gemini esta escribiendo..." : "Listo para conversar"}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
