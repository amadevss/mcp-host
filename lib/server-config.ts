import { NextResponse } from "next/server.js";
import { timingSafeEqual } from "node:crypto";

export class HttpError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export function canonicalUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new HttpError(
      "Introduce una URL completa: https://servidor/ruta-mcp.",
    );
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.hash
  ) {
    throw new HttpError(
      "La URL debe usar HTTP(S), sin usuario, contraseña ni fragmento.",
    );
  }
  return url.href;
}

// Administrator configuration: never derive outbound destinations from the Host header.
export function localMcpUrl() {
  return canonicalUrl(
    process.env.MCP_LOCAL_URL || "http://localhost:3000/api/mcp",
  );
}
export function allowedMcpUrls() {
  return [
    ...new Set([
      localMcpUrl(),
      ...(process.env.MCP_ALLOWED_URLS || "")
        .split(",")
        .filter((v) => v.trim())
        .map(canonicalUrl),
    ]),
  ];
}
export function approvedUrl(value: string) {
  const url = canonicalUrl(value);
  if (!allowedMcpUrls().includes(url))
    throw new HttpError(
      "Servidor no permitido. Añade su URL exacta a MCP_ALLOWED_URLS y reinicia la app.",
      403,
    );
  return url;
}
export function serverHeaders(url: string): Record<string, string> {
  let config: unknown;
  try {
    config = JSON.parse(process.env.MCP_SERVER_HEADERS || "{}");
  } catch {
    throw new HttpError("MCP_SERVER_HEADERS debe ser JSON válido.", 500);
  }
  if (!config || typeof config !== "object" || Array.isArray(config))
    throw new HttpError("MCP_SERVER_HEADERS debe ser un objeto por URL.", 500);
  const headers = (config as Record<string, unknown>)[url] ?? {};
  if (
    !headers ||
    typeof headers !== "object" ||
    Array.isArray(headers) ||
    Object.values(headers).some((v) => typeof v !== "string")
  ) {
    throw new HttpError(
      "Los headers del MCP deben ser un objeto de valores de texto.",
      500,
    );
  }
  return {
    ...(headers as Record<string, string>),
    ...(url === localMcpUrl() && process.env.MCP_BEARER_TOKEN
      ? { Authorization: `Bearer ${process.env.MCP_BEARER_TOKEN}` }
      : {}),
  };
}
export function secretMatches(actual: string | null, expected: string) {
  const a = Buffer.from(actual || "");
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Per-process protection; multi-instance deployments need a shared rate limiter.
const requests = new Map<string, { count: number; reset: number }>();
export function guardHost(request: Request) {
  if (process.env.NODE_ENV === "production" && !process.env.HOST_ACCESS_TOKEN)
    throw new HttpError(
      "Configura HOST_ACCESS_TOKEN antes de usar el host en producción.",
      503,
    );
  if (
    process.env.HOST_ACCESS_TOKEN &&
    !secretMatches(
      request.headers.get("x-host-token"),
      process.env.HOST_ACCESS_TOKEN,
    )
  )
    throw new HttpError(
      "Introduce la clave de acceso del host en «Acceso».",
      401,
    );
  const origin = request.headers.get("origin");
  // Next.js may use its bind hostname in request.url (e.g. localhost), while
  // the browser reaches 127.0.0.1 or the deployment domain. Host is used only
  // for this inbound check; outbound MCP URLs always come from configuration.
  const incoming = new URL(request.url);
  incoming.host = request.headers.get("host") || incoming.host;
  if (origin && origin !== incoming.origin)
    throw new HttpError("Origen no permitido.", 403);
  const key = new URL(request.url).pathname;
  const now = Date.now();
  const entry = requests.get(key);
  if (!entry || entry.reset <= now)
    requests.set(key, { count: 1, reset: now + 60_000 });
  else if (++entry.count > (key === "/api/chat" ? 20 : 60))
    throw new HttpError("Demasiadas solicitudes. Espera un minuto.", 429);
}
export async function readJson(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError("El cuerpo JSON es requerido.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 128_000) {
        await reader.cancel();
        throw new HttpError(
          "La solicitud supera 128 KB. Inicia una conversación nueva.",
          413,
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new HttpError("El cuerpo debe ser JSON válido.");
  }
}
export function errorResponse(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  console.error("MCP Host:", error instanceof Error ? error.name : "Error");
  return NextResponse.json(
    {
      error:
        "No se pudo completar la operación. Revisa la URL, las credenciales y la disponibilidad del MCP.",
    },
    { status: 502 },
  );
}
/** Reject redirects so approved destinations cannot forward credentials elsewhere. */
export function mcpFetch(signal: AbortSignal): typeof fetch {
  return async (input, init) => {
    approvedUrl(input instanceof Request ? input.url : String(input));
    return fetch(input, {
      ...init,
      redirect: "error",
      signal: AbortSignal.any([signal, ...(init?.signal ? [init.signal] : [])]),
    });
  };
}
