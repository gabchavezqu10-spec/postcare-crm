import React from "react";
import { cn } from "@/lib/utils";

export default function StatCard({ label, value, icon: Icon, color = "blue", subtitle }) {
  const colorMap = {
    blue: "from-blue-500 to-blue-600",
    amber: "from-amber-500 to-amber-600",
    red: "from-red-500 to-red-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    slate: "from-slate-500 to-slate-600",
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn("p-3 rounded-xl bg-gradient-to-br shadow-lg shadow-primary/10 group-hover:scale-110 group-hover:shadow-primary/20 transition-all duration-300", colorMap[color])}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}