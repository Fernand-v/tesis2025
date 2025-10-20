'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDashboard } from './DashboardContext';
import { useAuthFetch } from '@/hooks/useAuthFetch';

const DEFAULT_PROGRAM = 'Sistema General';

const normalize = (s?: string) =>
  (s || '')
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const DashboardHeader = () => {
  const { user, pageTitle, theme, toggleTheme, logout } = useDashboard();
  const authFetch = useAuthFetch();
  const [downloading, setDownloading] = useState(false);
  const isAdmin = Number(user?.rol) === 1;

  const title =
    !pageTitle?.trim() || normalize(pageTitle) === normalize(DEFAULT_PROGRAM)
      ? DEFAULT_PROGRAM
      : pageTitle.trim();

  useEffect(() => {
    document.title = `${title} | Panel`;
  }, [title]);

  const handleBackup = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const response = await authFetch('/admin/backup/database', { method: 'POST' });

      const disposition = response.headers.get('Content-Disposition') ?? '';
      let filename = `backup-${new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)}.sql`;
      const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
      if (match && match[1]) {
        try {
          filename = decodeURIComponent(match[1]);
        } catch {
          filename = match[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      window.alert((error as Error).message ?? 'No se pudo generar el backup');
    } finally {
      setDownloading(false);
    }
  }, [authFetch, downloading]);

  return (
    <header
      role="banner"
      className="sticky top-0 z-20 border-b border-white/10 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-transparent px-4 py-3 backdrop-blur"
      data-theme={theme}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        {/* Izquierda: siempre titulo + (si hay) @usuario */}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-slate-100 md:text-xl" title={title}>
            {title}
          </h1>
          {user?.username && (
            <p className="mt-0.5 truncate text-xs text-slate-400">@{user.username}</p>
          )}
        </div>

        {/* Derecha: acciones */}
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <button
              type="button"
              onClick={handleBackup}
              disabled={downloading}
              className="rounded-full border border-indigo-500/60 bg-indigo-500/20 px-3 py-1.5 text-xs font-semibold text-indigo-100 shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              title="Descargar backup de la base de datos"
            >
              {downloading ? 'Generando...' : 'Backup BD'}
            </button>
          ) : null}

          <button
            type="button"
            onClick={toggleTheme}
            aria-pressed={theme === 'dark'}
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            className="flex items-center gap-1.5 rounded-full border border-slate-600/50 bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-400/80"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              {theme === 'dark'
                ? <path d="M12 18a6 6 0 1 0-5.996-6.304 8 8 0 1 1 11.302 7.092A5.959 5.959 0 0 0 12 18" />
                : <path d="M12 5.25a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75zm0 12a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75zM5.25 12a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-.75.75H6a.75.75 0 0 1-.75-.75zm12 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75zm-9.97-5.47a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06m8.284 8.284a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06m0-8.284a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 1 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0M7.897 16.103a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0M12 8.25a3.75 3.75 0 1 1 0 7.5 3.75 3.75 0 0 1 0-7.5" />}
            </svg>
            <span className="hidden sm:inline">{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="rounded-full bg-rose-500/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-rose-950/30 transition hover:bg-rose-500"
            title="Cerrar sesion"
          >
            Cerrar sesion
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
