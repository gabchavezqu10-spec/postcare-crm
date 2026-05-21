import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, CalendarPlus, RotateCcw, Send, CheckCircle2, XCircle, History, Phone, Trash2 } from "lucide-react";
import ClientStatusBadge from "./ClientStatusBadge";
import moment from "moment";
import { cn } from "@/lib/utils";

export default function ClientTable({ clients, onAction }) {
  // onAction(action, client, extra?)
  const isOverdue = (client) => {
    if (!client.fecha_proxima_sesion) return false;
    const daysDiff = moment().diff(moment(client.fecha_proxima_sesion), "days");
    return daysDiff > 3 && !["Tratamiento finalizado", "No continuó"].includes(client.estado);
  };

  const getDisplayStatus = (client) => {
    if (isOverdue(client)) {
      return "Vencido";
    }
    return client.estado;
  };

  const isToday = (date) => {
    if (!date) return false;
    return moment(date).isSame(moment(), "day");
  };

  const getWebhookBadge = (status) => {
    if (!status) return null;
    const config = {
      pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
      scheduled: { label: "Programado", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
      sent: { label: "Enviado", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
      failed: { label: "Fallido", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
    };
    const { label, color } = config[status] || {};
    return label ? <Badge className={`text-xs ${color}`}>{label}</Badge> : null;
  };

  const getOverdueBadge = (client) => {
    if (!client.nivel_vencimiento) return null;
    const config = {
      green: { label: `${client.dias_vencido}d`, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
      orange: { label: `${client.dias_vencido}d`, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
      red: { label: `${client.dias_vencido}d`, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    };
    const { label, color } = config[client.nivel_vencimiento] || {};
    return label ? <Badge className={`text-xs ${color}`}>{label}</Badge> : null;
  };

  if (clients.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 dark:text-slate-500">
        <p className="text-lg font-medium">No se encontraron clientes</p>
        <p className="text-sm mt-1">Ajusta los filtros o registra un nuevo cliente</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-100 dark:border-slate-700/50">
            <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Paciente</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">DNI</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Teléfono</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Servicio</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sede</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sesiones</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Última sesión</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Próxima sesión</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Webhook</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow
              key={client.id}
              className={cn(
                "border-slate-50 dark:border-slate-700/30 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer",
                isOverdue(client) && "bg-red-50/40 dark:bg-red-900/10",
                isToday(client.fecha_proxima_sesion) && "bg-blue-50/40 dark:bg-blue-900/10"
              )}
              onClick={() => onAction("ver", client)}
            >
              <TableCell>
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{client.nombre} {client.apellido}</p>
                  {client.profesional && <p className="text-xs text-slate-400 dark:text-slate-500">Prof: {client.profesional}</p>}
                </div>
              </TableCell>
              <TableCell className="text-sm text-slate-600 dark:text-slate-400">{client.documento || "—"}</TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                  <Phone className="w-3 h-3" />{client.telefono}
                </span>
              </TableCell>
              <TableCell className="text-sm text-slate-600 dark:text-slate-400">{client.servicio_realizado}</TableCell>
              <TableCell className="text-sm text-slate-600 dark:text-slate-400">{client.sede}</TableCell>
              <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                {client.numero_sesion_actual || 1}/{client.total_sesiones_sugeridas || "—"}
              </TableCell>
              <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                {client.fecha_atencion ? moment(client.fecha_atencion).format("DD/MM/YY") : "—"}
              </TableCell>
              <TableCell>
                <span className={cn(
                  "text-sm",
                  isOverdue(client) ? "text-red-600 dark:text-red-400 font-medium" : isToday(client.fecha_proxima_sesion) ? "text-blue-600 dark:text-blue-400 font-medium" : "text-slate-600 dark:text-slate-400"
                )}>
                  {client.fecha_proxima_sesion ? moment(client.fecha_proxima_sesion).format("DD/MM/YY") : "—"}
                </span>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="cursor-pointer hover:opacity-80 transition-opacity">
                      <ClientStatusBadge status={getDisplayStatus(client)} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    {["Atendido","Próxima sesión agendada","Requiere nueva sesión","En seguimiento","Tratamiento finalizado","No continuó"].map(s => (
                      <DropdownMenuItem key={s} onClick={() => onAction("cambiar_estado", client, s)} className={client.estado === s ? "font-semibold" : ""}>
                        {s}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
              <TableCell>{getWebhookBadge(client.webhook_status)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction("editar", client); }}>
                      <Pencil className="w-4 h-4 mr-2" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction("agendar", client); }}>
                      <CalendarPlus className="w-4 h-4 mr-2" /> Agendar sesión
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction("nueva_atencion", client); }}>
                      <RotateCcw className="w-4 h-4 mr-2" /> Registrar nueva atención
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction("historial", client); }}>
                      <History className="w-4 h-4 mr-2" /> Ver historial
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction("webhook", client); }}>
                      <Send className="w-4 h-4 mr-2" /> Reenviar webhook
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction("finalizar", client); }}>
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Finalizar tratamiento
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction("no_continuo", client); }} className="text-red-600">
                      <XCircle className="w-4 h-4 mr-2" /> No continuó
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction("eliminar", client); }} className="text-red-600 font-medium">
                      <Trash2 className="w-4 h-4 mr-2" /> Eliminar cliente
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}