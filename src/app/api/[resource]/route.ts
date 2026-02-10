import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  createHandler,
  isAllowedResource,
  jsonError,
  listHandler,
} from "../_rest/utils";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ resource: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { resource } = await ctx.params;
  if (!isAllowedResource(resource)) return jsonError("Unknown resource", 404);
  return listHandler(req, resource);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { resource } = await ctx.params;
  if (!isAllowedResource(resource)) return jsonError("Unknown resource", 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = undefined;
  }

  return createHandler(resource, body);
}

// Optional: make preflight happy if you ever call from a different origin
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

