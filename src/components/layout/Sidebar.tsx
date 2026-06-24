import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Home, BookOpen, Users, Award, Settings, LogOut, FileText, FolderOpen,
  BarChart3, UserCheck, GraduationCap, Crown, Shield, LayoutGrid, RefreshCw,
  Sun, Moon,
} from 'lucide-react';
import { SoldesPLogoSmall } from '@/components/SoldesPLogo';

interface SidebarProps {
  isAdmin?: boolean;
}

const adminLinks = [
  { path: '/admin',              icon: Home,       label: 'Dashboard'     },
  { path: '/admin/courses',      icon: BookOpen,   label: 'Cursos'        },
  { path: '/admin/employees',    icon: Users,      label: 'Empleados'     },
  { path: '/admin/assignments',  icon: UserCheck,  label: 'Asignaciones'  },
  { path: '/admin/certificates', icon: Award,      label: 'Certificados'  },
  { path: '/admin/reports',      icon: BarChart3,  label: 'Reportes'      },
  { path: '/admin/matrix',       icon: LayoutGrid, label: 'Matriz'        },
  { path: '/admin/repository',   icon: FolderOpen, label: 'Repositorio'   },
  { path: '/admin/documents',    icon: FileText,   label: 'Documentos'    },
  { path: '/admin/settings',     icon: Settings,   label: 'Configuración' },
  { path: '/admin/sync',         icon: RefreshCw,  label: 'Sincronización'},
];

const employeeLinks = [
  { path: '/employee',              icon: Home,     label: 'Mi Aprendizaje' },
  { path: '/employee/courses',      icon: BookOpen, label: 'Mis Cursos'     },
  { path: '/employee/certificates', icon: Award,    label: 'Certificados'   },
  { path: '/employee/profile',      icon: Settings, label: 'Mi Perfil'      },
];

const Sidebar: React.FC<SidebarProps> = ({ isAdmin = false }) => {
  const { user, logout, isSuperAdmin } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const links = isAdmin ? adminLinks : employeeLinks;

  const roleLabel = isSuperAdmin ? 'Super Admin' : isAdmin ? 'Administrador' : 'Empleado';
  const roleBadgeClass = isSuperAdmin
    ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
    : isAdmin
    ? 'bg-primary/15 text-primary border-primary/30'
    : 'bg-muted text-muted-foreground border-border';

  return (
    <aside className="sidebar-root w-64 flex flex-col min-h-screen select-none bg-background">
      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-3 border-b border-border animate-fadeIn">
        <div className="shrink-0">
          <SoldesPLogoSmall size={44} />
        </div>
        <div>
          <p className="text-[15px] font-bold tracking-tight text-foreground leading-tight">
            Capacita<span className="text-brand">Pro</span>
          </p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">
            {isAdmin ? 'Administración' : 'Portal Empleado'}
          </p>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">

        {/* Super Admin */}
        {isSuperAdmin && (
          <div>
            <p className="sidebar-section-label flex items-center gap-1.5">
              <Crown className="w-3 h-3 text-yellow-500" /> Super Admin
            </p>
            <ul className="space-y-0.5">
              <li>
                <Link
                  to="/super-admin"
                  className={`sidebar-item ${location.pathname === '/super-admin' ? 'sidebar-item-active sidebar-item-active--gold' : 'text-yellow-400/80 hover:text-yellow-300 hover:bg-yellow-500/8'}`}
                >
                  <span className={`sidebar-icon ${location.pathname === '/super-admin' ? 'bg-black/20' : 'bg-yellow-500/10'}`}>
                    <Shield className="w-4 h-4" />
                  </span>
                  <span>Gestión de Admins</span>
                </Link>
              </li>
            </ul>
          </div>
        )}

        {/* Main Links */}
        <div>
          <p className="sidebar-section-label">Navegación</p>
          <ul className="space-y-0.5 stagger-children">
            {links.map(({ path, icon: Icon, label }) => {
              const active = location.pathname === path;
              return (
                <li key={path}>
                  <Link
                    to={path}
                    className={`sidebar-item ${active ? 'sidebar-item-active sidebar-glow-active' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                  >
                    <span className={`sidebar-icon ${active ? 'bg-primary-foreground/20' : 'bg-foreground/[0.04] hover:bg-primary/10'}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span>{label}</span>
                    {active && <span className="sidebar-active-dot" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* ── User ─────────────────────────────────────────────────── */}
      <div className="px-3 pb-4 border-t border-border/50 pt-4 space-y-2">
        {/* User card */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/50 border border-border hover:border-border/80 transition-all duration-200 min-h-[52px]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-primary/80 flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">{user?.name}</p>
            <span className={`inline-flex items-center mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${roleBadgeClass}`}>
              {roleLabel}
            </span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="sidebar-item w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 focus-ring"
          aria-label="Cerrar sesión"
        >
          <span className="sidebar-icon bg-destructive/10">
            <LogOut className="w-4 h-4 text-destructive/70" aria-hidden="true" />
          </span>
          <span>Cerrar Sesión</span>
        </button>
      </div>

      {/* ── Footer brand + theme ─────────────────────────────────── */}
      <div className="px-5 py-3 border-t border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5 text-brand/60" />
          <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
            © 2026 SoldesP
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/80 uppercase tracking-wider">
          {theme === 'dark' ? (
            <>
              <Moon className="w-3 h-3 text-secondary" aria-hidden="true" />
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              Oscuro
            </>
          ) : (
            <>
              <Sun className="w-3 h-3 text-accent" aria-hidden="true" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Claro
            </>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
