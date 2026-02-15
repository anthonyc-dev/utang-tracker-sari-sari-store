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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@components/ui/dropdown-menu";
import { EditIcon, EllipsisVertical, Trash } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@components/ui/dialog";
import { Card, CardContent } from "@components/ui/card";
import { Pagination } from "@components/shared/Pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";

// --- Customer schema and type ---
const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  phone: z.string().min(1, "Phone is required"),
  storeId: z.string().min(1, "Store is required"),
});

type Customer = {
  id: number | string;
  name: string;
  phone: string;
  storeId: string | number;
  store?: {
    id: number | string;
    name: string;
  };
};

type Store = {
  id: string | number;
  name: string;
};

const PAGE_SIZE = 10;

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  // Fetch stores for select dropdown
  const { result: storeResult } = useList<Store>({
    resource: "stores",
    pagination: { currentPage: 1, pageSize: 100 }, // assume less than 100 stores
    sorters: [{ field: "name", order: "asc" }],
  });
  const stores: Store[] = Array.isArray(storeResult?.data) ? storeResult.data : [];

  const { query, result } = useList<Customer>({
    resource: "customers",
    filters: search
      ? [
        {
          field: "q",
          operator: "contains",
          value: search,
        },
      ]
      : [],
    pagination: {
      currentPage: page,
      pageSize: PAGE_SIZE,
    },
  });
  const { isLoading, error, refetch: refetchList } = query as any;
  const { data, total } = result;
  const { mutateAsync: createAsync } = useCreate();
  const { mutateAsync: deleteAsync } = useDelete();
  const { mutateAsync: updateAsync } = useUpdate();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; phone: string; storeId: string }>({
    name: "",
    phone: "",
    storeId: "",
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "",
      storeId: "",
    },
  });

  const refetchCustomers = async () => {
    if (typeof refetchList === "function") {
      await refetchList();
    }
  };

  const onSubmit = async (values: z.infer<typeof customerSchema>) => {
    setSubmitError(null);
    try {
      setIsCreating(true);
      await createAsync({
        resource: "customers",
        values: {
          ...values,
          storeId: values.storeId, // stored as id, but user selects by store name in UI
        },
      });
      await refetchCustomers();
      form.reset();
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to create customer.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    try {
      await deleteAsync({
        resource: "customers",
        id,
      });
      await refetchCustomers();
    } catch (err) {
      // Could show error
    }
  };

  const startEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setEditValues({
      name: customer.name,
      phone: customer.phone,
      storeId:
        typeof customer.storeId !== "undefined"
          ? String(customer.storeId)
          : customer.store?.id
            ? String(customer.store.id)
            : "",
    });
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ name: "", phone: "", storeId: "" });
    setEditError(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditStoreChange = (value: string) => {
    setEditValues((prev) => ({ ...prev, storeId: value }));
  };

  const handleUpdate = async (id: number | string) => {
    setEditError(null);
    if (!editValues.name || !editValues.phone || !editValues.storeId) {
      setEditError("All fields are required.");
      return;
    }
    try {
      await updateAsync({
        resource: "customers",
        id,
        values: {
          name: editValues.name,
          phone: editValues.phone,
          storeId: editValues.storeId,
        },
      });
      await refetchCustomers();
      cancelEdit();
    } catch (err: any) {
      setEditError(err?.message || "Failed to update customer.");
    }
  };

  // Pagination helpers
  const totalCount = typeof total === "number" ? total : 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < pageCount) setPage(page + 1);
  };

  const handlePageClick = (idx: number) => {
    if (idx !== page) setPage(idx);
  };

  const firstItemIdx = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItemIdx =
    totalCount === 0 ? 0 : Math.min(page * PAGE_SIZE, totalCount);

  // Helper to get store name from storeId
  const getStoreName = (storeId: string | number | undefined) => {
    const store = stores.find((s) => String(s.id) === String(storeId));
    return store ? store.name : "";
  };

  return (
    <div className="space-y-8 w-full min-h-screen mx-auto">
      <Breadcrumb />
      <h1 className="text-2xl font-bold flex items-center gap-3">
        Customers
      </h1>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 w-lg">
          <Input
            type="text"
            placeholder="Search customers..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="max-w-xs"
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
              }
            }}
          />
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Customer</DialogTitle>
            </DialogHeader>
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
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter customer name" {...field} disabled={isCreating} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} disabled={isCreating} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="storeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isCreating}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select store" />
                          </SelectTrigger>
                          <SelectContent>
                            {stores.map((store) => (
                              <SelectItem key={store.id} value={String(store.id)}>
                                {store.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {submitError && (
                  <div className="text-destructive text-sm">{submitError}</div>
                )}

                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Adding..." : "Add Customer"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent>
          <div className="space-y-2">
            {error && <div className="text-destructive">Error loading customers</div>}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(data) ? data : []).map((customer: any) =>
                  editingId === customer.id ? (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <Input
                          name="name"
                          value={editValues.name}
                          onChange={handleEditChange}
                          placeholder="Name"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          name="phone"
                          value={editValues.phone}
                          onChange={handleEditChange}
                          placeholder="Phone"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={editValues.storeId}
                          onValueChange={handleEditStoreChange}
                          disabled={isCreating}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select store" />
                          </SelectTrigger>
                          <SelectContent>
                            {stores.map((store) => (
                              <SelectItem key={store.id} value={String(store.id)}>
                                {store.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleUpdate(customer.id)}
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
                          <div className="text-destructive text-xs mt-1">
                            {editError}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow key={customer.id}>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>
                        {customer.store?.name
                          ? customer.store.name
                          : getStoreName(customer.storeId)}
                      </TableCell>
                      <TableCell className="space-x-1 text-right align-middle">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <span>
                              <Button variant="ghost" size="icon">
                                <EllipsisVertical className="size-4" />
                              </Button>
                            </span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" side="bottom">
                            <DropdownMenuItem onClick={() => startEdit(customer)}>
                              <EditIcon className="size-4" />
                              <span className="flex items-center gap-2">Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(customer.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash className="size-4" />
                              <span className="flex items-center gap-2">Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                )}
                {isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground p-6"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                )}
                {Array.isArray(data) && data.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground p-6"
                    >
                      No customers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Pagination
        page={page}
        pageCount={pageCount}
        onPrev={handlePrevPage}
        onNext={handleNextPage}
        onPage={handlePageClick}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        firstItemIdx={firstItemIdx}
        lastItemIdx={lastItemIdx}
      />
    </div>
  );
}
