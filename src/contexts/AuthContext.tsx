// Contexto de autenticación para la plataforma
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  // Gestión de usuarios (admin)
  addUser: (data: Omit<User, 'id' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  // Privilegios exclusivos super_admin
  promoteToAdmin: (userId: string) => Promise<{ success: boolean; error?: string }>;
  demoteToEmployee: (userId: string) => Promise<{ success: boolean; error?: string }>;
  resetUserPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  getAllUsers: () => Promise<User[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuarios iniciales (se cargan solo la primera vez, luego viven en localStorage)
const demoUsers: User[] = [
  {
    id: 'admin-001',
    email: 'admin@capacitapro.com',
    name: 'Administrador',
    role: 'admin',
    department: 'Recursos Humanos',
    position: 'Gerente de Capacitación',
    createdAt: new Date('2026-01-01'),
    avatar: '',
    password: 'admin123',
    status: 'active'
  },
  {
    id: 'emp-001',
    email: 'empleado@capacitapro.com',
    name: 'María García',
    role: 'employee',
    department: 'Ventas',
    position: 'Ejecutivo de Ventas',
    createdAt: new Date('2026-02-15'),
    avatar: '',
    password: 'empleado123',
    status: 'active'
  },
  {
    id: 'emp-002',
    email: 'juan@capacitapro.com',
    name: 'Juan Pérez',
    role: 'employee',
    department: 'Marketing',
    position: 'Analista de Marketing',
    createdAt: new Date('2026-03-01'),
    avatar: '',
    password: 'empleado123',
    status: 'active'
  }
];
const seedUsers = import.meta.env.DEV ? demoUsers : [];
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
  status: p.status as 'active' | 'inactive'
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
        setUsers(data.map(p => mapProfile(p as Record<string, unknown>)));
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

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) {
          setIsLoading(false);
          return { success: false, error: 'Credenciales incorrectas' };
        }
        const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        if (profileError || !profile) {
          await supabase.auth.signOut();
          setIsLoading(false);
          return { success: false, error: 'La cuenta no tiene un perfil habilitado.' };
        }
        setUser(mapProfile(profile as Record<string, unknown>));
        setIsLoading(false);
        return { success: true };
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

      if (foundUser.password && foundUser.password !== password) {
        setIsLoading(false);
        return { success: false, error: 'Credenciales incorrectas' };
      }

      const sessionUser = sanitize(foundUser);
      setUser(sessionUser);
      saveToStorage(STORAGE_KEYS.session, sessionUser);
      setIsLoading(false);
      return { success: true };
    } catch {
      setIsLoading(false);
      return { success: false, error: 'Error al iniciar sesión' };
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
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.session);
  };

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      saveToStorage(STORAGE_KEYS.session, updatedUser);
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, ...updates } : u)));
    }
  };

  // --- Gestión de usuarios (admin) ---

  const addUser = async (data: Omit<User, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> => {
    const exists = users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) {
      return { success: false, error: 'Ya existe un usuario con ese correo' };
    }

    const newId = uuidv4();
    const newUser: User = {
      ...data,
      id: newId,
      createdAt: new Date(),
      status: data.status || 'active'
    };
    setUsers(prev => [...prev, newUser]);

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('profiles').insert({
        id: newId,
        email: data.email,
        name: data.name,
        role: data.role || 'employee',
        department: data.department ?? null,
        position: data.position ?? null,
        rut: data.rut ?? null,
        status: data.status || 'active',
        organization_id: '00000000-0000-0000-0000-000000000001'
      });
      if (error) {
        console.warn('Supabase profile insert error:', error.message);
      }
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
    setUsers(prev => prev.filter(u => u.id !== id));

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) {
        console.warn('Supabase profile delete error:', error.message);
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
