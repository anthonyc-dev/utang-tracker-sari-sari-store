import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  deleteHandler,
  getOneHandler,
  isAllowedResource,
  jsonError,
  updateHandler,
  verifyUserAccess,
} from "../../_rest/utils";
import { headers } from "next/headers";
import { auth } from "@lib/auth";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ resource: string; id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { resource, id } = await ctx.params;
  if (!isAllowedResource(resource)) return jsonError("Unknown resource", 404);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return getOneHandler(resource, id, session?.user?.id);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { resource, id } = await ctx.params;
  if (!isAllowedResource(resource)) return jsonError("Unknown resource", 404);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Verify user has access before update
  const hasAccess = await verifyUserAccess(resource, id, session?.user?.id);
  if (!hasAccess) {
    return jsonError("Forbidden", 403);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = undefined;
  }
  return updateHandler(resource, id, body);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  // `simple-rest` sometimes uses PUT for updates depending on usage
  return PATCH(req, ctx);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { resource, id } = await ctx.params;
  if (!isAllowedResource(resource)) return jsonError("Unknown resource", 404);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Verify user has access before delete
  const hasAccess = await verifyUserAccess(resource, id, session?.user?.id);
  if (!hasAccess) {
    return jsonError("Forbidden", 403);
  }

  return deleteHandler(resource, id);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
