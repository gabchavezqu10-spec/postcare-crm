import { clientApi } from '@/api/clientApi';
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";

export default function BasicInfoSection({ client }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: client.nombre || "",
    apellido: client.apellido || "",
    documento: client.documento || "",
    telefono: client.telefono || "",
    short_summary: client.short_summary || "",
    observaciones: client.observaciones || "",
  });

  const updateMutation = useMutation({
    mutationFn: (data) => clientApi.update(client.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setEditing(false);
      toast.success("Información actualizada");
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Información Básica</CardTitle>
          {!editing ? (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Edit2 className="w-4 h-4 mr-1" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                <X className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-1" />
                Guardar
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
              <label className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1 block">
                Resumen
              </label>
              <Textarea
                placeholder="Ej: Cliente recurrente, prefiere contacto por WhatsApp"
                value={formData.short_summary}
                onChange={(e) => setFormData({ ...formData, short_summary: e.target.value })}
                className="bg-white dark:bg-slate-900"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nombre</label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Apellido</label>
                <Input
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">DNI</label>
                <Input
                  value={formData.documento}
                  onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Teléfono</label>
                <Input
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Notas Generales</label>
              <Textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                rows={3}
              />
            </div>
          </>
        ) : (
          <>
            {client.short_summary && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                <p className="text-sm text-blue-900 dark:text-blue-100 italic">
                  "{client.short_summary}"
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Nombre completo</p>
                <p className="font-medium text-foreground">{client.nombre} {client.apellido}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">DNI</p>
                <p className="font-medium text-foreground">{client.documento || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Teléfono</p>
                <p className="font-medium text-foreground">{client.telefono || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Estado</p>
                <p className="font-medium text-foreground">{client.estado}</p>
              </div>
            </div>

            {client.observaciones && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">Notas</p>
                <p className="text-sm text-foreground">{client.observaciones}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}