import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import StatCard from "../components/crm/StatCard";
import { Users, AlertTriangle, CalendarClock, CheckCircle2, XCircle, Clock } from "lucide-react";
import moment from "moment";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Dashboard() {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date"),
  });

  const stats = React.useMemo(() => {
    const today = moment().startOf("day");
    return {
      total: clients.length,
      requieren: clients.filter(c => c.estado === "Requiere nueva sesión").length,
      hoy: clients.filter(c => c.fecha_proxima_sesion && moment(c.fecha_proxima_sesion).isSame(today, "day")).length,
      vencidos: clients.filter(c =>
        c.fecha_proxima_sesion &&
        moment(c.fecha_proxima_sesion).isBefore(today, "day") &&
        !["Tratamiento finalizado", "No continuó"].includes(c.estado)
      ).length,
      finalizados: clients.filter(c => c.estado === "Tratamiento finalizado").length,
      noContinuaron: clients.filter(c => c.estado === "No continuó").length,
    };
  }, [clients]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const recentClients = clients.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Panel de Control</h1>
        <p className="text-sm text-muted-foreground mt-1">Resumen de clientes post-atención</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Clientes" value={stats.total} icon={Users} color="blue" />
        <StatCard label="Requieren Sesión" value={stats.requieren} icon={AlertTriangle} color="amber" />
        <StatCard label="Sesión Hoy" value={stats.hoy} icon={CalendarClock} color="purple" />
        <StatCard label="Vencidos" value={stats.vencidos} icon={Clock} color="red" />
        <StatCard label="Finalizados" value={stats.finalizados} icon={CheckCircle2} color="green" />
        <StatCard label="No Continuaron" value={stats.noContinuaron} icon={XCircle} color="slate" />
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Clientes Recientes</h2>
          <Link to={createPageUrl("Clients")} className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
            Ver todos →
          </Link>
        </div>
        <div className="divide-y divide-border/50">
          {recentClients.map(c => (
            <div key={c.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">{c.nombre} {c.apellido}</p>
                <p className="text-xs text-muted-foreground">{c.servicio_realizado} · {c.sede}</p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  c.estado === "Requiere nueva sesión" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" :
                  c.estado === "Atendido" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" :
                  "bg-muted text-muted-foreground border-border"
                }`}>
                  {c.estado}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {c.fecha_proxima_sesion ? moment(c.fecha_proxima_sesion).format("DD/MM/YY") : "—"}
                </p>
              </div>
            </div>
          ))}
          {recentClients.length === 0 && (
            <p className="text-center text-muted-foreground py-6">No hay clientes registrados aún</p>
          )}
        </div>
      </div>
    </div>
  );
}