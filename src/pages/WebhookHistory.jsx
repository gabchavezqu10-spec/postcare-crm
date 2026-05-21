import React from "react";
import IntegrationHistoryView from "../components/integrations/IntegrationHistoryView";

export default function WebhookHistory() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Historial de Webhooks</h1>
        <p className="text-sm text-muted-foreground mt-1">Registro completo de ejecuciones de integraciones</p>
      </div>
      <IntegrationHistoryView />
    </div>
  );
}