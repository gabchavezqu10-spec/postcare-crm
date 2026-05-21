import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

export default function AutomationExecutor() {
  const queryClient = useQueryClient();
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastExecution, setLastExecution] = useState(null);

  const { data: rules = [] } = useQuery({
    queryKey: ["automationRules"],
    queryFn: () => base44.entities.AutomationRule.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const executeAutomations = async () => {
    setIsExecuting(true);
    let totalExecutions = 0;

    try {
      const activeRules = rules.filter(r => r.is_active);

      for (const rule of activeRules) {
        const conditions = JSON.parse(rule.conditions_json);

        for (const client of clients) {
          const meetsConditions = evaluateConditions(client, conditions);

          if (meetsConditions) {
            await executeAction(client, rule);
            totalExecutions++;

            await base44.entities.AutomationRule.update(rule.id, {
              last_executed_at: new Date().toISOString(),
              execution_count: (rule.execution_count || 0) + 1,
            });
          }
        }
      }

      setLastExecution(new Date().toISOString());
      
      // Forzar recarga completa de clientes para reflejar cambios
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      await queryClient.refetchQueries({ queryKey: ["clients"] });
      await queryClient.invalidateQueries({ queryKey: ["automationRules"] });
      
      if (totalExecutions > 0) {
        toast.success(`${totalExecutions} automatización(es) ejecutada(s) - Tabla actualizada`);
      } else {
        toast.info("No se encontraron clientes que cumplan las condiciones");
      }
    } catch (error) {
      toast.error("Error al ejecutar automatizaciones");
      console.error(error);
    } finally {
      setIsExecuting(false);
    }
  };

  const evaluateConditions = (client, conditions) => {
    return conditions.every(condition => {
      const fieldValue = client[condition.field];
      const { operator, value } = condition;

      switch (operator) {
        case "equals":
          return String(fieldValue) === String(value);
        case "not_equals":
          return String(fieldValue) !== String(value);
        case "greater_than":
          return Number(fieldValue) > Number(value);
        case "greater_or_equal":
          return Number(fieldValue) >= Number(value);
        case "less_than":
          return Number(fieldValue) < Number(value);
        case "less_or_equal":
          return Number(fieldValue) <= Number(value);
        case "contains":
          return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
        case "is_today":
          return moment(fieldValue).isSame(moment(), "day");
        case "is_before_today":
          return moment(fieldValue).isBefore(moment(), "day");
        case "is_after_today":
          return moment(fieldValue).isAfter(moment(), "day");
        default:
          return false;
      }
    });
  };

  const executeAction = async (client, rule) => {
    try {
      switch (rule.action_type) {
        case "change_status":
          await base44.entities.Client.update(client.id, {
            estado: rule.action_target,
          });

          await base44.entities.ClientTimeline.create({
            client_id: client.id,
            event_type: "estado_cambiado",
            event_title: "Estado cambiado por automatización",
            event_description: `Regla: ${rule.rule_name} → ${rule.action_target}`,
            event_date: new Date().toISOString(),
          });
          break;

        case "send_webhook":
        case "send_telegram":
        case "add_tag":
          // Placeholder para futuras implementaciones
          break;
      }

      await base44.entities.AutomationLog.create({
        client_id: client.id,
        rule_id: rule.id,
        rule_name: rule.rule_name,
        action_type: rule.action_type,
        action_target: rule.action_target,
        condition_snapshot: rule.conditions_json,
        execution_result: "success",
        executed_at: new Date().toISOString(),
      });
    } catch (error) {
      await base44.entities.AutomationLog.create({
        client_id: client.id,
        rule_id: rule.id,
        rule_name: rule.rule_name,
        action_type: rule.action_type,
        action_target: rule.action_target,
        condition_snapshot: rule.conditions_json,
        execution_result: "failed",
        error_message: error.message,
        executed_at: new Date().toISOString(),
      });
    }
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Ejecutar Automatizaciones</h3>
            <p className="text-sm text-muted-foreground">
              {lastExecution 
                ? `Última ejecución: ${moment(lastExecution).format("DD/MM/YYYY HH:mm")}`
                : "Evalúa todas las reglas activas y ejecuta las acciones correspondientes"
              }
            </p>
          </div>
          <Button 
            onClick={executeAutomations} 
            disabled={isExecuting || rules.filter(r => r.is_active).length === 0}
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Ejecutando...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Ejecutar Ahora
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}