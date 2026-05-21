import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import moment from "moment";

const SEDES = ["Miraflores Country Club", "Santa Isabel", "Sullana"];

export default function NewAttentionDialog({ open, onOpenChange, client, services, onSave, saving }) {
  const [form, setForm] = useState({
    fecha_atencion: moment().format("YYYY-MM-DD"),
    servicio_realizado: "",
    sede: "",
    profesional: "",
    observaciones: "",
  });

  useEffect(() => {
    if (client) {
      setForm({
        fecha_atencion: moment().format("YYYY-MM-DD"),
        servicio_realizado: client.servicio_realizado || "",
        sede: client.sede || "",
        profesional: client.profesional || "",
        observaciones: "",
      });
    }
  }, [client, open]);

  const handleSubmit = () => {
    onSave(form);
  };

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Registrar Nueva Atención
          </DialogTitle>
          {client && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {client.nombre} {client.apellido} — Sesión {(client.numero_sesion_actual || 1) + 1}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500 dark:text-slate-400">Fecha de Atención</Label>
            <Input type="date" value={form.fecha_atencion} onChange={e => set("fecha_atencion", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500 dark:text-slate-400">Servicio</Label>
            <Select value={form.servicio_realizado} onValueChange={v => set("servicio_realizado", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {services.map(s => <SelectItem key={s.nombre_servicio} value={s.nombre_servicio}>{s.nombre_servicio}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500 dark:text-slate-400">Sede</Label>
            <Select value={form.sede} onValueChange={v => set("sede", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {SEDES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500 dark:text-slate-400">Profesional</Label>
            <Input value={form.profesional} onChange={e => set("profesional", e.target.value)} placeholder="Profesional" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500 dark:text-slate-400">Observaciones</Label>
            <Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.servicio_realizado || !form.sede}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Registrar Atención
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}