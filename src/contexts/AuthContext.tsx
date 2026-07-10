// Contexto de autenticación para la plataforma
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage';
import { validatePasswordComplexity } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { normalizeRut, isValidRut, rutBodyNoDv, employeeEmailFromRut } from '@/lib/employeeImport';

// ── Helper para audit log ISO 45001 ──────────────────────────────────────────
const logAuditEvent = async (
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, unknown>
): Promise<void> => {
  try {
    await supabase.functions.invoke('audit-log', {
      body: { action, resource_type: resourceType, resource_id: resourceId, details }
    });
  } catch (err) {
    console.warn('[Audit] Failed to log event:', err);
  }
};

interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; mustChangePassword?: boolean }>;
  loginByRut: (rut: string) => Promise<{ success: boolean; error?: string; mustChangePassword?: boolean }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  addUser: (data: Omit<User, 'id' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  promoteToAdmin: (userId: string) => Promise<{ success: boolean; error?: string }>;
  demoteToEmployee: (userId: string) => Promise<{ success: boolean; error?: string }>;
  resetUserPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  getAllUsers: () => Promise<User[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const seedUsers: User[] = [];
const isSupabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

const sanitize = (u: User): User => {
  const { password: _password, ...safe } = u;
  return safe;
};

const mapProfile = (p: Record<string, unknown>): User => ({
  id: p.id as string,
  rut: (p.rut as string) ?? undefined,
  email: p.email as string,
  name: p.name as string,
  role: p.role as UserRole,
  department: (p.department as string) ?? undefined,
  position: (p.position as string) ?? undefined,
  createdAt: new Date(p.created_at as string),
  status: p.status as 'active' | 'inactive',
  mustChangePassword: (p.must_change_password as boolean) ?? true,
  organizationId: (p.organization_id as string) ?? undefined,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => loadFromStorage(STORAGE_KEYS.users, seedUsers));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    saveToStorage(STORAGE_KEYS.users, users);
  }, [users]);

  // Cargar usuarios desde Supabase al montar
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const loadProfiles = async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) {
        const mapped = data.map(p => mapProfile(p as Record<string, unknown>));
        setUsers(prev => mapped.length > 0 ? mapped : prev);
      }
    };
    void loadProfiles();
  }, []);

  // Verificar sesión almacenada al cargar
  useEffect(() => {
    if (isSupabaseConfigured) {
      const loadSession = async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.session.user.id).single();
          if (profile) {
            setUser(mapProfile(profile as Record<string, unknown>));
          }
        }
        setIsLoading(false);
      };
      void loadSession();
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) setUser(null);
      });
      return () => data.subscription.unsubscribe();
    }

    const stored = loadFromStorage<User | null>(STORAGE_KEYS.session, null);
    if (stored) {
      setUser(stored);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; mustChangePassword?: boolean }> => {
    setIsLoading(true);

    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) {
          setIsLoading(false);
          // Audit log: login fallido
          void logAuditEvent('login_failed', 'auth', undefined, { email, reason: 'invalid_credentials' });
          return { success: false, error: 'Credenciales incorrectas' };
        }
        const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        if (profileError || !profile) {
          await supabase.auth.signOut();
          setIsLoading(false);
          return { success: false, error: 'La cuenta no tiene un perfil habilitado.' };
        }
        const mapped = mapProfile(profile as Record<string, unknown>);
        setUser(mapped);
        setIsLoading(false);
        // Audit log: login exitoso
        void logAuditEvent('login', 'auth', data.user.id, { email });
        return { success: true, mustChangePassword: mapped.mustChangePassword };
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!foundUser) {
        setIsLoading(false);
        return { success: false, error: 'Credenciales incorrectas' };
      }

      if (foundUser.status === 'inactive') {
        setIsLoading(false);
        return { success: false, error: 'Esta cuenta está desactivada. Contacta al administrador.' };
      }

      // FIXME (Security): Plaintext password comparison. This is insecure and should be migrated to hashed passwords.
      if (foundUser.password && foundUser.password !== password) {
        setIsLoading(false);
        return { success: false, error: 'Credenciales incorrectas' };
      }

      const sessionUser = sanitize(foundUser);
      setUser(sessionUser);
      saveToStorage(STORAGE_KEYS.session, sessionUser);
      setIsLoading(false);
      return { success: true, mustChangePassword: foundUser.mustChangePassword ?? true };
    } catch {
      setIsLoading(false);
      return { success: false, error: 'Error al iniciar sesión' };
    }
  };

  const loginByRut = async (rutInput: string): Promise<{ success: boolean; error?: string; mustChangePassword?: boolean }> => {
    setIsLoading(true);

    try {
      const rut = normalizeRut(rutInput);
      if (!isValidRut(rut)) {
        setIsLoading(false);
        return { success: false, error: 'RUT inválido. Verifica el formato (ej: 15422822-5)' };
      }

      const email = employeeEmailFromRut(rut);
      const password = rutBodyNoDv(rut);

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) {
          setIsLoading(false);
          void logAuditEvent('login_failed', 'auth', undefined, { rut, reason: 'rut_not_found' });
          return { success: false, error: 'RUT no encontrado. Contacta al administrador.' };
        }
        const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        if (profileError || !profile) {
          await supabase.auth.signOut();
          setIsLoading(false);
          return { success: false, error: 'La cuenta no tiene un perfil habilitado.' };
        }
        const mapped = mapProfile(profile as Record<string, unknown>);
        setUser(mapped);
        setIsLoading(false);
        void logAuditEvent('login', 'auth', data.user.id, { rut, method: 'rut_passwordless' });
        // Empleados nunca deben cambiar contraseña en este modelo
        return { success: true, mustChangePassword: false };
      }

      // Modo demo (sin Supabase) — buscar por RUT en usuarios locales
      await new Promise(resolve => setTimeout(resolve, 300));
      const foundUser = users.find(u => {
        const uRut = u.rut ? normalizeRut(u.rut) : '';
        return uRut === rut;
      });

      if (!foundUser) {
        setIsLoading(false);
        return { success: false, error: 'RUT no encontrado. Contacta al administrador.' };
      }
      if (foundUser.status === 'inactive') {
        setIsLoading(false);
        return { success: false, error: 'Esta cuenta está desactivada. Contacta al administrador.' };
      }

      const sessionUser = sanitize(foundUser);
      setUser(sessionUser);
      saveToStorage(STORAGE_KEYS.session, sessionUser);
      setIsLoading(false);
      return { success: true, mustChangePassword: false };
    } catch {
      setIsLoading(false);
      return { success: false, error: 'Error al iniciar sesión' };
    }
  };

  const changePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No hay sesión activa.' };

    const validation = validatePasswordComplexity(newPassword);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join('. ') };
    }

    try {
      if (isSupabaseConfigured) {
        const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
        if (authError) return { success: false, error: authError.message };

        const { error: profileError } = await supabase.from('profiles')
          .update({ must_change_password: false })
          .eq('id', user.id);
        if (profileError) console.warn('Error clearing must_change_password flag:', profileError.message);
      } else {
        setUsers(prev => prev.map(u =>
          u.id === user.id ? { ...u, password: newPassword, mustChangePassword: false } : u
        ));
      }

      setUser(prev => prev ? { ...prev, mustChangePassword: false } : null);
      saveToStorage(STORAGE_KEYS.session, { ...user, mustChangePassword: false });
      return { success: true };
    } catch {
      return { success: false, error: 'Error al cambiar la contraseña.' };
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        setIsLoading(false);
        return { success: false, error: 'El correo ya está registrado' };
      }

      const newUser: User = {
        id: uuidv4(),
        email,
        name,
        role,
        department: role === 'admin' ? 'Administración' : undefined,
        createdAt: new Date(),
        avatar: '',
        password,
        status: 'active'
      };

      setUsers(prev => [...prev, newUser]);

      const sessionUser = sanitize(newUser);
      setUser(sessionUser);
      saveToStorage(STORAGE_KEYS.session, sessionUser);
      setIsLoading(false);
      return { success: true };
    } catch {
      setIsLoading(false);
      return { success: false, error: 'Error al registrar usuario' };
    }
  };

  const logout = async (): Promise<void> => {
    const currentUserId = user?.id;
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.session);
    // Audit log: logout
    if (currentUserId) {
      void logAuditEvent('logout', 'auth', currentUserId);
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    if (!user) return;

    const previousUser: User | undefined = { ...user };

    // Optimistic UI update
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    saveToStorage(STORAGE_KEYS.session, updatedUser);
    setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, ...updates } : u)));

    // Supabase persist with rollback on error
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: updates.name,
            department: updates.department ?? null,
            position: updates.position ?? null,
            rut: updates.rut ?? null
          })
          .eq('id', user.id);
        if (error) throw error;
      } catch (err) {
        console.warn('[AuthContext] Error actualizando perfil en Supabase - rollback', err);
        // Rollback to previous state
        if (previousUser) {
          setUser(previousUser);
          saveToStorage(STORAGE_KEYS.session, previousUser);
          setUsers(prev => prev.map(u => (u.id === user.id ? previousUser! : u)));
        }
      }
    }
  };

  // --- Gestión de usuarios (admin) ---

  const addUser = async (data: Omit<User, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> => {
    const exists = users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) {
      return { success: false, error: 'Ya existe un usuario con ese correo' };
    }

    let optimisticUser: User | undefined;
    let previousUsers: User[] = [];

    // Capture previous state for rollback
    previousUsers = [...users];

    if (isSupabaseConfigured) {
      // Create optimistic user immediately
      const newId = uuidv4();
      optimisticUser = {
        ...data,
        id: newId,
        createdAt: new Date(),
        status: data.status || 'active',
        mustChangePassword: true,
      };
      setUsers(prev => [...prev, optimisticUser!]);

      const worker = {
        rut: data.rut || '',
        name: data.name,
        email: data.email,
        position: data.position || '',
        department: data.department || '',
        password: data.password || undefined
      };

      try {
        const { data: fnData, error } = await supabase.functions.invoke('import-workers', {
          body: { workers: [worker] }
        });
        if (error) throw error;

        // Recargar perfiles desde Supabase para obtener el usuario real con su UUID de auth
        const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (profiles && profiles.length > 0) {
          setUsers(profiles.map(p => mapProfile(p as Record<string, unknown>)));
        }
      } catch (err) {
        console.warn('[AuthContext] Error agregando usuario en Supabase - rollback', err);
        // Rollback to previous state
        setUsers(previousUsers);
        return { success: false, error: 'No se pudo crear la cuenta en el sistema de acceso' };
      }
    } else {
      const newId = uuidv4();
      const newUser: User = {
        ...data,
        id: newId,
        createdAt: new Date(),
        status: data.status || 'active',
        mustChangePassword: true,
      };
      setUsers(prev => [...prev, newUser]);
    }

    return { success: true };
  };

  const updateUser = async (id: string, updates: Partial<User>): Promise<void> => {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updates } : u)));

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('profiles').update({
        name: updates.name,
        department: updates.department ?? null,
        position: updates.position ?? null,
        status: updates.status,
        role: updates.role,
        rut: updates.rut ?? null
      }).eq('id', id);
      if (error) {
        console.warn('Supabase profile update error:', error.message);
      }
    }
  };

  const deleteUser = async (id: string): Promise<void> => {
    const deletedUser: User | undefined = users.find(u => u.id === id);
    const previousUsers: User[] = [...users];

    // Optimistic UI update - remove user immediately
    setUsers(prev => prev.filter(u => u.id !== id));

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.warn('[AuthContext] Error eliminando usuario en Supabase - rollback', err);
        // Rollback to previous state
        setUsers(previousUsers);
      }
    }
  };

  // ── Super Admin: cambiar rol a admin ──────────────────────────────────────
  const promoteToAdmin = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured) return { success: false, error: 'Solo disponible en producción' };
    const { error } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const demoteToEmployee = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured) return { success: false, error: 'Solo disponible en producción' };
    const { error } = await supabase.from('profiles').update({ role: 'employee' }).eq('id', userId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const resetUserPassword = async (userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured) return { success: false, error: 'Solo disponible en producción' };
    const { error } = await supabase.functions.invoke('manage-user-role', {
      body: { action: 'reset_password', userId, newPassword }
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const getAllUsers = async (): Promise<User[]> => {
    if (!isSupabaseConfigured) return users;
    const { data, error } = await supabase.from('profiles').select('*').order('name');
    if (error || !data) return users;
    return data.map(p => mapProfile(p as Record<string, unknown>));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isAuthenticated: !!user,
        isLoading,
        isSuperAdmin,
        login,
        loginByRut,
        changePassword,
        register,
        logout,
        updateProfile,
        addUser,
        updateUser,
        deleteUser,
        promoteToAdmin,
        demoteToEmployee,
        resetUserPassword,
        getAllUsers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
