import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  UserPlus, Stethoscope, Calendar, DollarSign, 
  FileText, StickyNote, ArrowRightLeft, Clock 
} from "lucide-react";
import moment from "moment";

export default function TimelineSection({ client, timeline }) {
  const eventConfig = {
    registro_cliente: { icon: UserPlus, color: "bg-blue-500", label: "Registro" },
    tratamiento_agregado: { icon: Stethoscope, color: "bg-purple-500", label: "Tratamiento" },
    sesion_registrada: { icon: Calendar, color: "bg-green-500", label: "Sesión" },
    pago_registrado: { icon: DollarSign, color: "bg-emerald-500", label: "Pago" },
    cita_agendada: { icon: Clock, color: "bg-orange-500", label: "Cita" },
    documento_subido: { icon: FileText, color: "bg-indigo-500", label: "Documento" },
    nota_agregada: { icon: StickyNote, color: "bg-yellow-500", label: "Nota" },
    estado_cambiado: { icon: ArrowRightLeft, color: "bg-pink-500", label: "Cambio Estado" },
    otro: { icon: Clock, color: "bg-gray-500", label: "Evento" },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Timeline de Eventos</CardTitle>
      </CardHeader>
      <CardContent>
        {timeline.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No hay eventos registrados
          </div>
        ) : (
          <div className="space-y-4">
            {timeline.map((event, idx) => {
              const config = eventConfig[event.event_type] || eventConfig.otro;
              const Icon = config.icon;
              
              return (
                <div key={event.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-8 w-8 rounded-full ${config.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    {idx < timeline.length - 1 && (
                      <div className="flex-1 w-px bg-border mt-2" style={{ minHeight: "2rem" }} />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm text-foreground">{event.event_title}</p>
                        {event.event_description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{event.event_description}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs whitespace-nowrap ml-2">
                        {moment(event.event_date).format("DD/MM/YY HH:mm")}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}