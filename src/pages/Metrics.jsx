import { clientApi } from '@/api/clientApi';
import { attentionHistoryApi } from '@/api/attentionHistoryApi';
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Activity, CheckCircle2, Clock, TrendingUp, Users, TrendingDown, Calendar, Award } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import moment from "moment";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const PERIOD_TYPES = {
  current_month: "Mes Actual",
  specific_month: "Mes Específico",
  last_3_months: "Últimos 3 Meses",
  last_6_months: "Últimos 6 Meses",
  annual: "Anual (Año Actual)",
};

export default function Metrics() {
  const navigate = useNavigate();
  const currentYear = moment().year();
  const currentMonth = moment().month() + 1;
  
  const [periodType, setPeriodType] = useState("current_month");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const handleMetricClick = (metricType) => {
    const today = moment().format("YYYY-MM-DD");
    const { startDate, endDate } = dateRange;

    const params = new URLSearchParams();
    params.set("metricFilter", metricType);
    params.set("periodType", periodType);
    params.set("startDate", startDate.format("YYYY-MM-DD"));
    params.set("endDate", endDate.format("YYYY-MM-DD"));
    
    if (periodType === "specific_month") {
      params.set("selectedYear", selectedYear.toString());
      params.set("selectedMonth", selectedMonth.toString());
    }

    navigate(`${createPageUrl("Clients")}?${params.toString()}`);
  };

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => clientApi.filter(),
  });

  const { data: attentionHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["attention-history"],
    queryFn: () => attentionHistoryApi.filter(),
  });

  const isLoading = clientsLoading || historyLoading;

  // Calcular rango de fechas según el tipo de período
  const dateRange = useMemo(() => {
    const today = moment();
    let startDate, endDate;

    switch (periodType) {
      case "current_month":
        startDate = moment().startOf("month");
        endDate = moment().endOf("month");
        break;
      case "specific_month":
        startDate = moment(`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`).startOf("month");
        endDate = startDate.clone().endOf("month");
        break;
      case "last_3_months":
        startDate = moment().subtract(3, "months").startOf("day");
        endDate = moment().endOf("day");
        break;
      case "last_6_months":
        startDate = moment().subtract(6, "months").startOf("day");
        endDate = moment().endOf("day");
        break;
      case "annual":
        startDate = moment().startOf("year");
        endDate = moment().endOf("year");
        break;
      default:
        startDate = moment().startOf("month");
        endDate = moment().endOf("month");
    }

    return { startDate, endDate };
  }, [periodType, selectedYear, selectedMonth]);

  const metrics = useMemo(() => {
    const { startDate, endDate } = dateRange;
    const today = moment().startOf("day");

    // MÉTRICA 1: Leads que requieren sesión hoy
    const leadsRequierenHoy = clients.filter(c => {
      const fechaProxima = c.fecha_proxima_sesion ? moment(c.fecha_proxima_sesion).startOf("day") : null;
      return (fechaProxima && fechaProxima.isSame(today, "day")) || c.estado === "Requiere nueva sesión";
    }).length;

    // MÉTRICA 2: Leads en seguimiento
    const leadsEnSeguimiento = clients.filter(c => c.estado === "En seguimiento").length;

    // MÉTRICA 3: Leads atendidos esta semana
    const hace7Dias = moment().subtract(7, "days").startOf("day");
    const leadsAtendidosSemana = attentionHistory.filter(h => 
      moment(h.fecha_atencion).isSameOrAfter(hace7Dias, "day")
    ).length;

    // MÉTRICA 4: Sesiones por servicio (dentro del período)
    const sesionesPorServicio = {};
    attentionHistory.forEach(h => {
      const fecha = moment(h.fecha_atencion);
      if (fecha.isBetween(startDate, endDate, "day", "[]")) {
        const servicio = h.servicio_realizado || "Sin especificar";
        sesionesPorServicio[servicio] = (sesionesPorServicio[servicio] || 0) + 1;
      }
    });

    // MÉTRICA 5 y 6: Tasa de continuidad y abandono
    // Filtrar tratamientos iniciados en el período seleccionado
    const tratamientosEnPeriodo = clients.filter(c => {
      const fechaRegistro = c.fecha_registro || c.created_date;
      return fechaRegistro && moment(fechaRegistro).isBetween(startDate, endDate, "day", "[]");
    });

    // Tratamientos evaluables
    const tratamientosEvaluables = tratamientosEnPeriodo.filter(c => {
      const sesionesCompletadas = c.numero_sesion_actual || 1;
      const fechaProxima = c.fecha_proxima_sesion ? moment(c.fecha_proxima_sesion).startOf("day") : null;
      return sesionesCompletadas >= 2 || (fechaProxima && fechaProxima.isBefore(today, "day"));
    });

    // Tratamientos que continuaron (>= 2 sesiones)
    const tratamientosContinuaron = tratamientosEnPeriodo.filter(c => 
      (c.numero_sesion_actual || 1) >= 2
    ).length;

    // Tratamientos abandonados: solo los que tienen estado "No continuó"
    const tratamientosAbandonados = tratamientosEnPeriodo.filter(c => 
      c.estado === "No continuó"
    ).length;

    // Tratamientos finalizados: solo los que tienen estado "Tratamiento finalizado"
    const tratamientosFinalizados = tratamientosEnPeriodo.filter(c => 
      c.estado === "Tratamiento finalizado"
    ).length;

    const tasaContinuidad = tratamientosEvaluables.length > 0 
      ? ((tratamientosContinuaron / tratamientosEvaluables.length) * 100).toFixed(1) 
      : 0;

    const tasaAbandono = tratamientosEvaluables.length > 0 
      ? ((tratamientosAbandonados / tratamientosEvaluables.length) * 100).toFixed(1) 
      : 0;

    const tasaFinalizacion = tratamientosEvaluables.length > 0 
      ? ((tratamientosFinalizados / tratamientosEvaluables.length) * 100).toFixed(1) 
      : 0;

    return {
      leadsRequierenHoy,
      leadsEnSeguimiento,
      leadsAtendidosSemana,
      sesionesPorServicio,
      tasaContinuidad,
      tasaAbandono,
      tasaFinalizacion,
      tratamientosEvaluables: tratamientosEvaluables.length,
      tratamientosContinuaron,
      tratamientosAbandonados,
      tratamientosFinalizados,
    };
  }, [clients, attentionHistory, dateRange]);

  const sesionesPorServicioData = Object.entries(metrics.sesionesPorServicio)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = moment.months();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-96" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Monitoreo Operacional</h1>
          <p className="text-sm text-muted-foreground mt-1">Seguimiento de continuidad y rendimiento de tratamientos</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={periodType} onValueChange={setPeriodType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PERIOD_TYPES).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {periodType === "specific_month" && (
            <>
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, idx) => (
                    <SelectItem key={idx} value={(idx + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all duration-200"
          onClick={() => handleMetricClick("requieren_hoy")}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Requieren Sesión Hoy</CardTitle>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.leadsRequierenHoy}</div>
            <p className="text-xs text-muted-foreground mt-1">Fecha hoy o estado requerido</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg hover:border-purple-400 transition-all duration-200"
          onClick={() => handleMetricClick("seguimiento")}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">En Seguimiento</CardTitle>
              <Activity className="w-4 h-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.leadsEnSeguimiento}</div>
            <p className="text-xs text-muted-foreground mt-1">Pacientes atendidos en seguimiento</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg hover:border-green-400 transition-all duration-200"
          onClick={() => handleMetricClick("atendidos_semana")}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Atendidos Esta Semana</CardTitle>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.leadsAtendidosSemana}</div>
            <p className="text-xs text-muted-foreground mt-1">Últimos 7 días</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg hover:border-emerald-400 transition-all duration-200"
          onClick={() => handleMetricClick("continuidad")}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tasa Continuidad</CardTitle>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.tasaContinuidad}%</div>
            <p className="text-xs text-muted-foreground mt-1">{metrics.tratamientosContinuaron} de {metrics.tratamientosEvaluables} evaluables</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg hover:border-red-400 transition-all duration-200"
          onClick={() => handleMetricClick("abandono")}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tasa Abandono</CardTitle>
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.tasaAbandono}%</div>
            <p className="text-xs text-muted-foreground mt-1">{metrics.tratamientosAbandonados} abandonos</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all duration-200"
          onClick={() => handleMetricClick("finalizacion")}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tasa Finalización</CardTitle>
              <Award className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.tasaFinalizacion}%</div>
            <p className="text-xs text-muted-foreground mt-1">{metrics.tratamientosFinalizados} finalizados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sesiones por Servicio</CardTitle>
          <p className="text-sm text-muted-foreground">
            Distribución de sesiones en el período seleccionado
          </p>
        </CardHeader>
        <CardContent>
          {sesionesPorServicioData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hay sesiones registradas en este período
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={sesionesPorServicioData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" name="Sesiones" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}