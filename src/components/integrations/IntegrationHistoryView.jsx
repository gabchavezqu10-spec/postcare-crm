import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle2, XCircle, Clock, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import moment from "moment";

export default function IntegrationHistoryView() {
  const [selectedLog, setSelectedLog] = useState(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["integration-logs-all"],
    queryFn: () => base44.entities.IntegrationLog.list("-created_date", 100),
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => base44.entities.Integration.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const getIntegrationName = (id) => {
    const integration = integrations.find(i => i.id === id);
    return integration?.nombre || "—";
  };

  const getClientName = (id) => {
    const client = clients.find(c => c.id === id);
    return client ? `${client.nombre} ${client.apellido}` : "—";
  };

  const getStatusBadge = (status) => {
    const config = {
      sent: { label: "Enviado", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
      failed: { label: "Fallido", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
      pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
      retrying: { label: "Reintentando", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
    };
    const { label, color } = config[status] || { label: status, color: "bg-gray-100 text-gray-800" };
    return <Badge className={`text-xs ${color}`}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Historial de Ejecuciones</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay registros de ejecución
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Integración</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>HTTP</TableHead>
                    <TableHead>Intentos</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{getIntegrationName(log.integration_id)}</TableCell>
                      <TableCell>{getClientName(log.client_id)}</TableCell>
                      <TableCell className="text-sm">{log.evento}</TableCell>
                      <TableCell>{getStatusBadge(log.estado_envio)}</TableCell>
                      <TableCell>
                        {log.codigo_respuesta && (
                          <Badge variant="outline" className="text-xs">
                            {log.codigo_respuesta}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{log.attempt_number || 1}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {moment(log.created_date).format("DD/MM/YY HH:mm")}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-primary hover:text-primary/80"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalle de Ejecución</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Integración</p>
                  <p className="font-medium">{getIntegrationName(selectedLog.integration_id)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Paciente</p>
                  <p className="font-medium">{getClientName(selectedLog.client_id)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Evento</p>
                  <p className="font-medium">{selectedLog.evento}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estado</p>
                  {getStatusBadge(selectedLog.estado_envio)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Código HTTP</p>
                  <p className="font-medium">{selectedLog.codigo_respuesta || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha</p>
                  <p className="font-medium">{moment(selectedLog.created_date).format("DD/MM/YY HH:mm:ss")}</p>
                </div>
              </div>

              {selectedLog.payload_enviado && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Payload Enviado</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(JSON.parse(selectedLog.payload_enviado), null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.respuesta && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Respuesta Recibida</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    {selectedLog.respuesta}
                  </pre>
                </div>
              )}

              {selectedLog.error_mensaje && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Error</p>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded text-sm text-red-800 dark:text-red-300">
                    {selectedLog.error_mensaje}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}