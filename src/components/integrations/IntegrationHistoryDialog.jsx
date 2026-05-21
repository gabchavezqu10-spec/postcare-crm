import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, User } from "lucide-react";
import moment from "moment";

export default function IntegrationHistoryDialog({ open, onOpenChange, integration, logs, loading }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historial - {integration?.nombre}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay registros de ejecución
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {log.estado_envio === 'exitoso' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">{log.evento}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.fue_manual && (
                      <Badge variant="outline" className="text-xs">
                        <User className="w-3 h-3 mr-1" />
                        Manual
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {moment(log.created_date).format("DD/MM/YYYY HH:mm")}
                    </span>
                  </div>
                </div>

                {log.codigo_respuesta && (
                  <Badge variant={log.estado_envio === 'exitoso' ? 'default' : 'destructive'} className="text-xs">
                    HTTP {log.codigo_respuesta}
                  </Badge>
                )}

                {log.error_mensaje && (
                  <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    {log.error_mensaje}
                  </div>
                )}

                {log.payload_enviado && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Ver payload
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                      {JSON.stringify(JSON.parse(log.payload_enviado), null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}