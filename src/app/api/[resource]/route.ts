import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  createHandler,
  isAllowedResource,
  jsonError,
  listHandler,
} from "../_rest/utils";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ resource: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { resource } = await ctx.params;
  if (!isAllowedResource(resource)) return jsonError("Unknown resource", 404);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return listHandler(req, resource, session?.user?.id);
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

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return createHandler(resource, body, session?.user?.id);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
