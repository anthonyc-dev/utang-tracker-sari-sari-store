"use client";

import React from "react";
import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import {
  Store,
  LayoutDashboard,
  Users,
  Building2,
  Package,
  Receipt,
  CreditCard,
} from "lucide-react";

import routerProvider from "@refinedev/nextjs-router";

import { dataProvider } from "@providers/data-provider";
import { refineAuthProvider } from "@/lib/refineAuthProvider";
import { useNotificationProvider } from "@/components/refine-ui/notification/use-notification-provider";
import { Toaster } from "@/components/refine-ui/notification/toaster";
import "@/app/globals.css";

type RefineContextProps = {
  children: React.ReactNode;
};

export const RefineContext = ({ children }: RefineContextProps) => {
  const notificationProvider = useNotificationProvider();

  return (
    <RefineKbarProvider>
      <Refine
        dataProvider={dataProvider}
        authProvider={refineAuthProvider}
        notificationProvider={notificationProvider}
        routerProvider={routerProvider}
        resources={[
          {
            name: "dashboard",
            list: "/dashboard",
            meta: { label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
          },
          {
            name: "stores",
            list: "/stores",
            meta: { label: "Stores", icon: <Building2 className="size-4" /> },
          },
          {
            name: "customers",
            list: "/customers",
            meta: { label: "Customers", icon: <Users className="size-4" /> },
          },
          {
            name: "items",
            list: "/items",
            meta: { label: "Items", icon: <Package className="size-4" /> },
          },
          {
            name: "utang",
            list: "/utang",
            meta: { label: "Utang", icon: <Receipt className="size-4" /> },
          },
          {
            name: "payments",
            list: "/payments",
            meta: { label: "Payments", icon: <CreditCard className="size-4" /> },
          },
        ]}
        options={{
          syncWithLocation: true,
          warnWhenUnsavedChanges: true,
          title: {
            text: "Sari-Sari Store",
            icon: <Store className="size-6" />,
          },
        }}
      >
        {children}
        <Toaster />
        <RefineKbar />
      </Refine>
    </RefineKbarProvider>
  );
};
