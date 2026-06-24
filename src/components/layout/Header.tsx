import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Search, Menu, QrCode, Sun, Moon } from 'lucide-react';
import AppAccessQR from '@/components/ui/AppAccessQR';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { db } from '@/lib/supabase';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, onMenuClick }) => {
  const { user, isSuperAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [showQrAccess, setShowQrAccess] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await db.getNotifications(user.id);
    if (data) setNotifications(data);
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) loadNotifications();
  }, [user?.id, loadNotifications]);

  useEffect(() => {
    if (!showNotifications) return;
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifications]);

  const handleMarkAsRead = async (id: string) => {
    await db.markNotificationAsRead(id);
    loadNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const roleLabel = isSuperAdmin
    ? 'Super Admin'
    : user?.role === 'admin'
    ? 'Administrador'
    : 'Empleado';

  const roleDotClass = isSuperAdmin
    ? 'bg-accent'
    : user?.role === 'admin'
    ? 'bg-primary'
    : 'bg-emerald-500';

  return (
    <header className="header-frosted px-6 py-3.5 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Left: menu + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors shrink-0 focus-ring tap-target-min"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 animate-fadeIn">
            <h1 className="text-xl font-bold text-foreground leading-tight truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right: search + actions + user */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-muted/40 rounded-xl border border-border focus-within:border-brand/40 focus-within:bg-muted/60 focus-within:shadow-[0_0_20px_hsl(var(--brand)/0.08)] transition-all min-h-[44px]">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
            <input
              type="text"
              placeholder="Buscar..."
              aria-label="Buscar en la plataforma"
              className="bg-transparent border-none outline-none text-sm w-44 lg:w-56 text-foreground placeholder:text-muted-foreground/60"
            />
          </div>

          {/* QR Access */}
          <button
            onClick={() => setShowQrAccess(true)}
            className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors focus-ring tap-target-min"
            aria-label="QR de acceso"
            title="QR de acceso"
          >
            <QrCode className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors focus-ring tap-target-min"
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" aria-hidden="true" /> : <Moon className="w-5 h-5" aria-hidden="true" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(v => !v)}
              className="relative p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors focus-ring tap-target-min"
              aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
            >
              <Bell className="w-5 h-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full ring-2 ring-card" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-popover/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Notificaciones</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Sin notificaciones
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => { if (!n.read) handleMarkAsRead(n.id); }}
                        className={`px-4 py-3 border-b border-border/50 hover:bg-muted cursor-pointer transition-colors ${!n.read ? 'bg-brand/5' : 'opacity-60'}`}
                      >
                        <p className={`text-sm ${!n.read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                        <p className="text-xs text-muted-foreground/80 mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User pill */}
          <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 border border-border rounded-xl hover:border-border/80 transition-all duration-200 min-h-[44px]">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-primary/80 flex items-center justify-center text-primary-foreground text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${roleDotClass} ring-2 ring-card`} />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-foreground leading-tight">{user?.name?.split(' ')[0]}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{roleLabel}</p>
            </div>
          </div>
        </div>
      </div>
      <AppAccessQR isOpen={showQrAccess} onClose={() => setShowQrAccess(false)} />
    </header>
  );
};

export default Header;
