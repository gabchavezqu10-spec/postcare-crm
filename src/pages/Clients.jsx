import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { UserPlus, Loader2, X, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import { useSearchParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

import ClientFilters from "../components/crm/ClientFilters";
import ClientTable from "../components/crm/ClientTable";
import ClientFormDialog from "../components/crm/ClientFormDialog";
import NewAttentionDialog from "../components/crm/NewAttentionDialog";
import HistoryDialog from "../components/crm/HistoryDialog";
import { triggerWebhooksForClient } from "../components/integrations/integrationService";

export default function Clients() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({ search: "", sede: "all", servicio: "all", estado: "all", fechaProxima: "", vencidos: false, webhookStatus: "all" });
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [attentionOpen, setAttentionOpen] = useState(false);
  const [attentionClient, setAttentionClient] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyClient, setHistoryClient] = useState(null);
  const [saving, setSaving] = useState(false);

  const metricFilter = searchParams.get("metricFilter");
  const periodType = searchParams.get("periodType");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date"),
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: () => base44.entities.ServiceConfig.list(),
  });



  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ["history", historyClient?.id],
    queryFn: () => base44.entities.AttentionHistory.filter({ client_id: historyClient.id }, "-fecha_atencion"),
    enabled: !!historyClient,
  });

  const sedes = useMemo(() => [...new Set(clients.map(c => c.sede).filter(Boolean))], [clients]);
  const servicios = useMemo(() => [...new Set(clients.map(c => c.servicio_realizado).filter(Boolean))], [clients]);

  const filteredClients = useMemo(() => {
    let result = clients;

    // Aplicar filtro de métrica si existe
    if (metricFilter) {
      const today = moment().startOf("day");
      const start = startDate ? moment(startDate) : null;
      const end = endDate ? moment(endDate) : null;

      switch (metricFilter) {
        case "requieren_hoy":
          result = result.filter(c => {
            const fechaProxima = c.fecha_proxima_sesion ? moment(c.fecha_proxima_sesion).startOf("day") : null;
            return (fechaProxima && fechaProxima.isSame(today, "day")) || c.estado === "Requiere nueva sesión";
          });
          break;

        case "seguimiento":
          result = result.filter(c => c.estado === "En seguimiento");
          break;

        case "atendidos_semana":
          // Para este caso necesitamos mostrar clientes con sesiones recientes
          result = result.filter(c => {
            const fechaAtencion = c.fecha_atencion ? moment(c.fecha_atencion) : null;
            const hace7Dias = moment().subtract(7, "days").startOf("day");
            return fechaAtencion && fechaAtencion.isSameOrAfter(hace7Dias, "day");
          });
          break;

        case "continuidad":
          result = result.filter(c => {
            const fechaRegistro = c.fecha_registro || c.created_date;
            const sesionesCompletadas = c.numero_sesion_actual || 1;
            const fechaProxima = c.fecha_proxima_sesion ? moment(c.fecha_proxima_sesion).startOf("day") : null;
            
            // Filtrar por período
            const enPeriodo = fechaRegistro && start && end && 
              moment(fechaRegistro).isBetween(start, end, "day", "[]");
            
            // Es evaluable si tiene >= 2 sesiones o fecha próxima vencida
            const esEvaluable = sesionesCompletadas >= 2 || (fechaProxima && fechaProxima.isBefore(today, "day"));
            
            return enPeriodo && sesionesCompletadas >= 2;
          });
          break;

        case "abandono":
          result = result.filter(c => {
            const fechaRegistro = c.fecha_registro || c.created_date;
            const enPeriodo = fechaRegistro && start && end && 
              moment(fechaRegistro).isBetween(start, end, "day", "[]");
            return enPeriodo && c.estado === "No continuó";
          });
          break;

        case "finalizacion":
          result = result.filter(c => {
            const fechaRegistro = c.fecha_registro || c.created_date;
            const enPeriodo = fechaRegistro && start && end && 
              moment(fechaRegistro).isBetween(start, end, "day", "[]");
            return enPeriodo && c.estado === "Tratamiento finalizado";
          });
          break;
      }
    }

    // Aplicar filtros normales
    return result.filter(c => {
      if (filters.search) {
        const s = filters.search.toLowerCase();
        if (!(c.nombre + " " + c.apellido).toLowerCase().includes(s) && !c.telefono?.includes(s) && !c.documento?.includes(s)) return false;
      }
      if (filters.sede !== "all" && c.sede !== filters.sede) return false;
      if (filters.servicio !== "all" && c.servicio_realizado !== filters.servicio) return false;
      
      // Manejo del filtro de estado con "Vencido"
      if (filters.estado !== "all") {
        if (filters.estado === "Vencido") {
          // Verificar si está vencido (más de 3 días)
          const isVencido = c.fecha_proxima_sesion && 
            moment().diff(moment(c.fecha_proxima_sesion), "days") > 3 &&
            !["Tratamiento finalizado", "No continuó"].includes(c.estado);
          if (!isVencido) return false;
        } else {
          // Verificar estado normal
          if (c.estado !== filters.estado) return false;
        }
      }
      
      if (filters.webhookStatus !== "all" && c.webhook_status !== filters.webhookStatus) return false;
      if (filters.fechaProxima && c.fecha_proxima_sesion !== filters.fechaProxima) return false;
      if (filters.vencidos) {
        const overdue = c.fecha_proxima_sesion && moment(c.fecha_proxima_sesion).isBefore(moment(), "day") &&
          !["Tratamiento finalizado", "No continuó"].includes(c.estado);
        if (!overdue) return false;
      }
      return true;
    });
  }, [clients, filters, metricFilter, startDate, endDate]);

  const getMetricLabel = () => {
    const labels = {
      requieren_hoy: "Requieren Sesión Hoy",
      seguimiento: "En Seguimiento",
      atendidos_semana: "Atendidos Esta Semana",
      continuidad: "Tasa de Continuidad",
      abandono: "Tasa de Abandono",
      finalizacion: "Tasa de Finalización",
    };
    return labels[metricFilter] || "";
  };

  const clearMetricFilter = () => {
    setSearchParams(new URLSearchParams());
  };

  const handleSaveClient = async (data) => {
    setSaving(true);
    if (editingClient) {
      await base44.entities.Client.update(editingClient.id, data);
      await triggerWebhooksForClient({ ...editingClient, ...data }, "lead_actualizado");
      toast.success("Cliente actualizado");
    } else {
      const created = await base44.entities.Client.create(data);
      await triggerWebhooksForClient({ ...data, id: created?.id }, "lead_registrado");
      toast.success("Cliente registrado exitosamente");
    }
    setSaving(false);
    setFormOpen(false);
    setEditingClient(null);
    queryClient.invalidateQueries({ queryKey: ["clients"] });
  };

  const handleNewAttention = async (form) => {
    setSaving(true);
    const client = attentionClient;
    const service = services.find(s => s.nombre_servicio === form.servicio_realizado);
    const dias = service?.dias_para_proxima_sesion || 30;
    const sesiones = service?.sesiones_sugeridas || client.total_sesiones_sugeridas || 1;
    const newSession = (client.numero_sesion_actual || 1) + 1;
    const nextDate = moment(form.fecha_atencion).add(dias, "days").format("YYYY-MM-DD");

    await base44.entities.AttentionHistory.create({
      client_id: client.id,
      servicio_realizado: form.servicio_realizado,
      sede: form.sede,
      fecha_atencion: form.fecha_atencion,
      profesional: form.profesional,
      observaciones: form.observaciones,
      numero_sesion: newSession,
      estado_anterior: client.estado,
      estado_nuevo: "Atendido",
    });

    const today = moment().startOf("day");
    const proxima = moment(nextDate).startOf("day");
    const diasVencido = proxima.isBefore(today) ? today.diff(proxima, "days") : 0;
    const nivelVencimiento = diasVencido === 0 ? "" : diasVencido <= 3 ? "green" : diasVencido <= 10 ? "orange" : "red";

    const updatedClient = {
      servicio_realizado: form.servicio_realizado,
      sede: form.sede,
      fecha_atencion: form.fecha_atencion,
      fecha_proxima_sesion: nextDate,
      profesional: form.profesional,
      observaciones: form.observaciones,
      numero_sesion_actual: newSession,
      total_sesiones_sugeridas: sesiones,
      estado: "Atendido",
      dias_vencido: diasVencido,
      nivel_vencimiento: nivelVencimiento,
    };

    await base44.entities.Client.update(client.id, updatedClient);
    await triggerWebhooksForClient({ ...client, ...updatedClient }, "nueva_sesion_registrada");
    setSaving(false);
    setAttentionOpen(false);
    setAttentionClient(null);
    toast.success(`Atención registrada — Sesión ${newSession}`);
    queryClient.invalidateQueries({ queryKey: ["clients"] });
  };



  const handleAction = async (action, client, extra) => {
    switch (action) {
      case "editar":
        setEditingClient(client);
        setFormOpen(true);
        break;
      case "agendar":
        await base44.entities.Client.update(client.id, { estado: "Próxima sesión agendada" });
        await triggerWebhooksForClient({ ...client, estado: "Próxima sesión agendada" }, "cambio_de_estado");
        toast.success("Estado actualizado a 'Próxima sesión agendada'");
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        break;
      case "nueva_atencion":
        setAttentionClient(client);
        setAttentionOpen(true);
        break;
      case "historial":
        setHistoryClient(client);
        setHistoryOpen(true);
        break;

      case "finalizar":
        await base44.entities.Client.update(client.id, { estado: "Tratamiento finalizado" });
        await triggerWebhooksForClient({ ...client, estado: "Tratamiento finalizado" }, "cambio_de_estado");
        toast.success("Tratamiento finalizado");
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        break;
      case "no_continuo":
        await base44.entities.Client.update(client.id, { estado: "No continuó" });
        await triggerWebhooksForClient({ ...client, estado: "No continuó" }, "cambio_de_estado");
        toast.success("Estado actualizado");
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        break;
      case "eliminar":
        if (window.confirm(`¿Eliminar a ${client.nombre} ${client.apellido}? Esta acción no se puede deshacer.`)) {
          await base44.entities.Client.delete(client.id);
          toast.success("Cliente eliminado");
          queryClient.invalidateQueries({ queryKey: ["clients"] });
        }
        break;
      case "cambiar_estado":
        await base44.entities.Client.update(client.id, { estado: extra });
        await triggerWebhooksForClient({ ...client, estado: extra }, "cambio_de_estado");
        if (extra === "En seguimiento") {
          await triggerWebhooksForClient({ ...client, estado: extra }, "en_seguimiento");
        }
        toast.success(`Estado cambiado a '${extra}'`);
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        break;
      case "ver":
        setEditingClient(client);
        setFormOpen(true);
        break;
    }
  };

  return (
    <div className="space-y-6">
      {metricFilter && (
        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
          <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Filtrado por métrica del dashboard: <strong>{getMetricLabel()}</strong>
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearMetricFilter}
              className="h-7 text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
            >
              <X className="w-4 h-4 mr-1" />
              Limpiar filtro
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Clientes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {metricFilter ? `${filteredClients.length} cliente(s) en filtro` : `${clients.length} clientes registrados`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => { setEditingClient(null); setFormOpen(true); }}
            className="gap-1.5 text-sm bg-slate-800 hover:bg-slate-900"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5">
        <ClientFilters filters={filters} setFilters={setFilters} sedes={sedes} servicios={servicios} />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <ClientTable clients={filteredClients} onAction={handleAction} />
        )}
      </div>

      <ClientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        client={editingClient}
        services={services}
        onSave={handleSaveClient}
        saving={saving}
      />

      <NewAttentionDialog
        open={attentionOpen}
        onOpenChange={setAttentionOpen}
        client={attentionClient}
        services={services}
        onSave={handleNewAttention}
        saving={saving}
      />

      <HistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        client={historyClient}
        history={history}
        loading={historyLoading}
      />
    </div>
  );
}