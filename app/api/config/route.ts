import { NextResponse } from "next/server.js";
import {
  allowedMcpUrls,
  errorResponse,
  localMcpUrl,
} from "@/lib/server-config";
export const runtime = "nodejs";
export async function GET() {
  try {
    return NextResponse.json(
      {
        localUrl: localMcpUrl(),
        allowedUrls: allowedMcpUrls(),
        chatConfigured: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        accessRequired:
          !!process.env.HOST_ACCESS_TOKEN ||
          process.env.NODE_ENV === "production",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
