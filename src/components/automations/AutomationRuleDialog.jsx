import { automationRuleApi } from '@/api/automationRuleApi';
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

const AVAILABLE_FIELDS = [
  { value: "estado", label: "Estado Comercial" },
  { value: "fecha_proxima_sesion", label: "Fecha Próxima Sesión" },
  { value: "dias_vencido", label: "Días Vencido" },
  { value: "numero_sesion_actual", label: "Sesiones Completadas" },
  { value: "sede", label: "Sede" },
  { value: "servicio_realizado", label: "Servicio" },
  { value: "profesional", label: "Profesional" },
];

const OPERATORS = [
  { value: "equals", label: "Igual a" },
  { value: "not_equals", label: "Diferente de" },
  { value: "greater_than", label: "Mayor que" },
  { value: "greater_or_equal", label: "Mayor o igual que" },
  { value: "less_than", label: "Menor que" },
  { value: "less_or_equal", label: "Menor o igual que" },
  { value: "contains", label: "Contiene" },
  { value: "is_today", label: "Es hoy" },
  { value: "is_before_today", label: "Es antes de hoy" },
  { value: "is_after_today", label: "Es después de hoy" },
];

export default function AutomationRuleDialog({ rule, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    rule_name: rule?.rule_name || "",
    is_active: rule?.is_active ?? true,
    action_type: rule?.action_type || "change_status",
    action_target: rule?.action_target || "",
    conditions: rule ? JSON.parse(rule.conditions_json) : [
      { field: "", operator: "equals", value: "" }
    ],
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        conditions_json: JSON.stringify(data.conditions),
      };
      delete payload.conditions;

      if (rule) {
        return automationRuleApi.update(rule.id, payload);
      } else {
        return automationRuleApi.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automationRules"] });
      toast.success(rule ? "Regla actualizada" : "Regla creada");
      onClose();
    },
  });

  const handleSave = () => {
    if (!formData.rule_name.trim()) {
      toast.error("El nombre de la regla es obligatorio");
      return;
    }
    if (!formData.action_target.trim()) {
      toast.error("El objetivo de la acción es obligatorio");
      return;
    }
    if (formData.conditions.some(c => !c.field || !c.operator)) {
      toast.error("Todas las condiciones deben estar completas");
      return;
    }
    saveMutation.mutate(formData);
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [...formData.conditions, { field: "", operator: "equals", value: "" }]
    });
  };

  const removeCondition = (index) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index)
    });
  };

  const updateCondition = (index, field, value) => {
    const newConditions = [...formData.conditions];
    newConditions[index][field] = value;
    setFormData({ ...formData, conditions: newConditions });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? "Editar Regla" : "Nueva Regla de Automatización"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Nombre de la regla</label>
            <Input
              placeholder="Ej: Cambiar a Requiere Nueva Sesión"
              value={formData.rule_name}
              onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de acción</label>
              <Select
                value={formData.action_type}
                onValueChange={(val) => setFormData({ ...formData, action_type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="change_status">Cambiar Estado</SelectItem>
                  <SelectItem value="send_webhook">Enviar Webhook</SelectItem>
                  <SelectItem value="send_telegram">Notificar Telegram</SelectItem>
                  <SelectItem value="add_tag">Agregar Etiqueta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                {formData.action_type === "change_status" && "Estado objetivo"}
                {formData.action_type === "send_webhook" && "Webhook objetivo"}
                {formData.action_type === "send_telegram" && "Canal Telegram"}
                {formData.action_type === "add_tag" && "Etiqueta a agregar"}
              </label>
              <Input
                placeholder={
                  formData.action_type === "change_status" ? "Ej: Requiere nueva sesión" :
                  formData.action_type === "send_webhook" ? "Ej: Webhook Cobranza" :
                  formData.action_type === "send_telegram" ? "Ej: Asesor Piura" :
                  "Ej: Urgente"
                }
                value={formData.action_target}
                onChange={(e) => setFormData({ ...formData, action_target: e.target.value })}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Condiciones (todas deben cumplirse)</label>
              <Button variant="outline" size="sm" onClick={addCondition}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>

            <div className="space-y-2">
              {formData.conditions.map((condition, index) => (
                <Card key={index} className="bg-accent/50">
                  <CardContent className="p-3">
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <label className="text-xs text-muted-foreground mb-1 block">Campo</label>
                        <Select
                          value={condition.field}
                          onValueChange={(val) => updateCondition(index, "field", val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_FIELDS.map(f => (
                              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-3">
                        <label className="text-xs text-muted-foreground mb-1 block">Operador</label>
                        <Select
                          value={condition.operator}
                          onValueChange={(val) => updateCondition(index, "operator", val)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {OPERATORS.map(op => (
                              <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-4">
                        <label className="text-xs text-muted-foreground mb-1 block">Valor</label>
                        <Input
                          placeholder={
                            ["is_today", "is_before_today", "is_after_today"].includes(condition.operator)
                              ? "No requerido"
                              : "Valor..."
                          }
                          value={condition.value}
                          onChange={(e) => updateCondition(index, "value", e.target.value)}
                          disabled={["is_today", "is_before_today", "is_after_today"].includes(condition.operator)}
                        />
                      </div>

                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCondition(index)}
                          disabled={formData.conditions.length === 1}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              {rule ? "Actualizar" : "Crear"} Regla
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}