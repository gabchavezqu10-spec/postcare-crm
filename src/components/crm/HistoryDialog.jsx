import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import ClientStatusBadge from "./ClientStatusBadge";
import moment from "moment";

export default function HistoryDialog({ open, onOpenChange, client, history, loading }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historial de Atenciones</DialogTitle>
          {client && <p className="text-sm text-slate-500 dark:text-slate-400">{client.nombre} {client.apellido}</p>}
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
            </div>
          ) : history.length === 0 ? (
            <p className="text-center text-slate-400 dark:text-slate-500 py-8">Sin historial de atenciones</p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="space-y-4">
                {history.map((h, i) => (
                  <div key={h.id} className="relative pl-10">
                    <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 bg-slate-300 dark:bg-slate-600 shadow-sm" />
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Sesión {h.numero_sesion || i + 1}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {h.fecha_atencion ? moment(h.fecha_atencion).format("DD/MM/YYYY") : "—"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <div><span className="text-slate-400 dark:text-slate-500">Servicio:</span> {h.servicio_realizado}</div>
                        <div><span className="text-slate-400 dark:text-slate-500">Sede:</span> {h.sede}</div>
                        {h.profesional && <div><span className="text-slate-400 dark:text-slate-500">Prof:</span> {h.profesional}</div>}
                        {h.estado_nuevo && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">Estado:</span>
                            <ClientStatusBadge status={h.estado_nuevo} />
                          </div>
                        )}
                      </div>
                      {h.observaciones && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">{h.observaciones}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}