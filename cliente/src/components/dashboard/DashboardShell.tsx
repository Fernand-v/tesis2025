'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { apiUrl } from '@/lib/config';
import DashboardHeader from './DashboardHeader';
import { DashboardContext } from './DashboardContext';

interface ProfileUser {
  id: number;
  username: string;
  nombre: string;
  apellido: string;
  rol?: number | null;
  estado: number;
}

interface ProfileProgram {
  codigo: number;
  descripcion: string;
  ubicacion: string;
  formulario: string;
  tipoCodigo?: number | null;
  tipoDescripcion?: string | null;
}

interface ProfileResponse {
  user: ProfileUser;
  programs: ProfileProgram[];
}

const themeStorageKey = 'dashboardTheme';

const DashboardShell = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [programs, setPrograms] = useState<ProfileProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = window.localStorage.getItem(themeStorageKey);
    return stored === 'light' ? 'light' : 'dark';
  });
  const [pageTitle, setPageTitle] = useState<string>('Sistema General');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('authToken');
      window.localStorage.removeItem('authUser');
    }
    router.replace('/login');
  }, [router]);

  const refreshProfile = useCallback(async () => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('authToken') : null;

    if (!token) {
      logout();
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${apiUrl}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
          return;
        }

        const payload = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(payload.message ?? 'No se pudo obtener el perfil');
      }

      const data = (await response.json()) as ProfileResponse;
      setUser(data.user);
      setPrograms(data.programs ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const containerClasses = useMemo(
    () =>
      theme === 'dark'
        ? 'bg-slate-950 text-slate-100'
        : 'bg-slate-50 text-slate-900',
    [theme],
  );

  const contextValue = useMemo(
    () => ({
      user,
      programs,
      loading,
      error,
      refreshProfile,
      theme,
      toggleTheme,
      logout,
      pageTitle,
      setPageTitle,
    }),
    [user, programs, loading, error, refreshProfile, theme, toggleTheme, logout, pageTitle],
  );

  return (
    <DashboardContext.Provider value={contextValue}>
      <div className={`min-h-screen transition-colors duration-300 ${containerClasses}`}>
        <DashboardHeader />
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
          {error ? (
            <div className="rounded-xl border border-rose-500 bg-rose-500/10 p-4 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </DashboardContext.Provider>
  );
};

export default DashboardShell;
