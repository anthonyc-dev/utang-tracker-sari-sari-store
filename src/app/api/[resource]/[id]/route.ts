import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  deleteHandler,
  getOneHandler,
  isAllowedResource,
  jsonError,
  updateHandler,
} from "../../_rest/utils";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ resource: string; id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { resource, id } = await ctx.params;
  if (!isAllowedResource(resource)) return jsonError("Unknown resource", 404);
  return getOneHandler(resource, id);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { resource, id } = await ctx.params;
  if (!isAllowedResource(resource)) return jsonError("Unknown resource", 404);

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
  return deleteHandler(resource, id);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
