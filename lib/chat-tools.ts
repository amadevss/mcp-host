import { createHash } from "node:crypto";
// Stable per URL and original tool name; selecting another server cannot retarget old calls.
export function toolAlias(url: string, name: string) {
  return `mcp_${createHash("sha256").update(url).digest("hex").slice(0, 12)}_${name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 24)}_${createHash("sha256").update(name).digest("hex").slice(0, 8)}`;
}
