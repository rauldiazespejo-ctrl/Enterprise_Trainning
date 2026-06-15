// Aplicación principal CapacitaPro
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { CourseProvider } from '@/contexts/CourseContext';

// Páginas de autenticación
const Login = React.lazy(() => import('@/pages/auth/Login'));

// Páginas del Administrador
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard'));
const CourseManagement = React.lazy(() => import('@/pages/admin/CourseManagement'));
const CourseEditor = React.lazy(() => import('@/pages/admin/CourseEditor'));
const DocumentUpload = React.lazy(() => import('@/pages/admin/DocumentUpload'));
const EmployeeManagement = React.lazy(() => import('@/pages/admin/EmployeeManagement'));
const CertificateManagement = React.lazy(() => import('@/pages/admin/CertificateManagement'));
const Reports = React.lazy(() => import('@/pages/admin/Reports'));
const SettingsPage = React.lazy(() => import('@/pages/admin/Settings'));

// Páginas del Empleado
const EmployeeDashboard = React.lazy(() => import('@/pages/employee/EmployeeDashboard'));
const CourseViewer = React.lazy(() => import('@/pages/employee/CourseViewer'));
const EmployeeCertificates = React.lazy(() => import('@/pages/employee/EmployeeCertificates'));

// Panel Super Admin
const SuperAdminPanel = React.lazy(() => import('@/pages/super-admin/SuperAdminPanel'));

// Componente de protección de rutas
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredRole?: 'admin' | 'employee' | 'super_admin';
}> = ({ children, requiredRole }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // super_admin tiene acceso a todo
  if (user.role === 'super_admin') return <>{children}</>;

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace />;
  }

  return <>{children}</>;
};

// Redirección según rol
const RoleRedirect: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'super_admin') return <Navigate to="/super-admin" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace />;
};


// Loading Fallback para Suspense
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-400 font-medium">Cargando...</p>
    </div>
  </div>
);

// Rutas de la aplicación
const AppRoutes: React.FC = () => {
  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <Routes>
      {/* Ruta raíz */}
      <Route path="/" element={<RoleRedirect />} />

      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Rutas del Administrador */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/courses"
        element={
          <ProtectedRoute requiredRole="admin">
            <CourseManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/documents"
        element={
          <ProtectedRoute requiredRole="admin">
            <DocumentUpload />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/employees"
        element={
          <ProtectedRoute requiredRole="admin">
            <EmployeeManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/certificates"
        element={
          <ProtectedRoute requiredRole="admin">
            <CertificateManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute requiredRole="admin">
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute requiredRole="admin">
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/courses/:courseId/edit"
        element={
          <ProtectedRoute requiredRole="admin">
            <CourseEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/courses/:courseId/preview"
        element={
          <ProtectedRoute requiredRole="admin">
            <CourseViewer />
          </ProtectedRoute>
        }
      />
      <Route path="/admin/assignments" element={<Navigate to="/admin/employees" replace />} />

      {/* Ruta Super Admin */}
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute requiredRole="super_admin">
            <SuperAdminPanel />
          </ProtectedRoute>
        }
      />

      {/* Rutas del Empleado */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute requiredRole="employee">
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/course/:courseId"
        element={
          <ProtectedRoute requiredRole="employee">
            <CourseViewer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/certificates"
        element={
          <ProtectedRoute requiredRole="employee">
            <EmployeeCertificates />
          </ProtectedRoute>
        }
      />
      <Route path="/employee/courses" element={<Navigate to="/employee" replace />} />
      <Route path="/employee/profile" element={<Navigate to="/employee" replace />} />

      {/* 404 */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-slate-900 mb-4">404</h1>
              <p className="text-xl text-slate-600 mb-6">Página no encontrada</p>
              <a href="/" className="text-blue-600 hover:text-blue-700">
                Volver al inicio
              </a>
            </div>
          </div>
        }
      />
    </Routes>
    </React.Suspense>
  );
};

// Componente App principal
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CourseProvider>
          <AppRoutes />
        </CourseProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
