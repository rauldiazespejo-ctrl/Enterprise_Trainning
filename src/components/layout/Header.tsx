import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Search, Menu, QrCode } from 'lucide-react';
import AppAccessQR from '@/components/ui/AppAccessQR';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/supabase';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, onMenuClick }) => {
  const { user, isSuperAdmin } = useAuth();
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
    ? 'bg-yellow-400'
    : user?.role === 'admin'
    ? 'bg-[#D15F3D]'
    : 'bg-emerald-400';

  return (
    <header className="header-frosted px-6 py-3.5 sticky top-0 z-40">
      <div className="flex items-center justify-between gap-4">
        {/* Left: menu + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors shrink-0"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0 animate-fadeIn">
            <h1 className="text-xl font-bold text-white leading-tight truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right: search + bell + user */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-white/[0.03] rounded-xl border border-white/[0.06] focus-within:border-[#D15F3D]/40 focus-within:bg-white/[0.06] focus-within:shadow-[0_0_20px_rgba(209,95,61,0.08)] transition-all">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-transparent border-none outline-none text-sm w-40 text-slate-300 placeholder-slate-600"
            />
          </div>

          {/* QR Access */}
          <button
            onClick={() => setShowQrAccess(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
            aria-label="QR de acceso"
            title="QR de acceso"
          >
            <QrCode className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(v => !v)}
              className="relative p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
              aria-label="Notificaciones"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D15F3D] rounded-full ring-2 ring-[#111827]" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[#1a2233]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                      Sin notificaciones
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => { if (!n.read) handleMarkAsRead(n.id); }}
                        className={`px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.04] cursor-pointer transition-colors ${!n.read ? 'bg-[#D15F3D]/[0.05]' : 'opacity-60'}`}
                      >
                        <p className={`text-sm ${!n.read ? 'font-medium text-white' : 'text-slate-400'}`}>{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User pill */}
          <div className="flex items-center gap-2.5 px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl hover:border-white/[0.12] transition-all duration-200">
            <div className="relative">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#D15F3D] to-[#B34E2D] flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${roleDotClass} ring-2 ring-[#111827]`} />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-white leading-tight">{user?.name?.split(' ')[0]}</p>
              <p className="text-[10px] text-slate-500 leading-tight">{roleLabel}</p>
            </div>
          </div>
        </div>
      </div>
      <AppAccessQR isOpen={showQrAccess} onClose={() => setShowQrAccess(false)} />
    </header>
  );
};

export default Header;
