import "server-only";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type AllowedResource =
  | "stores"
  | "store_users"
  | "customers"
  | "items"
  | "utang"
  | "utang_items"
  | "payments"
  | "user";

export function isAllowedResource(
  resource: string,
): resource is AllowedResource {
  return (
    resource === "stores" ||
    resource === "store_users" ||
    resource === "customers" ||
    resource === "items" ||
    resource === "utang" ||
    resource === "utang_items" ||
    resource === "payments" ||
    resource === "user"
  );
}

export function getDelegate(resource: AllowedResource) {
  switch (resource) {
    case "stores":
      return prisma.store;
    case "store_users":
      return prisma.storeUser;
    case "customers":
      return prisma.customer;
    case "items":
      return prisma.item;
    case "utang":
      return prisma.utang;
    case "utang_items":
      return prisma.utangItem;
    case "payments":
      return prisma.payment;
    case "user":
      return prisma.user;
  }
}

function parsePagination(searchParams: URLSearchParams) {
  // refinedev/simple-rest uses `_start` and `_end`
  const start = Number(searchParams.get("_start") ?? "0");
  const end = Number(searchParams.get("_end") ?? "0");

  const safeStart = Number.isFinite(start) && start >= 0 ? start : 0;
  const safeEnd = Number.isFinite(end) && end >= 0 ? end : 0;

  if (safeEnd > safeStart) {
    return { skip: safeStart, take: safeEnd - safeStart };
  }

  // Fallback to `page` & `perPage` if present
  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Number(searchParams.get("perPage") ?? "10");
  const safePerPage = Number.isFinite(perPage) && perPage > 0 ? perPage : 10;
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  return { skip: (safePage - 1) * safePerPage, take: safePerPage };
}

function parseSort(searchParams: URLSearchParams) {
  const sortField = searchParams.get("_sort") ?? undefined;
  const sortOrder = (searchParams.get("_order") ?? "ASC").toUpperCase();
  if (!sortField) return undefined;
  const direction = sortOrder === "DESC" ? "desc" : "asc";
  return { [sortField]: direction } as Record<string, "asc" | "desc">;
}

function stringOrUndefined(v: unknown) {
  return typeof v === "string" && v.trim() ? v : undefined;
}

function buildWhere(resource: AllowedResource, searchParams: URLSearchParams) {
  // Simple REST provider may send `q` (full text-ish)
  const q = stringOrUndefined(searchParams.get("q"));

  // Also allow direct equality filters (e.g. `storeId=...`)
  // We keep this intentionally small and explicit per resource.
  switch (resource) {
    case "stores": {
      const where: any = {};
      if (q) where.name = { contains: q, mode: "insensitive" };
      return where;
    }
    case "store_users": {
      const where: any = {};
      const storeId = stringOrUndefined(searchParams.get("storeId"));
      const userId = stringOrUndefined(searchParams.get("userId"));
      const role = stringOrUndefined(searchParams.get("role"));
      if (storeId) where.storeId = storeId;
      if (userId) where.userId = userId;
      if (role) where.role = role;
      return where;
    }
    case "customers": {
      const where: any = {};
      const storeId = stringOrUndefined(searchParams.get("storeId"));
      if (storeId) where.storeId = storeId;
      if (q) {
        where.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ];
      }
      return where;
    }
    case "items": {
      const where: any = {};
      const storeId = stringOrUndefined(searchParams.get("storeId"));
      const category = stringOrUndefined(searchParams.get("category"));
      if (storeId) where.storeId = storeId;
      if (category) where.category = category;
      if (q) {
        where.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
        ];
      }
      return where;
    }
    case "utang": {
      const where: any = {};
      const storeId = stringOrUndefined(searchParams.get("storeId"));
      const customerId = stringOrUndefined(searchParams.get("customerId"));
      const status = stringOrUndefined(searchParams.get("status"));
      if (storeId) where.storeId = storeId;
      if (customerId) where.customerId = customerId;
      if (status) where.status = status;
      if (q) where.description = { contains: q, mode: "insensitive" };
      return where;
    }
    case "utang_items": {
      const where: any = {};
      const utangId = stringOrUndefined(searchParams.get("utangId"));
      const itemId = stringOrUndefined(searchParams.get("itemId"));
      if (utangId) where.utangId = utangId;
      if (itemId) where.itemId = itemId;
      return where;
    }
    case "payments": {
      const where: any = {};
      const utangId = stringOrUndefined(searchParams.get("utangId"));
      const paymentMethod = stringOrUndefined(
        searchParams.get("paymentMethod"),
      );
      if (utangId) where.utangId = utangId;
      if (paymentMethod) where.paymentMethod = paymentMethod;
      if (q) {
        where.OR = [
          { payerName: { contains: q, mode: "insensitive" } },
          { paymentReference: { contains: q, mode: "insensitive" } },
        ];
      }
      return where;
    }
    case "user": {
      const where: any = {};
      if (q) {
        where.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ];
      }
      return where;
    }
  }
}

export function jsonOk(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function jsonCreated(data: unknown) {
  return NextResponse.json(data, { status: 201 });
}

export function jsonError(message: string, status = 400, extra?: unknown) {
  return NextResponse.json(
    { message, ...(extra ? { extra } : {}) },
    { status },
  );
}

export async function listHandler(req: NextRequest, resource: AllowedResource) {
  const url = new URL(req.url);
  const { skip, take } = parsePagination(url.searchParams);
  const orderBy = parseSort(url.searchParams);
  const where = buildWhere(resource, url.searchParams);

  const delegate: any = getDelegate(resource);

  const [total, data] = await Promise.all([
    delegate.count({ where }),
    delegate.findMany({
      where,
      skip,
      take,
      ...(orderBy ? { orderBy } : {}),
    }),
  ]);

  // refinedev/simple-rest expects `x-total-count`
  return jsonOk(data, { headers: { "x-total-count": String(total) } });
}

export async function getOneHandler(resource: AllowedResource, id: string) {
  const delegate: any = getDelegate(resource);
  const data = await delegate.findUnique({ where: { id } });
  if (!data) return jsonError("Not found", 404);
  return jsonOk(data);
}

export async function createHandler(resource: AllowedResource, body: any) {
  const delegate: any = getDelegate(resource);

  // Allow nested create for utang (items/payments) if provided.
  if (resource === "utang") {
    const { items, payments, ...rest } = body ?? {};
    const data = await prisma.utang.create({
      data: {
        ...rest,
        ...(Array.isArray(items) && items.length
          ? {
              items: {
                create: items.map((it: any) => ({
                  itemId: it.itemId,
                  quantity: it.quantity,
                  unitPrice: it.unitPrice,
                })),
              },
            }
          : {}),
        ...(Array.isArray(payments) && payments.length
          ? {
              payments: {
                create: payments.map((p: any) => ({
                  payerName: p.payerName,
                  amount: p.amount,
                  paymentMethod: p.paymentMethod,
                  paymentReference: p.paymentReference ?? null,
                  paymentDate: p.paymentDate
                    ? new Date(p.paymentDate)
                    : undefined,
                })),
              },
            }
          : {}),
      },
      include: { items: true, payments: true },
    });
    return jsonCreated(data);
  }

  const data = await delegate.create({ data: body ?? {} });
  return jsonCreated(data);
}

export async function updateHandler(
  resource: AllowedResource,
  id: string,
  body: any,
) {
  const delegate: any = getDelegate(resource);
  try {
    const data = await delegate.update({ where: { id }, data: body ?? {} });
    return jsonOk(data);
  } catch (e: any) {
    // Prisma throws on missing record
    return jsonError("Not found", 404, e?.message);
  }
}

export async function deleteHandler(resource: AllowedResource, id: string) {
  const delegate: any = getDelegate(resource);
  try {
    const data = await delegate.delete({ where: { id } });
    return jsonOk(data);
  } catch (e: any) {
    return jsonError("Not found", 404, e?.message);
  }
}
