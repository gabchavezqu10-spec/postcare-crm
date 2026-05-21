import { serviceConfigApi } from '@/api/serviceConfigApi';
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function ServiceSettings() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nombre_servicio: "", dias_para_proxima_sesion: 30, sesiones_sugeridas: 6 });

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: () => serviceConfigApi.filter(),
  });

  const openNew = () => {
    setEditing(null);
    setForm({ nombre_servicio: "", dias_para_proxima_sesion: 30, sesiones_sugeridas: 6 });
    setDialogOpen(true);
  };

  const openEdit = (service) => {
    setEditing(service);
    setForm({
      nombre_servicio: service.nombre_servicio,
      dias_para_proxima_sesion: service.dias_para_proxima_sesion,
      sesiones_sugeridas: service.sesiones_sugeridas,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editing) {
      await serviceConfigApi.update(editing.id, form);
      toast.success("Servicio actualizado");
    } else {
      await serviceConfigApi.create(form);
      toast.success("Servicio creado");
    }
    setSaving(false);
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["services"] });
  };

  const handleDelete = async (service) => {
    await serviceConfigApi.delete(service.id);
    toast.success("Servicio eliminado");
    queryClient.invalidateQueries({ queryKey: ["services"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Settings2 className="w-6 h-6" />
            Configuración de Servicios
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Define los servicios, días entre sesiones y sesiones sugeridas
          </p>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1.5 bg-slate-800 hover:bg-slate-900">
          <Plus className="w-4 h-4" /> Nuevo Servicio
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 dark:border-slate-700/50">
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Servicio</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Días entre sesiones</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sesiones sugeridas</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map(s => (
                <TableRow key={s.id} className="border-slate-50 dark:border-slate-700/30 hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                  <TableCell className="font-medium text-slate-800 dark:text-slate-200">{s.nombre_servicio}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium">
                      {s.dias_para_proxima_sesion} días
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm font-medium">
                      {s.sesiones_sugeridas} sesiones
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDelete(s)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {services.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-slate-400 dark:text-slate-500 py-8">
                    No hay servicios configurados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Nombre del Servicio</Label>
              <Input
                value={form.nombre_servicio}
                onChange={e => setForm(p => ({ ...p, nombre_servicio: e.target.value }))}
                placeholder="Ej: Limpieza facial"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Días para próxima sesión</Label>
              <Input
                type="number"
                min="1"
                value={form.dias_para_proxima_sesion}
                onChange={e => setForm(p => ({ ...p, dias_para_proxima_sesion: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Sesiones sugeridas</Label>
              <Input
                type="number"
                min="1"
                value={form.sesiones_sugeridas}
                onChange={e => setForm(p => ({ ...p, sesiones_sugeridas: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.nombre_servicio}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}