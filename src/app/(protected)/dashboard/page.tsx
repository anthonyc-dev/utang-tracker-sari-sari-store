"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Breadcrumb } from "@components/refine-ui/layout/breadcrumb";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

const MOCK_DASHBOARD_DATA = [
  { name: "Jan", value: 400 },
  { name: "Feb", value: 300 },
  { name: "Mar", value: 500 },
  { name: "Apr", value: 700 },
  { name: "May", value: 600 },
  { name: "Jun", value: 800 },
];

const STAT_CARDS = [
  {
    label: "Total Sales",
    value: "$24,200",
    change: "+3.7%",
    description: "Since last month",
    color: "text-green-600"
  },
  {
    label: "Customers",
    value: "1,200",
    change: "-1.2%",
    description: "Since last month",
    color: "text-red-600"
  },
  {
    label: "Outstanding Credits",
    value: "$5,830",
    change: "+0.6%",
    description: "Since last month",
    color: "text-green-600"
  }
];

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { data: session } = authClient.useSession();

  async function handleSignOut() {
    setLoading(true);
    await authClient.signOut();
    router.push("/sign-in");
    setLoading(false);
  }

  return (
    <main className="min-h-screen w-full flex flex-col mx-auto gap-6">
      <Breadcrumb />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          Dashboard
        </h1>

      </div>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STAT_CARDS.map((stat, idx) => (
          <Card key={stat.label} className="shadow-sm border-0 ">
            <CardHeader className="pb-2">
              <CardDescription className="uppercase text-xs tracking-wide text-muted-foreground">
                {stat.label}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <span className="text-2xl font-bold">{stat.value}</span>
              <span className={cn("text-sm", stat.color)}>
                {stat.change}
              </span>
              <span className="text-xs text-muted-foreground">{stat.description}</span>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Chart Card */}
      <Card className="shadow-md border-0 ">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Sales Overview
            <span className="text-sm text-muted-foreground font-normal">Last 6 months</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_DASHBOARD_DATA}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}