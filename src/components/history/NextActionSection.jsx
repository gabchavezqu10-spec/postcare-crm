import { clientNextActionApi } from '@/api/clientNextActionApi';
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, CheckCircle2, Clock, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import moment from "moment";

export default function NextActionSection({ client, nextActions }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    action_type: "Próximo Pago",
    action_date: "",
    notes: "",
    status: "Pendiente",
  });

  const createMutation = useMutation({
    mutationFn: (data) => clientNextActionApi.create({
      ...data,
      client_id: client.id,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nextActions", client.id] });
      setShowForm(false);
      setFormData({
        action_type: "Próximo Pago",
        action_date: "",
        notes: "",
        status: "Pendiente",
      });
      toast.success("Acción agregada");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => clientNextActionApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nextActions", client.id] });
      toast.success("Estado actualizado");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => clientNextActionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nextActions", client.id] });
      toast.success("Acción eliminada");
    },
  });

  const handleCreate = () => {
    if (!formData.action_date) {
      toast.error("La fecha es obligatoria");
      return;
    }
    createMutation.mutate(formData);
  };

  const statusConfig = {
    "Pendiente": { icon: Clock, color: "text-orange-600 bg-orange-50 border-orange-200" },
    "Completada": { icon: CheckCircle2, color: "text-green-600 bg-green-50 border-green-200" },
    "Cancelada": { icon: X, color: "text-red-600 bg-red-50 border-red-200" },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Próximas Acciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!showForm ? (
          <Button onClick={() => setShowForm(true)} className="w-full" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Acción
          </Button>
        ) : (
          <Card className="bg-accent/50">
            <CardContent className="p-3 space-y-3">
              <Select
                value={formData.action_type}
                onValueChange={(val) => setFormData({ ...formData, action_type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Próximo Pago">Próximo Pago</SelectItem>
                  <SelectItem value="Próxima Cita">Próxima Cita</SelectItem>
                  <SelectItem value="Seguimiento">Seguimiento</SelectItem>
                  <SelectItem value="Renovación">Renovación</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={formData.action_date}
                onChange={(e) => setFormData({ ...formData, action_date: e.target.value })}
              />

              <Textarea
                placeholder="Notas (opcional)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleCreate} className="flex-1">
                  Agregar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {nextActions.filter(a => a.status !== "Completada" && a.status !== "Cancelada").map((action) => {
            const StatusIcon = statusConfig[action.status]?.icon || Clock;
            return (
              <Card key={action.id} className={`${statusConfig[action.status]?.color || ""} border`}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <StatusIcon className="w-4 h-4" />
                      <span className="font-medium text-sm">{action.action_type}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => deleteMutation.mutate(action.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs mb-2">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {moment(action.action_date).format("DD/MM/YYYY")}
                  </p>
                  {action.notes && (
                    <p className="text-xs text-muted-foreground mb-2">{action.notes}</p>
                  )}
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs flex-1"
                      onClick={() => updateStatusMutation.mutate({ id: action.id, status: "Completada" })}
                    >
                      Completar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs flex-1"
                      onClick={() => updateStatusMutation.mutate({ id: action.id, status: "Cancelada" })}
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {nextActions.filter(a => a.status === "Completada" || a.status === "Cancelada").length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">
                Ver acciones completadas/canceladas ({nextActions.filter(a => a.status === "Completada" || a.status === "Cancelada").length})
              </summary>
              <div className="mt-2 space-y-1">
                {nextActions.filter(a => a.status === "Completada" || a.status === "Cancelada").map((action) => (
                  <div key={action.id} className="text-muted-foreground p-2 bg-accent/30 rounded">
                    <p className="font-medium">{action.action_type}</p>
                    <p className="text-xs">
                      {moment(action.action_date).format("DD/MM/YYYY")} • {action.status}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  );
}