"use client";
import Link from "next/link";
import { useState } from "react";

export function HostShell({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState("");
  const [notice, setNotice] = useState("");
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-slate-950"
          >
            MCP Host{" "}
            <span className="text-xs font-medium text-sky-700">
              plantilla abierta
            </span>
          </Link>
          <nav
            aria-label="Navegación principal"
            className="flex gap-5 text-sm font-semibold"
          >
            <Link href="/">Servidores</Link>
            <Link href="/chat">Chat</Link>
            <Link href="/guide">Guía</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6">
        <details className="panel !py-3">
          <summary className="cursor-pointer text-sm font-semibold">
            Acceso al host
          </summary>
          <p className="hint my-3">
            Si quien administra esta instalación configuró una clave de acceso,
            introdúcela aquí. Se guarda solo en esta pestaña. No uses la clave
            de Gemini ni la de un MCP.
          </p>
          <form
            className="flex flex-wrap gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                sessionStorage.setItem("mcp-host-access", token.trim());
                setToken("");
                setNotice(
                  "Acceso guardado. Puedes volver a intentar la operación.",
                );
              } catch {
                setNotice("El navegador bloqueó el almacenamiento de sesión.");
              }
            }}
          >
            <label className="flex-1">
              Clave de acceso
              <input
                type="password"
                autoComplete="off"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </label>
            <button className="button self-end" type="submit">
              Guardar acceso
            </button>
            <button
              className="button secondary self-end"
              type="button"
              onClick={() => {
                try {
                  sessionStorage.removeItem("mcp-host-access");
                  setNotice("Acceso eliminado.");
                } catch {
                  setNotice("No se pudo acceder al almacenamiento.");
                }
              }}
            >
              Olvidar
            </button>
          </form>
          <p role="status" className="hint mt-2">
            {notice}
          </p>
        </details>
        {children}
      </main>
      <footer className="mx-auto max-w-6xl px-6 pb-8 text-sm text-slate-500">
        Crea tus herramientas, conecta tus servidores y consulta sus datos.{" "}
        <a className="underline" href="https://github.com/amadevss/mcp-host">
          Código y documentación en GitHub
        </a>
        .
      </footer>
    </div>
  );
}
