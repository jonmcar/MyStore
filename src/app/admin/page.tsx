import Link from "next/link";
import { Package, Eye, EyeOff, AlertTriangle, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { _countListings } from "@/lib/data";
import { RecentOrdersCard } from "./recent-orders-card";

export default async function AdminDashboardPage() {
  const counts = await _countListings();

  const stats = [
    {
      label: "Total listings",
      value: counts.total,
      icon: Package,
    },
    {
      label: "Published",
      value: counts.published,
      icon: Eye,
    },
    {
      label: "Drafts",
      value: counts.drafts,
      icon: EyeOff,
    },
    {
      label: "Out of stock",
      value: counts.outOfStock,
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            A quick look at the shop.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/listings/new">
            <Plus className="mr-2 h-4 w-4" />
            New listing
          </Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {stat.label}
              </CardTitle>
              <stat.icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tabular-nums">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <RecentOrdersCard />
      </div>
    </div>
  );
}
