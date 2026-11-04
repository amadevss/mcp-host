import { NextResponse } from "next/server.js";
import { z } from "zod";
import { listMcpTools } from "@/lib/mcp-client";
import {
  errorResponse,
  guardHost,
  HttpError,
  readJson,
} from "@/lib/server-config";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    guardHost(request);
    const parsed = z
      .object({ url: z.string().min(1).max(2048) })
      .safeParse(await readJson(request));
    if (!parsed.success) throw new HttpError("Envía la URL completa del MCP.");
    return NextResponse.json(
      await listMcpTools(parsed.data.url, request.signal),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
