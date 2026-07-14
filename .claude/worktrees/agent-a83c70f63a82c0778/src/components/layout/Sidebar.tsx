// Componente Sidebar - Premium Dark Theme con logo original SoldesP
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  BookOpen,
  Users,
  Award,
  Settings,
  LogOut,
  FileText,
  BarChart3,
  UserCheck,
  Sparkles,
  GraduationCap,
  Crown,
  Shield,
  LayoutGrid
} from 'lucide-react';
import { SoldesPLogoSmall } from '@/components/SoldesPLogo';

interface SidebarProps {
  isAdmin?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isAdmin = false }) => {
  const { user, logout, isSuperAdmin } = useAuth();
  const location = useLocation();

  const adminLinks = [
    { path: '/admin', icon: Home, label: 'Dashboard' },
    { path: '/admin/courses', icon: BookOpen, label: 'Cursos' },
    { path: '/admin/employees', icon: Users, label: 'Empleados' },
    { path: '/admin/assignments', icon: UserCheck, label: 'Asignaciones' },
    { path: '/admin/certificates', icon: Award, label: 'Certificados' },
    { path: '/admin/reports', icon: BarChart3, label: 'Reportes' },
    { path: '/admin/matrix', icon: LayoutGrid, label: 'Matriz' },
    { path: '/admin/documents', icon: FileText, label: 'Documentos' },
    { path: '/admin/settings', icon: Settings, label: 'Configuración' }
  ];

  const employeeLinks = [
    { path: '/employee', icon: Home, label: 'Mi Aprendizaje' },
    { path: '/employee/courses', icon: BookOpen, label: 'Mis Cursos' },
    { path: '/employee/certificates', icon: Award, label: 'Certificados' },
    { path: '/employee/profile', icon: Settings, label: 'Mi Perfil' }
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  return (
    <aside className="w-72 bg-[#111827] text-white min-h-screen flex flex-col border-r border-[rgba(209,95,61,0.15)] relative overflow-hidden">
      {/* Decorative Top Gradient */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[rgba(209,95,61,0.1)] to-transparent pointer-events-none" />

      {/* Logo Header */}
      <div className="p-6 border-b border-[rgba(255,255,255,0.05)] relative">
        <div className="flex items-center gap-4">
          {/* Logo Original SoldesP */}
          <div className="relative w-24 shrink-0">
            <SoldesPLogoSmall size={96} />
          </div>

          <div className="flex-1">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="gradient-text">CapacitaPro</span>
            </h1>
            <p className="text-xs text-[#9CA3AF] flex items-center gap-2 mt-1">
              <Sparkles className="w-3 h-3 text-[#D15F3D]" />
              {isAdmin ? 'Panel de Administración' : 'Portal del Empleado'}
            </p>
          </div>
        </div>

        {/* Powered by SoldesP */}
        <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-[rgba(0,27,75,0.3)] rounded-lg border border-[rgba(0,27,75,0.5)]">
          <div className="w-2 h-2 bg-[#D15F3D] rounded-full animate-pulse" />
          <span className="text-[10px] text-[#9CA3AF] font-medium tracking-wider uppercase">Powered by SoldesP</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {/* Super Admin Section */}
        {isSuperAdmin && (
          <div className="mb-4">
            <p className="text-[10px] text-yellow-500 font-semibold uppercase tracking-wider px-4 mb-2 flex items-center gap-1">
              <Crown className="w-3 h-3" /> Super Admin
            </p>
            <ul className="space-y-1">
              <li>
                <Link
                  to="/super-admin"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    location.pathname === '/super-admin'
                      ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-black shadow-lg shadow-yellow-500/30'
                      : 'text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${location.pathname === '/super-admin' ? 'bg-black/20' : 'bg-yellow-500/10 group-hover:bg-yellow-500/20'}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Gestión de Admins</span>
                  {location.pathname === '/super-admin' && <div className="ml-auto w-1.5 h-1.5 bg-black rounded-full" />}
                </Link>
              </li>
            </ul>
          </div>
        )}

        <div className="mb-4">
          <p className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider px-4 mb-2">Menú Principal</p>
          <ul className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;

              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-[#D15F3D] to-[#B34E2D] text-white shadow-lg shadow-[rgba(209,95,61,0.3)]'
                        : 'text-[#9CA3AF] hover:bg-[rgba(209,95,61,0.1)] hover:text-white'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20' : 'bg-[rgba(0,27,75,0.3)] group-hover:bg-[rgba(209,95,61,0.2)]'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium">{link.label}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-[rgba(255,255,255,0.05)]">
        {/* User Card */}
        <div className="flex items-center gap-3 p-3 bg-[rgba(0,27,75,0.3)] rounded-xl border border-[rgba(0,27,75,0.5)] mb-3">
          <div className="w-11 h-11 avatar text-sm border-2 border-[#D15F3D]">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm truncate">{user?.name}</p>
            <p className="text-xs text-[#9CA3AF] truncate">{user?.email}</p>
          </div>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-4 py-3 text-[#9CA3AF] hover:text-white hover:bg-[rgba(239,68,68,0.1)] rounded-xl transition-all duration-200 border border-transparent hover:border-[rgba(239,68,68,0.3)]"
        >
          <div className="p-1.5 bg-[rgba(239,68,68,0.1)] rounded-lg">
            <LogOut className="w-4 h-4 text-red-400" />
          </div>
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>

      {/* Bottom Brand */}
      <div className="p-4 border-t border-[rgba(255,255,255,0.05)] bg-[rgba(0,27,75,0.2)]">
        <div className="flex items-center justify-center gap-2 text-[#64748B]">
          <GraduationCap className="w-4 h-4 text-[#D15F3D]" />
          <span className="text-xs">© 2026 SoldesP</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
