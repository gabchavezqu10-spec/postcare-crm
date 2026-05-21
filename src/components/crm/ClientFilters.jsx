import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X, CalendarClock, AlertTriangle } from "lucide-react";
import moment from "moment";

const ESTADOS = [
  "Atendido",
  "Próxima sesión agendada",
  "Requiere nueva sesión",
  "En seguimiento",
  "Tratamiento finalizado",
  "No continuó",
  "Vencido",
];

export default function ClientFilters({ filters, setFilters, sedes, servicios }) {
  const today = moment().format("YYYY-MM-DD");

  const handleQuickFilter = (type) => {
    if (type === "hoy") {
      setFilters(prev => ({ ...prev, fechaProxima: today, estado: "all" }));
    } else if (type === "vencidos") {
      setFilters(prev => ({ ...prev, fechaProxima: "", vencidos: true, estado: "all" }));
    } else if (type === "requieren") {
      setFilters(prev => ({ ...prev, estado: "Requiere nueva sesión", fechaProxima: "", vencidos: false }));
    }
  };

  const clearFilters = () => {
    setFilters({ search: "", sede: "all", servicio: "all", estado: "all", fechaProxima: "", vencidos: false, webhookStatus: "all" });
  };

  const hasActiveFilters = filters.search || filters.sede !== "all" || filters.servicio !== "all" || filters.estado !== "all" || filters.fechaProxima || filters.vencidos || filters.webhookStatus !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickFilter("hoy")}
          className="text-xs gap-1.5 border-primary/20 text-primary hover:bg-primary/10 dark:border-primary/30 dark:hover:bg-primary/20"
        >
          <CalendarClock className="w-3.5 h-3.5" />
          Sesión hoy
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickFilter("vencidos")}
          className="text-xs gap-1.5 border-destructive/20 text-destructive hover:bg-destructive/10 dark:border-destructive/30 dark:hover:bg-destructive/20"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Vencidos
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickFilter("requieren")}
          className="text-xs gap-1.5 border-amber-500/20 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30 dark:hover:bg-amber-500/20"
        >
          Requieren sesión
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" /> Limpiar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nombre, teléfono o DNI..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="pl-9 h-9 text-sm bg-background"
          />
        </div>

        <Select value={filters.sede} onValueChange={(v) => setFilters(prev => ({ ...prev, sede: v }))}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Sede" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las sedes</SelectItem>
            {sedes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.servicio} onValueChange={(v) => setFilters(prev => ({ ...prev, servicio: v }))}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Servicio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los servicios</SelectItem>
            {servicios.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.estado} onValueChange={(v) => setFilters(prev => ({ ...prev, estado: v }))}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.webhookStatus || "all"} onValueChange={(v) => setFilters(prev => ({ ...prev, webhookStatus: v }))}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Webhook" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos webhook</SelectItem>
            <SelectItem value={null}>Sin webhook</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="scheduled">Programado</SelectItem>
            <SelectItem value="sent">Enviado</SelectItem>
            <SelectItem value="failed">Fallido</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}