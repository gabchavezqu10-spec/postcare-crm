import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowUpRight, ArrowDownLeft, MoreVertical, Play, History, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import moment from "moment";

export default function IntegrationCard({ integration, onToggle, onEdit, onTest, onHistory, onDelete }) {
  const isSaliente = integration.tipo_integracion === "saliente";
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg ${isSaliente ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
              {isSaliente ? (
                <ArrowUpRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <ArrowDownLeft className="w-4 h-4 text-green-600 dark:text-green-400" />
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-semibold">{integration.nombre}</CardTitle>
              {integration.descripcion && (
                <p className="text-xs text-muted-foreground mt-1">{integration.descripcion}</p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(integration)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTest(integration)}>
                <Play className="w-4 h-4 mr-2" />
                Probar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onHistory(integration)}>
                <History className="w-4 h-4 mr-2" />
                Historial
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(integration)} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Estado</span>
          <div className="flex items-center gap-2">
            <span className="text-xs">{integration.activo ? 'Activo' : 'Inactivo'}</span>
            <Switch
              checked={integration.activo}
              onCheckedChange={(checked) => onToggle(integration, checked)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            {integration.metodo_http || 'POST'}
          </Badge>
          {integration.tipo_integracion === 'saliente' && integration.evento_disparador && (
            <Badge variant="secondary" className="text-xs">
              {integration.evento_disparador.replace(/_/g, ' ')}
            </Badge>
          )}
        </div>

        {integration.url && (
          <div className="text-xs text-muted-foreground truncate">
            {integration.url}
          </div>
        )}

        {integration.ultima_ejecucion && (
          <div className="pt-2 border-t text-xs text-muted-foreground">
            Última ejecución: {moment(integration.ultima_ejecucion).fromNow()}
            {integration.ultimo_estado && (
              <Badge variant={integration.ultimo_estado === 'exitoso' ? 'default' : 'destructive'} className="ml-2 text-xs">
                {integration.ultimo_estado}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}