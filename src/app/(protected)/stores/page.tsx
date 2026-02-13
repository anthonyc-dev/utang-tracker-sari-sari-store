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

// --- shadcn pagination imports ---
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Pagination } from "@components/shared/Pagination";

const storeSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  address: z.string().min(1, "Address is required"),
});

type Store = {
  id: number | string;
  name: string;
  address: string;
};

// --- Pagination constants ---
const PAGE_SIZE = 10;

export default function StoresPage() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);

  // Live search: update `search` immediately when user types
  useEffect(() => {
    setSearch(searchInput);
    setPage(1); // reset to page 1 on search
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]); // instant search as input changes

  const {
    query,
    result,
  } = useList<Store>({
    resource: "stores",
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
  const [editValues, setEditValues] = useState<{ name: string; address: string }>({
    name: "",
    address: "",
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: "",
      address: "",
    },
  });

  const refetchStores = async () => {
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
      setIsCreateModalOpen(false);
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

  // Calculate the current results slice, e.g. "showing 11-20 of 28"
  const firstItemIdx = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItemIdx =
    totalCount === 0
      ? 0
      : Math.min(page * PAGE_SIZE, totalCount);

  return (
    <div className="space-y-8 w-full min-h-screen mx-auto">
      <Breadcrumb />
      <h1 className="text-2xl font-bold flex items-center gap-3">
        Stores
      </h1>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 w-lg">
          <Input
            type="text"
            placeholder="Search stores..."
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
              Add Store
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Store</DialogTitle>
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

                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Adding..." : "Add Store"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent>
          {/* Stores Table using shadcn table */}
          <div className="space-y-2">

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
                {(Array.isArray(data) ? data : []).map((store: any) =>
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
                      <TableCell>
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
                          <div className="text-destructive text-xs mt-1">
                            {editError}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow key={store.id}>
                      <TableCell>{store.name}</TableCell>
                      <TableCell>{store.address}</TableCell>
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
                            <DropdownMenuItem onClick={() => startEdit(store)}>
                              <EditIcon className="size-4" />
                              <span className="flex items-center gap-2">Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(store.id)}
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
                      colSpan={3}
                      className="text-center text-muted-foreground p-6"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                )}
                {Array.isArray(data) && data.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground p-6"
                    >
                      No stores found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* --- Pagination UI --- */}
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

