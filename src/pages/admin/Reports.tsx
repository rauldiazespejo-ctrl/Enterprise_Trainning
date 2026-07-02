// Reportes del Administrador - Modern Dark Theme
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, Button } from '@/components/ui/Card';
import {
  Download,
  TrendingUp,
  Users,
  BookOpen,
  Award,
  Calendar,
  Filter,
  ArrowRight
, CheckCircle, Clock } from 'lucide-react';

import { db } from '@/lib/supabase';

const Reports: React.FC = () => {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      const { data: reportData } = await db.getReportsData();
      if (mounted && reportData) {
        setData(reportData);
        setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, []);

  if (loading || !data) {
    return (
      <MainLayout title="Reportes" subtitle="Estadísticas y análisis de la plataforma" isAdmin>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
        </div>
      </MainLayout>
    );
  }

  const { completionData, departmentData, topPerformers, activeCourses, totalEmployees, totalCertificates, completionRate, recentActivity } = data;


  // Componente simple de gráfico de barras
  const SimpleBarChart = ({ data, dataKey, fill }: { data: any[]; dataKey: string; fill: string }) => {
    if (!data || data.length === 0) return (
      <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Sin datos disponibles</div>
    );
    const maxVal = Math.max(...data.map(d => d[dataKey]), 1);
    return (
    <div className="flex items-end justify-around h-48 gap-2">
      {data.map((item, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <div
            className="w-12 rounded-t-lg transition-all hover:opacity-80"
            style={{
              height: `${(item[dataKey] / maxVal) * 160}px`,
              backgroundColor: fill
            }}
          />
          <span className="text-xs text-slate-400 mt-2">{item.department}</span>
        </div>
      ))}
    </div>
    );
  };

  // Componente simple de gráfico de línea
  const SimpleLineChart = ({ data }: { data: any[] }) => {
    if (!data || data.length === 0) return (
      <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Sin datos disponibles</div>
    );
    const maxEnrolled = Math.max(...data.map(d => d.enrolled), 1);
    const maxCompleted = Math.max(...data.map(d => d.completed), 1);
    return (
    <div className="h-48 flex items-end justify-around gap-4">
      {data.map((item, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <div className="flex gap-2">
            <div
              className="w-6 rounded-t-lg transition-all hover:opacity-80"
              style={{
                height: `${(item.enrolled / maxEnrolled) * 100}px`,
                backgroundColor: 'hsl(var(--brand))'
              }}
            />
            <div
              className="w-6 rounded-t-lg transition-all hover:opacity-80"
              style={{
                height: `${(item.completed / maxCompleted) * 100}px`,
                backgroundColor: '#10B981'
              }}
            />
          </div>
          <span className="text-xs text-slate-400 mt-2">{item.month}</span>
        </div>
      ))}
    </div>
    );
  };

  return (
    <MainLayout title="Reportes" subtitle="Estadísticas y análisis de la plataforma" isAdmin>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost">
              <Calendar className="w-4 h-4" />
              Últimos 6 meses
            </Button>
            <Button variant="ghost">
              <Filter className="w-4 h-4" />
              Filtrar
            </Button>
          </div>
          <Button className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar Reporte
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand/15 rounded-xl text-brand">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalEmployees}</p>
                <p className="text-sm text-slate-400">Empleados Activos</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{activeCourses}</p>
                <p className="text-sm text-slate-400">Inscripciones Totales</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand/15 rounded-xl text-brand">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{completionRate}%</p>
                <p className="text-sm text-slate-400">Tasa de Completación</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalCertificates}</p>
                <p className="text-sm text-slate-400">Certificados Emitidos</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Completion Trend */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Tendencia de Inscripciones vs Completados</h3>
            <SimpleLineChart data={completionData} />
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-brand rounded"></div>
                <span className="text-sm text-slate-400">Inscritos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                <span className="text-sm text-slate-400">Completados</span>
              </div>
            </div>
          </Card>

          {/* Department Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Distribución por Departamento</h3>
            <SimpleBarChart data={departmentData} dataKey="courses" fill="#6366F1" />
          </Card>
        </div>

        {/* Top Performers */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Empleados con Mejor Desempeño</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Empleado</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Departamento</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Cursos Completados</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Promedio</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Certificados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {topPerformers.map((perf: any) => (
                  <tr key={perf.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 avatar">{perf.initials}</div>
                        <span className="font-medium text-white">{perf.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{perf.department}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{perf.courses}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-semibold">{perf.score}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{perf.certs}</td>
                  </tr>
                ))}
                {(!topPerformers || topPerformers.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
                      Sin datos de desempeño disponibles
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            {recentActivity && recentActivity.length > 0 ? recentActivity.map((act: any) => (
              <div key={act.id} className="flex items-center gap-4 p-3 glass rounded-xl">
                <div className={`p-2 rounded-xl ${act.icon === 'CheckCircle' ? 'bg-emerald-500/20 text-emerald-400' : act.icon === 'Award' ? 'bg-brand/15 text-brand' : 'bg-purple-500/20 text-purple-400'}`}>
                  {act.icon === 'CheckCircle' && <CheckCircle className="w-4 h-4" />}
                  {act.icon === 'Award' && <Award className="w-4 h-4" />}
                  {act.icon === 'Clock' && <TrendingUp className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{act.user} {act.detail}</p>
                  <p className="text-xs text-slate-400">{act.time}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-500 text-center py-4">Sin actividad reciente</p>
            )}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Reports;