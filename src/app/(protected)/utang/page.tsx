"use client";

import { useList } from "@refinedev/core";
import { Breadcrumb } from "@components/refine-ui/layout/breadcrumb";

export default function UtangPage() {
  const { query, result } = useList({ resource: "utang" });
  const { isLoading, error } = query;
  const { data } = result;

  return (
    <div className="p-3 space-y-4 w-full min-h-screen mx-auto">
      <Breadcrumb />
      <h1 className="text-2xl font-bold">Utang</h1>
      {isLoading && <div>Loading...</div>}
      {error && <div className="text-destructive">Error loading utang</div>}
      <pre className="text-xs bg-muted/40 p-4 rounded overflow-auto">
        {JSON.stringify(data ?? [], null, 2)}
      </pre>
    </div>
  );
}

