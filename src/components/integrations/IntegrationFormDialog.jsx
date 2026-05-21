import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

const EVENTOS = [
  { value: "lead_registrado", label: "Lead registrado" },
  { value: "lead_actualizado", label: "Lead actualizado" },
  { value: "nueva_sesion_registrada", label: "Nueva sesión registrada" },
  { value: "cambio_de_estado", label: "Cambio de estado" },
  { value: "requiere_nueva_sesion", label: "Requiere nueva sesión" },
  { value: "en_seguimiento", label: "En seguimiento" },
];

const CAMPOS_PERMITIDOS_DEFAULT = ["estado", "observaciones", "fecha_proxima_sesion", "profesional"];

export default function IntegrationFormDialog({ open, onOpenChange, integration, onSave, saving }) {
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    tipo_integracion: "saliente",
    activo: false,
    url: "",
    metodo_http: "POST",
    evento_disparador: "requiere_nueva_sesion",
    condicion_json: "",
    headers_personalizados: "",
    secret_token: "",
    campo_identificador: "telefono",
    campos_permitidos: JSON.stringify(CAMPOS_PERMITIDOS_DEFAULT),
  });

  useEffect(() => {
    if (integration) {
      setForm({
        nombre: integration.nombre || "",
        descripcion: integration.descripcion || "",
        tipo_integracion: integration.tipo_integracion || "saliente",
        activo: integration.activo || false,
        url: integration.url || "",
        metodo_http: integration.metodo_http || "POST",
        evento_disparador: integration.evento_disparador || "requiere_nueva_sesion",
        condicion_json: integration.condicion_json || "",
        headers_personalizados: integration.headers_personalizados || "",
        secret_token: integration.secret_token || "",
        campo_identificador: integration.campo_identificador || "telefono",
        campos_permitidos: integration.campos_permitidos || JSON.stringify(CAMPOS_PERMITIDOS_DEFAULT),
      });
    } else {
      setForm({
        nombre: "",
        descripcion: "",
        tipo_integracion: "saliente",
        activo: false,
        url: "",
        metodo_http: "POST",
        evento_disparador: "requiere_nueva_sesion",
        condicion_json: "",
        headers_personalizados: "",
        secret_token: "",
        campo_identificador: "telefono",
        campos_permitidos: JSON.stringify(CAMPOS_PERMITIDOS_DEFAULT),
      });
    }
  }, [integration, open]);

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const isSaliente = form.tipo_integracion === "saliente";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{integration ? 'Editar' : 'Nueva'} Integración</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej: Make - Seguimiento" required />
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={form.tipo_integracion} onValueChange={v => set("tipo_integracion", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saliente">Saliente</SelectItem>
                  <SelectItem value="entrante">Entrante</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea value={form.descripcion} onChange={e => set("descripcion", e.target.value)} placeholder="Descripción opcional" rows={2} />
          </div>

          {isSaliente ? (
            <>
              <div className="space-y-2">
                <Label>URL del Webhook *</Label>
                <Input value={form.url} onChange={e => set("url", e.target.value)} placeholder="https://hook.make.com/..." required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Método HTTP</Label>
                  <Select value={form.metodo_http} onValueChange={v => set("metodo_http", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="GET">GET</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Evento Disparador *</Label>
                  <Select value={form.evento_disparador} onValueChange={v => set("evento_disparador", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENTOS.map(e => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Condición Adicional (JSON opcional)</Label>
                <Textarea
                  value={form.condicion_json}
                  onChange={e => set("condicion_json", e.target.value)}
                  placeholder='{"estado": "Requiere nueva sesión", "sede": "Miraflores"}'
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Headers Personalizados (JSON opcional)</Label>
                <Textarea
                  value={form.headers_personalizados}
                  onChange={e => set("headers_personalizados", e.target.value)}
                  placeholder='{"Authorization": "Bearer token", "X-Custom": "value"}'
                  rows={2}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Token Secreto *</Label>
                <Input value={form.secret_token} onChange={e => set("secret_token", e.target.value)} placeholder="Token de seguridad" required />
                <p className="text-xs text-muted-foreground">Incluir en header: X-Secret-Token</p>
              </div>

              <div className="space-y-2">
                <Label>Campo Identificador del Lead</Label>
                <Select value={form.campo_identificador} onValueChange={v => set("campo_identificador", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id">ID</SelectItem>
                    <SelectItem value="telefono">Teléfono</SelectItem>
                    <SelectItem value="documento">Documento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Campos Permitidos (JSON array)</Label>
                <Textarea
                  value={form.campos_permitidos}
                  onChange={e => set("campos_permitidos", e.target.value)}
                  placeholder='["estado", "observaciones", "fecha_proxima_sesion"]'
                  rows={2}
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <Label>Activar integración</Label>
              <p className="text-xs text-muted-foreground">La integración se ejecutará automáticamente</p>
            </div>
            <Switch checked={form.activo} onCheckedChange={v => set("activo", v)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {integration ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}