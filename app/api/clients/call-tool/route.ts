import { NextResponse } from "next/server.js";
import { z } from "zod";
import { callMcpTool } from "@/lib/mcp-client";
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
      .object({
        url: z.string().min(1).max(2048),
        toolName: z.string().min(1).max(256),
        args: z.record(z.string(), z.unknown()).default({}),
      })
      .safeParse(await readJson(request));
    if (!parsed.success)
      throw new HttpError("Envía url, toolName y args como objeto JSON.");
    const { url, toolName, args } = parsed.data;
    return NextResponse.json(
      await callMcpTool(url, toolName, args, request.signal),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
