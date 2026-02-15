import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";

// --- Constants & Types ---
export const ALLOWED_RESOURCES = [
  "stores",
  "store_users",
  "customers",
  "items",
  "utang",
  "utang_items",
  "payments",
  "user",
] as const;

export type AllowedResource = (typeof ALLOWED_RESOURCES)[number];

export function isAllowedResource(
  resource: string,
): resource is AllowedResource {
  return ALLOWED_RESOURCES.includes(resource as AllowedResource);
}

// A generic type for Prisma delegates to enforce common methods
type PrismaDelegate = {
  findMany: (args?: any) => Promise<any[]>;
  count: (args?: any) => Promise<number>;
  findUnique: (args: { where: { id: string } }) => Promise<any | null>;
  create: (args: { data: any }) => Promise<any>;
  update: (args: { where: { id: string }; data: any }) => Promise<any>;
  delete: (args: { where: { id: string } }) => Promise<any>;
};

export function getDelegate(resource: AllowedResource): PrismaDelegate {
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
    default:
      throw new Error(`Unknown resource: ${resource}`);
  }
}

// --- Validation Schemas ---
const paginationSchema = z.object({
  _start: z.coerce.number().int().nonnegative().optional(),
  _end: z.coerce.number().int().nonnegative().optional(),
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().optional(),
});

const sortSchema = z.object({
  _sort: z.string().optional(),
  _order: z.enum(["ASC", "DESC", "asc", "desc"]).optional().default("ASC"),
});

// --- Helper Functions ---
function parsePagination(searchParams: URLSearchParams) {
  const parseResult = paginationSchema.safeParse(
    Object.fromEntries(searchParams.entries()),
  );

  if (!parseResult.success) {
    return { skip: 0, take: 10 };
  }

  const { _start, _end, page, perPage } = parseResult.data;

  // 1. Priority: _start & _end (Refine default)
  if (_start !== undefined && _end !== undefined && _end > _start) {
    return { skip: _start, take: _end - _start };
  }

  // 2. Fallback: page & perPage
  const safePage = page ?? 1;
  const safePerPage = perPage ?? 10;
  return { skip: (safePage - 1) * safePerPage, take: safePerPage };
}

function parseSort(searchParams: URLSearchParams) {
  const parseResult = sortSchema.safeParse(
    Object.fromEntries(searchParams.entries()),
  );

  if (!parseResult.success || !parseResult.data._sort) {
    return undefined;
  }

  const { _sort, _order } = parseResult.data;
  const direction = _order.toLowerCase() as "asc" | "desc";
  return { [_sort]: direction };
}

function stringOrUndefined(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;
}

// --- Filter Building ---
function buildWhere(
  resource: AllowedResource,
  searchParams: URLSearchParams,
  userId?: string,
): any {
  const q = stringOrUndefined(searchParams.get("q"));
  const params = Object.fromEntries(searchParams.entries());

  switch (resource) {
    case "stores": {
      const where: Prisma.StoreWhereInput = {};
      if (q) where.name = { contains: q, mode: "insensitive" };

      // Only show stores that the user has access to
      if (userId) {
        where.users = {
          some: {
            userId: userId,
          },
        };
      }
      return where;
    }

    case "store_users": {
      const where: Prisma.StoreUserWhereInput = {};
      const storeId = stringOrUndefined(params.storeId);
      const role = stringOrUndefined(params.role);

      // Users can only see their own store-user relationships
      if (userId) where.userId = userId;
      if (storeId) where.storeId = storeId;
      if (role) where.role = role as any;
      return where;
    }

    case "customers": {
      const where: Prisma.CustomerWhereInput = {};
      const storeId = stringOrUndefined(params.storeId);

      // Filter by stores the user has access to
      if (userId) {
        where.store = {
          users: {
            some: {
              userId: userId,
            },
          },
        };
      }

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
      const where: Prisma.ItemWhereInput = {};
      const storeId = stringOrUndefined(params.storeId);
      const category = stringOrUndefined(params.category);

      // Filter by stores the user has access to
      if (userId) {
        where.store = {
          users: {
            some: {
              userId: userId,
            },
          },
        };
      }

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
      const where: Prisma.UtangWhereInput = {};
      const storeId = stringOrUndefined(params.storeId);
      const customerId = stringOrUndefined(params.customerId);
      const status = stringOrUndefined(params.status);

      // Filter by stores the user has access to
      if (userId) {
        where.store = {
          users: {
            some: {
              userId: userId,
            },
          },
        };
      }

      if (storeId) where.storeId = storeId;
      if (customerId) where.customerId = customerId;
      if (status) where.status = status as any;
      if (q) where.description = { contains: q, mode: "insensitive" };
      return where;
    }

    case "utang_items": {
      const where: Prisma.UtangItemWhereInput = {};
      const utangId = stringOrUndefined(params.utangId);
      const itemId = stringOrUndefined(params.itemId);

      // Filter by utang that belongs to stores the user has access to
      if (userId) {
        where.utang = {
          store: {
            users: {
              some: {
                userId: userId,
              },
            },
          },
        };
      }

      if (utangId) where.utangId = utangId;
      if (itemId) where.itemId = itemId;
      return where;
    }

    case "payments": {
      const where: Prisma.PaymentWhereInput = {};
      const utangId = stringOrUndefined(params.utangId);
      const paymentMethod = stringOrUndefined(params.paymentMethod);

      // Filter by payments that belong to user's stores
      if (userId) {
        where.utang = {
          store: {
            users: {
              some: {
                userId: userId,
              },
            },
          },
        };
      }

      if (utangId) where.utangId = utangId;
      if (paymentMethod) where.paymentMethod = paymentMethod as any;
      if (q) {
        where.OR = [
          { payerName: { contains: q, mode: "insensitive" } },
          { paymentReference: { contains: q, mode: "insensitive" } },
        ];
      }
      return where;
    }

    case "user": {
      // Users can only see their own user data
      if (userId) {
        return { id: userId };
      }
      return {};
    }

    default:
      return {};
  }
}
// --- Responses & Errors ---
export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function jsonCreated<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function jsonError(message: string, status = 400, extra?: unknown) {
  return NextResponse.json(
    { message, ...(extra ? { extra } : {}) },
    { status },
  );
}

function handlePrismaError(e: unknown) {
  console.error("API Error:", e);
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") {
      return jsonError("Unique constraint violation", 409, e.meta);
    }
    if (e.code === "P2025") {
      return jsonError("Record not found", 404, e.meta);
    }
  }
  if (e instanceof Error) {
    return jsonError(e.message, 500);
  }
  return jsonError("An unexpected error occurred", 500);
}

// --- Handlers ---
// Update listHandler to include user context
export async function listHandler(
  req: NextRequest,
  resource: AllowedResource,
  userId?: string,
) {
  // REJECT EARLY - Don't even process if no userId
  if (!userId) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const url = new URL(req.url);
    const { skip, take } = parsePagination(url.searchParams);
    const orderBy = parseSort(url.searchParams);
    const where = buildWhere(resource, url.searchParams, userId as string);

    const delegate = getDelegate(resource);

    const [total, data] = await Promise.all([
      delegate.count({ where }),
      delegate.findMany({
        where,
        skip,
        take,
        ...(orderBy ? { orderBy } : {}),
      }),
    ]);

    return jsonOk(data, { headers: { "x-total-count": String(total) } });
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function getOneHandler(
  resource: AllowedResource,
  id: string,
  userId?: string,
) {
  try {
    const delegate = getDelegate(resource);
    const data = await delegate.findUnique({
      where: { id },
      ...(getIncludeForResource(resource)
        ? { include: getIncludeForResource(resource) }
        : {}),
    });

    if (!data) return jsonError("Not found", 404);

    // Verify user has access to this resource
    if (!(await userHasAccessToResource(resource, data, userId))) {
      return jsonError("Forbidden", 403);
    }

    return jsonOk(data);
  } catch (error) {
    return handlePrismaError(error);
  }
}

// Helper function to check if user has access to a specific resource
async function userHasAccessToResource(
  resource: AllowedResource,
  data: any,
  userId?: string,
): Promise<boolean> {
  if (!userId) return false;

  switch (resource) {
    case "stores":
      // Check if user is associated with this store
      const storeUser = await prisma.storeUser.findFirst({
        where: {
          storeId: data.id,
          userId: userId,
        },
      });
      return !!storeUser;

    case "store_users":
      // Users can only access their own store-user records
      return data.userId === userId;

    case "customers":
    case "items":
      // Check if the store belongs to the user
      const storeAccess = await prisma.storeUser.findFirst({
        where: {
          storeId: data.storeId,
          userId: userId,
        },
      });
      return !!storeAccess;

    case "utang":
      // Check if the utang's store belongs to the user
      const utangAccess = await prisma.storeUser.findFirst({
        where: {
          storeId: data.storeId,
          userId: userId,
        },
      });
      return !!utangAccess;

    case "utang_items":
      // Check through utang
      const utangItem = await prisma.utangItem.findUnique({
        where: { id: data.id },
        include: { utang: { include: { store: true } } },
      });
      if (!utangItem) return false;
      const utangItemAccess = await prisma.storeUser.findFirst({
        where: {
          storeId: utangItem.utang.storeId,
          userId: userId,
        },
      });
      return !!utangItemAccess;

    case "payments":
      // Check through utang
      const payment = await prisma.payment.findUnique({
        where: { id: data.id },
        include: { utang: { include: { store: true } } },
      });
      if (!payment) return false;
      const paymentAccess = await prisma.storeUser.findFirst({
        where: {
          storeId: payment.utang.storeId,
          userId: userId,
        },
      });
      return !!paymentAccess;

    case "user":
      return data.id === userId;

    default:
      return false;
  }
}

function getIncludeForResource(resource: AllowedResource): any {
  switch (resource) {
    case "customers":
    case "items":
      return { store: true };
    case "utang":
      return { store: true };
    case "utang_items":
      return { utang: { include: { store: true } } };
    case "payments":
      return { utang: { include: { store: true } } };
    default:
      return undefined;
  }
}

export async function createHandler(
  resource: AllowedResource,
  body: any,
  userId?: string,
) {
  try {
    // 1. Store creation: Must link the creating user as OWNER
    if (resource === "stores") {
      if (!userId) {
        return jsonError("You must be logged in to create a store.", 401);
      }

      const data = await prisma.store.create({
        data: {
          ...body,
          users: {
            create: {
              userId: userId,
              role: "OWNER",
            },
          },
        },
      });
      return jsonCreated(data);
    }
    if (resource === "customers") {
      if (!body.storeId) {
        return jsonError("Missing store ID for customer.", 400);
      }

      // Exclude storeId from the body before spreading
      const { storeId, ...safeBody } = body;

      // Create customer using relational connect
      const data = await prisma.customer.create({
        data: {
          ...safeBody, // safe fields only
          store: {
            connect: { id: storeId }, // attach to store
          },
        },
      });

      return jsonCreated(data);
    }

    // 3. Utang creation: Nested items/payments
    if (resource === "utang") {
      const { items, payments, ...rest } = body ?? {};
      const data = await prisma.utang.create({
        data: {
          ...rest,
          ...(Array.isArray(items) && items.length > 0
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
          ...(Array.isArray(payments) && payments.length > 0
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

    // 4. Generic create
    const delegate = getDelegate(resource);
    const data = await delegate.create({ data: body ?? {} });
    return jsonCreated(data);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function updateHandler(
  resource: AllowedResource,
  id: string,
  body: any,
) {
  try {
    const delegate = getDelegate(resource);
    const data = await delegate.update({ where: { id }, data: body ?? {} });
    return jsonOk(data);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function deleteHandler(resource: AllowedResource, id: string) {
  try {
    const delegate = getDelegate(resource);
    const data = await delegate.delete({ where: { id } });
    return jsonOk(data);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function verifyUserAccess(
  resource: AllowedResource,
  id: string,
  userId?: string,
): Promise<boolean> {
  if (!userId) return false;

  // Implement similar access verification logic as in userHasAccessToResource
  // You can reuse the same function by importing it
  const delegate = getDelegate(resource);
  const data = await delegate.findUnique({
    where: { id },
    ...(getIncludeForResource(resource)
      ? { include: getIncludeForResource(resource) as any }
      : {}),
  });

  if (!data) return false;
  return userHasAccessToResource(resource, data, userId);
}
