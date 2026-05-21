import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";
import moment from "moment";

const SEDES = ["Miraflores Country Club", "Santa Isabel", "Sullana"];

export default function ClientFormDialog({ open, onOpenChange, client, services, onSave, saving }) {
  const [form, setForm] = useState({
    nombre: "", apellido: "", documento: "", telefono: "", servicio_realizado: "",
    sede: "", fecha_atencion: moment().format("YYYY-MM-DD"),
    profesional: "", observaciones: "", numero_sesion_actual: 1,
  });
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  useEffect(() => {
    if (client) {
      setForm({
        nombre: client.nombre || "",
        apellido: client.apellido || "",
        documento: client.documento || "",
        telefono: client.telefono || "",
        servicio_realizado: client.servicio_realizado || "",
        sede: client.sede || "",
        fecha_atencion: client.fecha_atencion || moment().format("YYYY-MM-DD"),
        profesional: client.profesional || "",
        observaciones: client.observaciones || "",
        numero_sesion_actual: client.numero_sesion_actual || 1,
      });
    } else {
      setForm({
        nombre: "", apellido: "", documento: "", telefono: "", servicio_realizado: "",
        sede: "", fecha_atencion: moment().format("YYYY-MM-DD"),
        profesional: "", observaciones: "", numero_sesion_actual: 1,
      });
    }
  }, [client, open]);

  const handleSubmit = () => {
    const service = services.find(s => s.nombre_servicio === form.servicio_realizado);
    const dias = service?.dias_para_proxima_sesion || 30;
    const sesiones = service?.sesiones_sugeridas || 1;
    const fecha_proxima = moment(form.fecha_atencion).add(dias, "days").format("YYYY-MM-DD");

    const today = moment().startOf("day");
    const proxima = moment(fecha_proxima).startOf("day");
    const diasVencido = proxima.isBefore(today) ? today.diff(proxima, "days") : 0;
    const nivelVencimiento = diasVencido === 0 ? "" : diasVencido <= 3 ? "green" : diasVencido <= 10 ? "orange" : "red";

    onSave({
      ...form,
      fecha_proxima_sesion: fecha_proxima,
      total_sesiones_sugeridas: sesiones,
      estado: "Atendido",
      dias_vencido: diasVencido,
      nivel_vencimiento: nivelVencimiento,
      webhook_status: "",
      fecha_registro: client?.fecha_registro || moment().toISOString(),
    });
  };

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const checkForDuplicates = async (documento, telefono) => {
    if (!documento && !telefono) return;
    if (client) return; // Skip check when editing
    
    setCheckingDuplicate(true);
    try {
      const checks = [];
      if (documento) checks.push(base44.entities.Client.filter({ documento }));
      if (telefono) checks.push(base44.entities.Client.filter({ telefono }));
      
      const results = await Promise.all(checks);
      const found = results.flat().filter(c => c);
      
      if (found.length > 0) {
        const existing = found[0];
        setDuplicateWarning(existing);
        // Auto-fill with existing data
        setForm(prev => ({
          ...prev,
          nombre: existing.nombre || prev.nombre,
          apellido: existing.apellido || prev.apellido,
          documento: existing.documento || prev.documento,
          telefono: existing.telefono || prev.telefono,
          sede: existing.sede || prev.sede,
          profesional: existing.profesional || prev.profesional,
        }));
      } else {
        setDuplicateWarning(null);
      }
    } catch (error) {
      console.error("Error checking duplicates:", error);
    } finally {
      setCheckingDuplicate(false);
    }
  };

  useEffect(() => {
    if (!client && (form.documento || form.telefono)) {
      const timer = setTimeout(() => {
        checkForDuplicates(form.documento, form.telefono);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [form.documento, form.telefono, client]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {client ? "Editar Cliente" : "Registrar Cliente Atendido"}
          </DialogTitle>
        </DialogHeader>

        {duplicateWarning && (
          <Alert className="mb-4 border-amber-500/50 bg-amber-50 dark:bg-amber-900/20">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              Este paciente ya existe en el CRM: <strong>{duplicateWarning.nombre} {duplicateWarning.apellido}</strong>. 
              Los datos se han rellenado automáticamente. Puedes editarlos si es necesario.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500 dark:text-slate-400">Nombre *</Label>
            <Input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Nombre" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500 dark:text-slate-400">Apellido *</Label>
            <Input value={form.apellido} onChange={e => set("apellido", e.target.value)} placeholder="Apellido" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500 dark:text-slate-400">DNI / Carnet</Label>
            <div className="relative">
              <Input value={form.documento} onChange={e => set("documento", e.target.value)} placeholder="DNI o Carnet de Extranjería" />
              {checkingDuplicate && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500 dark:text-slate-400">Teléfono *</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">+51</span>
              <Input
                className="rounded-l-none"
                value={form.telefono.replace(/^\+51\s?/, "")}
                onChange={e => set("telefono", "+51 " + e.target.value.replace(/^\+51\s?/, ""))}
                placeholder="999 999 999"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500 dark:text-slate-400">Servicio Realizado *</Label>
            <Select value={form.servicio_realizado} onValueChange={v => set("servicio_realizado", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar servicio" /></SelectTrigger>
              <SelectContent>
                {services.map(s => <SelectItem key={s.nombre_servicio} value={s.nombre_servicio}>{s.nombre_servicio}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500 dark:text-slate-400">Sede *</Label>
            <Select value={form.sede} onValueChange={v => set("sede", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar sede" /></SelectTrigger>
              <SelectContent>
                {SEDES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500 dark:text-slate-400">Fecha de Atención *</Label>
            <Input type="date" value={form.fecha_atencion} onChange={e => set("fecha_atencion", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500 dark:text-slate-400">Sesión N°</Label>
            <Input type="number" min="1" value={form.numero_sesion_actual} onChange={e => set("numero_sesion_actual", parseInt(e.target.value) || 1)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs text-slate-500 dark:text-slate-400">Observaciones</Label>
            <Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} placeholder="Notas u observaciones..." rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.nombre || !form.apellido || !form.telefono || !form.servicio_realizado || !form.sede}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {client ? "Guardar Cambios" : "Registrar Cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}