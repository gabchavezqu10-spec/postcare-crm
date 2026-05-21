import { clientApi } from '@/api/clientApi';
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import IntegrationCard from "../components/integrations/IntegrationCard";
import IntegrationFormDialog from "../components/integrations/IntegrationFormDialog";
import IntegrationHistoryDialog from "../components/integrations/IntegrationHistoryDialog";
import { sendWebhook } from "../components/integrations/integrationService";

export default function Integrations() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyIntegration, setHistoryIntegration] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => integrationApi.filter(),
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["integration-logs", historyIntegration?.id],
    queryFn: () => integrationApiLog.filter({ integration_id: historyIntegration.id }, "-created_date", 50),
    enabled: !!historyIntegration,
  });

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editingIntegration) {
        await integrationApi.update(editingIntegration.id, data);
        toast.success("Integración actualizada");
      } else {
        await integrationApi.create(data);
        toast.success("Integración creada exitosamente");
      }
      setFormOpen(false);
      setEditingIntegration(null);
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    } catch (error) {
      toast.error("Error al guardar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (integration, checked) => {
    try {
      await integrationApi.update(integration.id, { activo: checked });
      toast.success(checked ? "Integración activada" : "Integración desactivada");
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    } catch (error) {
      toast.error("Error al cambiar estado");
    }
  };

  const handleTest = async (integration) => {
    if (integration.tipo_integracion === "entrante") {
      const endpoint = `${window.location.origin}/api/webhook/${integration.id}`;
      navigator.clipboard.writeText(endpoint);
      toast.success("Endpoint copiado al portapapeles", {
        description: endpoint,
      });
      return;
    }

    // Para webhooks salientes, buscar un cliente que cumpla la condición
    const allClients = await clientApi.filter();
    if (!allClients || allClients.length === 0) {
      toast.error("No hay clientes para probar");
      return;
    }

    // Importar funciones de evaluación
    const { evaluateEventCondition, evaluateCondition } = await import("../components/integrations/integrationService");

    // Buscar un cliente que cumpla la condición
    const validClient = allClients.find(client => {
      return evaluateEventCondition(client, integration.evento_disparador) &&
             evaluateCondition(client, integration.condicion_json);
    });

    if (!validClient) {
      toast.error(`No hay clientes que cumplan la condición "${integration.evento_disparador}"`);
      return;
    }

    toast.promise(
      sendWebhook(integration, validClient, true),
      {
        loading: "Enviando webhook de prueba...",
        success: (result) => {
          if (result.success) {
            queryClient.invalidateQueries({ queryKey: ["integrations"] });
            return `Webhook enviado - HTTP ${result.status}`;
          }
          throw new Error(result.message);
        },
        error: (err) => `Error: ${err.message}`,
      }
    );
  };

  const handleHistory = (integration) => {
    setHistoryIntegration(integration);
    setHistoryOpen(true);
  };

  const handleDelete = async (integration) => {
    if (!window.confirm(`¿Eliminar integración "${integration.nombre}"?`)) return;
    
    try {
      await integrationApi.delete(integration.id);
      toast.success("Integración eliminada");
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const handleEdit = (integration) => {
    setEditingIntegration(integration);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Integraciones</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Conecta el CRM con plataformas externas mediante webhooks
          </p>
        </div>
        <Button onClick={() => { setEditingIntegration(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Integración
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : integrations.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-2xl">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-2">No hay integraciones configuradas</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crea webhooks salientes para enviar datos a Make, o webhooks entrantes para recibir actualizaciones.
            </p>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Integración
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map(integration => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onTest={handleTest}
              onHistory={handleHistory}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <IntegrationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        integration={editingIntegration}
        onSave={handleSave}
        saving={saving}
      />

      <IntegrationHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        integration={historyIntegration}
        logs={logs}
        loading={logsLoading}
      />
    </div>
  );
}