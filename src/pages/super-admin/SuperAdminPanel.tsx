// Panel exclusivo para Super Administrador
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import {
  Shield, Users, Crown, UserCheck, UserX, KeyRound,
  RefreshCw, CheckCircle, XCircle, AlertTriangle, Eye, EyeOff
} from 'lucide-react';
import type { User } from '@/types';

const SuperAdminPanel: React.FC = () => {
  const { user, isSuperAdmin, promoteToAdmin, demoteToEmployee, resetUserPassword, getAllUsers } = useAuth();
  const navigate = useNavigate();

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'admin' | 'employee' | 'super_admin'>('all');
  const [search, setSearch] = useState('');
  const [actionResult, setActionResult] = useState<{ msg: string; ok: boolean } | null>(null);

  // Reset password modal
  const [pwModal, setPwModal] = useState<{ userId: string; userName: string } | null>(null);
  const [newPw, setNewPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isSuperAdmin) { navigate('/admin'); return; }
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  const loadUsers = async () => {
    setIsLoading(true);
    const list = await getAllUsers();
    setAllUsers(list);
    setIsLoading(false);
  };

  const showResult = (msg: string, ok: boolean) => {
    setActionResult({ msg, ok });
    setTimeout(() => setActionResult(null), 4000);
  };

  const handlePromote = async (u: User) => {
    setActionLoading(u.id);
    const res = await promoteToAdmin(u.id);
    if (res.success) {
      showResult(`✓ ${u.name} promovido a Admin`, true);
      await loadUsers();
    } else {
      showResult(`Error: ${res.error}`, false);
    }
    setActionLoading(null);
  };

  const handleDemote = async (u: User) => {
    setActionLoading(u.id);
    const res = await demoteToEmployee(u.id);
    if (res.success) {
      showResult(`✓ ${u.name} es ahora Empleado`, true);
      await loadUsers();
    } else {
      showResult(`Error: ${res.error}`, false);
    }
    setActionLoading(null);
  };

  const handleResetPw = async () => {
    if (!pwModal || !newPw.trim()) return;
    setActionLoading(pwModal.userId);
    const res = await resetUserPassword(pwModal.userId, newPw);
    if (res.success) {
      showResult(`✓ Contraseña de ${pwModal.userName} actualizada`, true);
    } else {
      showResult(`Error: ${res.error}`, false);
    }
    setPwModal(null);
    setNewPw('');
    setActionLoading(null);
  };

  const filtered = allUsers.filter(u => {
    const matchRole = filter === 'all' || u.role === filter;
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase())
      || u.email.toLowerCase().includes(search.toLowerCase())
      || (u.rut || '').includes(search);
    return matchRole && matchSearch;
  });

  const counts = {
    all: allUsers.length,
    super_admin: allUsers.filter(u => u.role === 'super_admin').length,
    admin: allUsers.filter(u => u.role === 'admin').length,
    employee: allUsers.filter(u => u.role === 'employee').length,
  };

  const roleBadge = (role: string) => {
    if (role === 'super_admin') return <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-bold">⭐ Super Admin</span>;
    if (role === 'admin') return <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-semibold">Admin</span>;
    return <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-full text-xs">Empleado</span>;
  };

  return (
    <MainLayout isAdmin title="Panel Super Administrador">
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
            <Crown className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Panel Super Administrador
              <Shield className="w-5 h-5 text-yellow-400" />
            </h1>
            <p className="text-sm text-gray-400">Acceso exclusivo · {user?.name}</p>
          </div>
        </div>

        {/* Result toast */}
        {actionResult && (
          <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm ${
            actionResult.ok
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {actionResult.ok ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
            {actionResult.msg}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Usuarios', count: counts.all, icon: Users, color: 'text-white', bg: 'bg-white/5' },
            { label: 'Super Admins', count: counts.super_admin, icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            { label: 'Admins', count: counts.admin, icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Empleados', count: counts.employee, icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border border-white/10 rounded-2xl p-4`}>
              <s.icon className={`w-6 h-6 ${s.color} mb-2`} />
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o RUT..."
            className="flex-1 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500/50"
          />
          <div className="flex gap-2">
            {(['all', 'super_admin', 'admin', 'employee'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  filter === f
                    ? 'bg-yellow-500 text-black'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {f === 'all' ? 'Todos' : f === 'super_admin' ? '⭐ Super' : f === 'admin' ? 'Admin' : 'Empleado'}
                <span className="ml-1 opacity-70">({counts[f]})</span>
              </button>
            ))}
          </div>
          <button
            onClick={loadUsers}
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all tap-target-min focus-ring"
            aria-label="Actualizar lista de usuarios"
            title="Actualizar lista"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-[#111827] border border-white/10 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-3">
              <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              Cargando usuarios...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Usuario</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">RUT / Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Cargo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Rol</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map(u => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D15F3D] to-[#B34E2D] flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white font-medium truncate max-w-[180px]">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        <div>{u.rut || '—'}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{u.email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{u.position || u.department || '—'}</td>
                      <td className="px-4 py-3">{roleBadge(u.role)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {/* No tocar super_admins */}
                          {u.role !== 'super_admin' && u.id !== user?.id && (
                            <>
                              {u.role === 'employee' && (
                                <button
                                  onClick={() => handlePromote(u)}
                                  disabled={actionLoading === u.id}
                                  title="Promover a Admin"
                                  aria-label={`Promover a Admin a ${u.name}`}
                                  className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all disabled:opacity-40 tap-target-min focus-ring"
                                >
                                  {actionLoading === u.id
                                    ? <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                                    : <Shield className="w-4 h-4" aria-hidden="true" />}
                                </button>
                              )}
                              {u.role === 'admin' && (
                                <button
                                  onClick={() => handleDemote(u)}
                                  disabled={actionLoading === u.id}
                                  title="Degradar a Empleado"
                                  aria-label={`Degradar a Empleado a ${u.name}`}
                                  className="p-1.5 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 rounded-lg transition-all disabled:opacity-40 tap-target-min focus-ring"
                                >
                                  {actionLoading === u.id
                                    ? <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                                    : <UserX className="w-4 h-4" aria-hidden="true" />}
                                </button>
                              )}
                              <button
                                onClick={() => { setPwModal({ userId: u.id, userName: u.name }); setNewPw(''); }}
                                title="Resetear contraseña"
                                aria-label={`Resetear contraseña de ${u.name}`}
                                className="p-1.5 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-all tap-target-min focus-ring"
                              >
                                <KeyRound className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </>
                          )}
                          {u.role === 'super_admin' && (
                            <span className="text-xs text-yellow-500/60 italic">Super Admin</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-2">
                  <AlertTriangle className="w-8 h-8 opacity-40" />
                  <p>Sin resultados para la búsqueda</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-blue-400" /> Promover a Admin</span>
          <span className="flex items-center gap-1.5"><UserX className="w-3.5 h-3.5 text-orange-400" /> Degradar a Empleado</span>
          <span className="flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5 text-yellow-400" /> Resetear Contraseña</span>
        </div>
      </div>

      {/* Reset Password Modal */}
      {pwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a2235] border border-yellow-500/30 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <KeyRound className="w-6 h-6 text-yellow-400" />
              <div>
                <h3 className="text-white font-bold">Resetear Contraseña</h3>
                <p className="text-xs text-gray-400">{pwModal.userName}</p>
              </div>
            </div>
            <div className="relative mb-4">
              <input
                type={showPw ? 'text' : 'password'}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="Nueva contraseña"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-yellow-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-white tap-target-min p-1 focus-ring rounded-lg"
                aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPw ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setPwModal(null); setNewPw(''); }}
                className="flex-1 px-4 py-2.5 bg-white/5 text-gray-400 hover:text-white rounded-xl text-sm font-medium transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetPw}
                disabled={!newPw.trim() || actionLoading === pwModal.userId}
                className="flex-1 px-4 py-2.5 bg-yellow-500 text-black rounded-xl text-sm font-bold hover:bg-yellow-400 transition-all disabled:opacity-40"
              >
                {actionLoading === pwModal.userId
                  ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
                  : 'Actualizar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default SuperAdminPanel;
