import { z } from "zod";

export const storeSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  address: z.string().optional(),
});

export const storeUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  storeId: z.string().min(1, "Store ID is required"),
  role: z.enum(["OWNER", "STAFF"]),
});

export const customerSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  name: z.string().min(1, "Customer name is required"),
  phone: z.string().optional(),
});

export const itemSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  name: z.string().min(1, "Item name is required"),
  category: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  unit: z.string().min(1, "Unit is required"),
});

export const utangSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  customerId: z.string().min(1, "Customer ID is required"),
  description: z.string().optional(),
  totalAmount: z.number().positive("Total amount must be positive"),
  dueDate: z.string().datetime().optional(),
  items: z.array(
    z.object({
      itemId: z.string().min(1, "Item ID is required"),
      quantity: z.number().int().positive("Quantity must be positive"),
      unitPrice: z.number().positive("Unit price must be positive"),
    }),
  ),
});

export const paymentSchema = z.object({
  utangId: z.string().min(1, "Utang ID is required"),
  payerName: z.string().min(1, "Payer name is required"),
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: z.enum(["CASH", "EWALLET", "BANK_TRANSFER"]),
  paymentReference: z.string().optional(),
});
