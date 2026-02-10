"use client";

import { useList, useCreate, useDelete, useUpdate } from "@refinedev/core";
import { Breadcrumb } from "@components/refine-ui/layout/breadcrumb";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent } from "@components/ui/dropdown-menu";
import { EditIcon, DeleteIcon, EllipsisVertical, Trash } from "lucide-react";

const storeSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  address: z.string().min(1, "Address is required"),
});

type Store = {
  id: number | string;
  name: string;
  address: string;
};

export default function StoresPage() {
  // Fetches list of stores; no refetch available in useList currently
  const { query, result } = useList<Store>({ resource: "stores" });
  const { isLoading, error, refetch: refetchList } = query as any; // types "refetch" for workaround
  const { data } = result;
  const { mutateAsync: createAsync } = useCreate();
  const { mutateAsync: deleteAsync } = useDelete();
  const { mutateAsync: updateAsync } = useUpdate();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; address: string }>({ name: "", address: "" });
  const [editError, setEditError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: "",
      address: "",
    },
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  const refetchStores = async () => {
    // useList doesn't return refetch in latest @refinedev/core; fudge for demo.
    if (typeof refetchList === "function") {
      await refetchList();
    }
  };

  const onSubmit = async (values: z.infer<typeof storeSchema>) => {
    setSubmitError(null);
    try {
      setIsCreating(true);
      await createAsync({
        resource: "stores",
        values,
      });
      await refetchStores();
      form.reset();
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to create store.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    try {
      await deleteAsync({
        resource: "stores",
        id,
      });
      await refetchStores();
    } catch (err) {
      // Could show error
    }
  };

  const startEdit = (store: Store) => {
    setEditingId(store.id);
    setEditValues({ name: store.name, address: store.address });
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ name: "", address: "" });
    setEditError(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdate = async (id: number | string) => {
    setEditError(null);
    // basic validation, could use zod if preferred
    if (!editValues.name || !editValues.address) {
      setEditError("Both fields are required.");
      return;
    }
    try {
      await updateAsync({
        resource: "stores",
        id,
        values: {
          name: editValues.name,
          address: editValues.address,
        },
      });
      await refetchStores();
      cancelEdit();
    } catch (err: any) {
      setEditError(err?.message || "Failed to update store.");
    }
  };

  return (
    <div className="p-3 space-y-8 w-full min-h-screen mx-auto">
      <Breadcrumb />
      <h1 className="text-2xl font-bold">Stores</h1>
      {/* Add Store Form */}
      <div className="bg-muted/40 p-6 rounded space-y-6 mb-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            autoComplete="off"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter store name" {...field} disabled={isCreating} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter address" {...field} disabled={isCreating} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {submitError && (
              <div className="text-destructive text-sm">{submitError}</div>
            )}

            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Adding..." : "Add Store"}
            </Button>
          </form>
        </Form>
        {isCreating && (
          <div className="text-muted-foreground text-sm">Creating store...</div>
        )}
      </div>

      {/* Stores Table using shadcn table */}
      <div className="space-y-2">
        {isLoading && <div>Loading...</div>}
        {error && <div className="text-destructive">Error loading stores</div>}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Array.isArray(data) ? data : []).map((store: any) => (
              editingId === store.id ? (
                <TableRow key={store.id}>
                  <TableCell>
                    <Input
                      name="name"
                      value={editValues.name}
                      onChange={handleEditChange}
                      placeholder="Store Name"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      name="address"
                      value={editValues.address}
                      onChange={handleEditChange}
                      placeholder="Address"
                    />
                  </TableCell>
                  <TableCell className="space-x-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUpdate(store.id)}
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                    {editError && (
                      <div className="text-destructive text-xs mt-1">{editError}</div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={store.id}>
                  <TableCell>{store.name}</TableCell>
                  <TableCell>{store.address}</TableCell>
                  <TableCell className="space-x-1">
                    <DropdownMenu>
                      {/* fix: DropdownMenuTrigger must receive a single child */}
                      <DropdownMenuTrigger asChild>
                        <span>
                          <Button variant="ghost" size="icon">
                            <EllipsisVertical className="size-4" />
                          </Button>
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => startEdit(store)}
                        >
                          <span className="flex items-center gap-2">Edit</span>
                          <EditIcon className="size-4" />
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(store.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <span className="flex items-center gap-2">Delete</span>
                          <Trash className="size-4" />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            ))}
            {(Array.isArray(data) && data.length === 0) && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground p-6">
                  No stores found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
