import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Play, Pause, Edit2, Trash2, Zap, Clock } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import AutomationRuleDialog from "../components/automations/AutomationRuleDialog";
import AutomationExecutor from "../components/automations/AutomationExecutor";

export default function Automations() {
  const queryClient = useQueryClient();
  const [editingRule, setEditingRule] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  const { data: rules = [] } = useQuery({
    queryKey: ["automationRules"],
    queryFn: () => base44.entities.AutomationRule.list("-created_date"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => 
      base44.entities.AutomationRule.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automationRules"] });
      toast.success("Estado actualizado");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AutomationRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automationRules"] });
      toast.success("Regla eliminada");
    },
  });

  const actionTypeLabels = {
    change_status: "Cambiar Estado",
    send_webhook: "Enviar Webhook",
    send_telegram: "Notificar Telegram",
    add_tag: "Agregar Etiqueta",
  };

  const actionTypeColors = {
    change_status: "bg-blue-100 text-blue-700 border-blue-300",
    send_webhook: "bg-purple-100 text-purple-700 border-purple-300",
    send_telegram: "bg-green-100 text-green-700 border-green-300",
    add_tag: "bg-orange-100 text-orange-700 border-orange-300",
  };

  const renderConditionsSummary = (conditionsJson) => {
    try {
      const conditions = JSON.parse(conditionsJson);
      if (!conditions || conditions.length === 0) return "Sin condiciones";
      
      const summary = conditions.map(c => {
        const fieldLabel = c.field?.replace(/_/g, " ");
        return `${fieldLabel} ${c.operator} ${c.value}`;
      }).join(" Y ");

      return summary.length > 60 ? summary.substring(0, 60) + "..." : summary;
    } catch {
      return "Condiciones inválidas";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Automatizaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configura reglas automáticas basadas en condiciones del CRM
          </p>
        </div>
        <Button onClick={() => { setEditingRule(null); setShowDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Regla
        </Button>
      </div>

      <AutomationExecutor />

      {rules.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No hay reglas de automatización configuradas
            </p>
            <Button onClick={() => { setEditingRule(null); setShowDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Regla
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card key={rule.id} className={!rule.is_active ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{rule.rule_name}</CardTitle>
                      <Badge 
                        className={actionTypeColors[rule.action_type]}
                        variant="outline"
                      >
                        {actionTypeLabels[rule.action_type]}
                      </Badge>
                      {rule.is_active ? (
                        <Badge className="bg-green-100 text-green-700 border-green-300" variant="outline">
                          Activa
                        </Badge>
                      ) : (
                        <Badge variant="outline">Inactiva</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Condiciones: {renderConditionsSummary(rule.conditions_json)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Acción: <span className="font-medium">{rule.action_target}</span>
                    </p>
                    {rule.last_executed_at && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Última ejecución: {moment(rule.last_executed_at).format("DD/MM/YYYY HH:mm")}
                        {rule.execution_count > 0 && ` (${rule.execution_count} ejecuciones)`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => 
                        toggleActiveMutation.mutate({ id: rule.id, is_active: checked })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setEditingRule(rule); setShowDialog(true); }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("¿Eliminar esta regla?")) {
                          deleteMutation.mutate(rule.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {showDialog && (
        <AutomationRuleDialog
          rule={editingRule}
          onClose={() => { setShowDialog(false); setEditingRule(null); }}
        />
      )}
    </div>
  );
}