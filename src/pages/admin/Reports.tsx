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
} from 'lucide-react';

const Reports: React.FC = () => {
  // Datos de ejemplo para gráficos
  const completionData = [
    { month: 'Ene', completed: 12, enrolled: 45 },
    { month: 'Feb', completed: 18, enrolled: 52 },
    { month: 'Mar', completed: 25, enrolled: 48 },
    { month: 'Abr', completed: 22, enrolled: 55 },
    { month: 'May', completed: 30, enrolled: 60 },
    { month: 'Jun', completed: 28, enrolled: 58 }
  ];

  const departmentData = [
    { department: 'Ventas', courses: 15, employees: 8 },
    { department: 'Marketing', courses: 12, employees: 6 },
    { department: 'TI', courses: 20, employees: 10 },
    { department: 'RH', courses: 8, employees: 4 },
    { department: 'Finanzas', courses: 10, employees: 5 }
  ];

  // Componente simple de gráfico de barras
  const SimpleBarChart = ({ data, dataKey, fill }: { data: any[]; dataKey: string; fill: string }) => (
    <div className="flex items-end justify-around h-48 gap-2">
      {data.map((item, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <div
            className="w-12 rounded-t-lg transition-all hover:opacity-80"
            style={{
              height: `${(item[dataKey] / Math.max(...data.map(d => d[dataKey]))) * 160}px`,
              backgroundColor: fill
            }}
          />
          <span className="text-xs text-slate-400 mt-2">{item.department}</span>
        </div>
      ))}
    </div>
  );

  // Componente simple de gráfico de línea
  const SimpleLineChart = ({ data }: { data: any[] }) => (
    <div className="h-48 flex items-end justify-around gap-4">
      {data.map((item, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <div className="flex gap-2">
            <div
              className="w-6 rounded-t-lg transition-all hover:opacity-80"
              style={{
                height: `${(item.enrolled / Math.max(...data.map(d => d.enrolled))) * 100}px`,
                backgroundColor: '#6366F1'
              }}
            />
            <div
              className="w-6 rounded-t-lg transition-all hover:opacity-80"
              style={{
                height: `${(item.completed / Math.max(...data.map(d => d.completed))) * 100}px`,
                backgroundColor: '#10B981'
              }}
            />
          </div>
          <span className="text-xs text-slate-400 mt-2">{item.month}</span>
        </div>
      ))}
    </div>
  );

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
              <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">25</p>
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
                <p className="text-2xl font-bold text-white">135</p>
                <p className="text-sm text-slate-400">Inscripciones Totales</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">78%</p>
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
                <p className="text-2xl font-bold text-white">42</p>
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
                <div className="w-3 h-3 bg-indigo-500 rounded"></div>
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
              <tbody>
                <tr className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 avatar">AM</div>
                      <span className="font-medium text-white">Ana Martínez</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">Tecnología</td>
                  <td className="px-4 py-3 text-sm text-slate-300">8</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-semibold">95%</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">6</td>
                </tr>
                <tr className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 avatar">JP</div>
                      <span className="font-medium text-white">Juan Pérez</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">Marketing</td>
                  <td className="px-4 py-3 text-sm text-slate-300">5</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-semibold">88%</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">4</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 avatar">MG</div>
                      <span className="font-medium text-white">María García</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">Ventas</td>
                  <td className="px-4 py-3 text-sm text-slate-300">3</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-semibold">92%</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">2</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-3 glass rounded-xl">
              <div className="p-2 bg-emerald-500/20 rounded-xl">
                <Award className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">María García completó "Fundamentos de Gestión"</p>
                <p className="text-xs text-slate-400">Hace 2 horas</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 glass rounded-xl">
              <div className="p-2 bg-indigo-500/20 rounded-xl">
                <BookOpen className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Juan Pérez se inscribió en "Excel Avanzado"</p>
                <p className="text-xs text-slate-400">Hace 5 horas</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 glass rounded-xl">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <TrendingUp className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Ana Martínez obtuvo puntuación del 98% en quiz</p>
                <p className="text-xs text-slate-400">Hace 1 día</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Reports;