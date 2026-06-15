// Componente Header - Modern Dark Theme
import React, { useState, useEffect } from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/supabase';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, onMenuClick }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadNotifications = async () => {
    if (!user?.id) return;
    const { data } = await db.getNotifications(user.id);
    if (data) setNotifications(data);
  };

  const handleMarkAsRead = async (id: string) => {
    await db.markNotificationAsRead(id);
    loadNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-[var(--color-bg-secondary)] border-b border-slate-700/50 px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-tertiary)] rounded-xl border border-slate-700/50 focus-within:border-indigo-500/50 transition-colors">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-transparent border-none outline-none text-sm w-48 text-slate-300 placeholder-slate-500"
            />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[var(--color-bg-secondary)] border border-slate-700 rounded-xl shadow-lg overflow-hidden z-50">
                <div className="p-3 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-400">
                      No hay notificaciones
                    </div>
                  ) : (
                    notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        onClick={() => {
                          if (!notification.read) handleMarkAsRead(notification.id);
                        }}
                        className={`p-3 border-b border-slate-700/50 hover:bg-slate-800/50 cursor-pointer transition-colors ${!notification.read ? 'bg-slate-800/30' : 'opacity-70'}`}
                      >
                        <p className={`text-sm ${!notification.read ? 'font-medium text-white' : 'text-slate-300'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Avatar */}
          <div className="flex items-center gap-3 p-2 pl-3 glass rounded-xl">
            <div className="w-9 h-9 avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block">
              <p className="font-medium text-sm text-white">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.role === 'admin' ? 'Administrador' : 'Empleado'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
