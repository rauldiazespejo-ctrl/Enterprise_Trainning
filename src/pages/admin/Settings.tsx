// Configuración del Sistema
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, Button, Input, Select, Badge, Modal } from '@/components/ui/Card';
import { isAIConfigured, testDeepSeekConnection } from '@/lib/aiGenerator';
import {
  Settings,
  Database,
  Bell,
  Shield,
  Save,
  TestTube,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [supabaseConfig, setSupabaseConfig] = useState({
    url: '',
    anonKey: ''
  });

  // Configuración de IA (DeepSeek)
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  const testAI = async () => {
    setAiTesting(true);
    setAiTestResult(null);
    const result = await testDeepSeekConnection();
    setAiTestResult(result);
    setAiTesting(false);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'ai', label: 'Inteligencia Artificial', icon: Sparkles },
    { id: 'database', label: 'Base de Datos', icon: Database },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'security', label: 'Seguridad', icon: Shield }
  ];

  return (
    <MainLayout title="Configuración" subtitle="Configuración del sistema" isAdmin>
      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-64">
          <Card className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Configuración General</h3>
                <div className="space-y-4">
                  <Input
                    label="Nombre de la Organización"
                    defaultValue="Mi Empresa"
                    placeholder="Nombre de tu organización"
                  />
                  <Input
                    label="Email de Contacto"
                    type="email"
                    defaultValue="capacitacion@empresa.com"
                    placeholder="Email de contacto"
                  />
                  <Select
                    label="Zona Horaria"
                    defaultValue="America/Mexico_City"
                    options={[
                      { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
                      { value: 'America/New_York', label: 'Nueva York (GMT-5)' },
                      { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' }
                    ]}
                  />
                  <Select
                    label="Idioma"
                    defaultValue="es"
                    options={[
                      { value: 'es', label: 'Español' },
                      { value: 'en', label: 'English' }
                    ]}
                  />
                </div>
                <div className="mt-6 flex justify-end">
                  <Button>
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Preferencias de Cursos</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">Certificados Automáticos</p>
                      <p className="text-sm text-slate-500">Emitir certificados automáticamente al completar</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">Forzar Evaluación Final</p>
                      <p className="text-sm text-slate-500">Requerir evaluación final para obtener certificado</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <Input
                    label="Puntuación Mínima para Aprobar (%)"
                    type="number"
                    defaultValue="70"
                    placeholder="70"
                  />
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Generación de Cursos con IA (DeepSeek)</h3>
                  <Badge variant={isAIConfigured() ? 'success' : 'warning'}>
                    {isAIConfigured() ? 'Configurada' : 'No configurada'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 mb-4">
                  La generación se ejecuta mediante una función segura de Supabase. La clave de
                  DeepSeek nunca se guarda ni se expone en el navegador.
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <Button variant="outline" onClick={testAI} disabled={!isAIConfigured() || aiTesting}>
                    <TestTube className="w-4 h-4" />
                    {aiTesting ? 'Probando...' : 'Probar Conexión'}
                  </Button>
                </div>

                {aiTestResult && (
                  <div className={`mt-4 flex items-center gap-2 p-3 rounded-lg ${aiTestResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                    {aiTestResult.success ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-700">Conexión exitosa con DeepSeek</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-sm text-red-700">Error: {aiTestResult.error}</span>
                      </>
                    )}
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Configuración segura</h3>
                <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                  <li>Configura las variables públicas de Supabase en el entorno del frontend.</li>
                  <li>Despliega la función <code className="bg-slate-100 px-1 rounded">generate-course</code>.</li>
                  <li>Guarda <code className="bg-slate-100 px-1 rounded">DEEPSEEK_API_KEY</code> como secreto de Supabase.</li>
                </ol>
                <p className="text-xs text-slate-400 mt-4">
                  Los documentos se envían a la función segura y desde allí al proveedor de IA.
                </p>
              </Card>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Configuración de Supabase</h3>
                  <Badge variant={supabaseConfig.url ? 'success' : 'warning'}>
                    {supabaseConfig.url ? 'Conectado' : 'No configurado'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 mb-4">
                  Conecta tu base de datos de Supabase para almacenar usuarios, cursos y certificados de forma persistente.
                </p>
                <div className="space-y-4">
                  <Input
                    label="Supabase URL"
                    value={supabaseConfig.url}
                    onChange={(e) => setSupabaseConfig({ ...supabaseConfig, url: e.target.value })}
                    placeholder="https://your-project.supabase.co"
                  />
                  <Input
                    label="Anon Key (clave pública)"
                    value={supabaseConfig.anonKey}
                    onChange={(e) => setSupabaseConfig({ ...supabaseConfig, anonKey: e.target.value })}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  />
                </div>
                <div className="mt-6 flex items-center gap-4">
                  <Button onClick={() => setShowSupabaseModal(true)}>
                    <Database className="w-4 h-4" />
                    Configurar Base de Datos
                  </Button>
                  <Button variant="outline">
                    <TestTube className="w-4 h-4" />
                    Probar Conexión
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Base de Datos Local (Desarrollo)</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Actualmente la aplicación funciona con datos de demostración en memoria. Para persistencia real, configura Supabase.
                </p>
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700">Datos de demostración activos</span>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'notifications' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Configuración de Notificaciones</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Email de Bienvenida</p>
                    <p className="text-sm text-slate-500">Enviar email cuando un empleado se registre</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Recordatorio de Cursos</p>
                    <p className="text-sm text-slate-500">Enviar recordatorios cuando un curso esté próximo a vencer</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Notificación de Certificados</p>
                    <p className="text-sm text-slate-500">Notificar cuando se emita un nuevo certificado</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button>
                  <Save className="w-4 h-4" />
                  Guardar
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Configuración de Seguridad</h3>
              <div className="space-y-4">
                <Input
                  label="Tiempo de Sesión (minutos)"
                  type="number"
                  defaultValue="480"
                  placeholder="480"
                />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Autenticación de Dos Factores</p>
                    <p className="text-sm text-slate-500">Requerir 2FA para administradores</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button>
                  <Shield className="w-4 h-4" />
                  Actualizar Seguridad
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Supabase Setup Modal */}
      <Modal
        isOpen={showSupabaseModal}
        onClose={() => setShowSupabaseModal(false)}
        title="Configurar Supabase"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">¿Cómo obtener tus credenciales?</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              {/* Security: rel="noopener noreferrer" added to prevent reverse tabnabbing on target="_blank" links */}
              <li>Ve a <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a> y crea una cuenta</li>
              <li>Crea un nuevo proyecto</li>
              <li>En Settings → API, copia la URL y la clave anon</li>
              <li>Pega ambas credenciales aquí</li>
            </ol>
          </div>

          <Input
            label="Project URL"
            placeholder="https://xxxxx.supabase.co"
          />
          <Input
            label="anon public key"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowSupabaseModal(false)}>
              Cancelar
            </Button>
            <Button>
              Guardar Configuración
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default SettingsPage;
