'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from './DashboardContext';

type Usage = { lastOpenedAt: number; openCount: number };
type UsageMap = Record<number, Usage>;

const STORAGE_KEY = 'programUsage.v1';
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim();

const DashboardOverview = () => {
  const router = useRouter();
  const { programs, loading, setPageTitle, theme } = useDashboard();
  const [usage, setUsage] = useState<UsageMap>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<number | 'all'>('all');

  useEffect(() => {
    setPageTitle('Sistema General');
  }, [setPageTitle]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUsage(JSON.parse(raw));
    } catch {}
  }, []);

  const availableTypes = useMemo(() => {
    const map = new Map<number, string>();
    programs.forEach((program) => {
      if (typeof program.tipoCodigo === 'number') {
        const description = program.tipoDescripcion?.trim() || 'Sin tipo';
        map.set(program.tipoCodigo, description);
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], undefined, { sensitivity: 'base' }));
  }, [programs]);

  const normalizedSearch = useMemo(() => normalize(searchTerm), [searchTerm]);

  const filteredPrograms = useMemo(() => {
    const byType = typeFilter === 'all' ? programs : programs.filter((program) => program.tipoCodigo === typeFilter);

    if (!normalizedSearch) {
      return byType;
    }

    return byType.filter((program) => {
      const fields = [
        program.descripcion ?? '',
        program.formulario ?? '',
        program.ubicacion ?? '',
        program.tipoDescripcion ?? '',
      ];
      return fields.some((field) => normalize(field).includes(normalizedSearch));
    });
  }, [programs, normalizedSearch, typeFilter]);

  const sortedPrograms = useMemo(() => {
    const list = [...filteredPrograms];
    list.sort((a, b) => {
      const ua = usage[a.codigo] || { lastOpenedAt: 0, openCount: 0 };
      const ub = usage[b.codigo] || { lastOpenedAt: 0, openCount: 0 };
      if (ub.lastOpenedAt !== ua.lastOpenedAt) return ub.lastOpenedAt - ua.lastOpenedAt;
      if (ub.openCount !== ua.openCount) return ub.openCount - ua.openCount;
      return a.descripcion.localeCompare(b.descripcion, undefined, { sensitivity: 'base' });
    });
    return list;
  }, [filteredPrograms, usage]);

  const openProgram = (p: { codigo: number; ubicacion: string }) => {
    router.push(`/${p.ubicacion}`);
    setUsage((prev) => {
      const next: UsageMap = {
        ...prev,
        [p.codigo]: {
          lastOpenedAt: Date.now(),
          openCount: (prev[p.codigo]?.openCount || 0) + 1,
        },
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Clases mejoradas para los cards
  const cardClasses = useMemo(
    () =>
      theme === 'dark'
        ? 'bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-slate-700/50 shadow-xl shadow-slate-950/50 backdrop-blur-sm'
        : 'bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/80 shadow-xl shadow-slate-300/30',
    [theme],
  );

  const textClasses = theme === 'dark' ? 'text-slate-100' : 'text-slate-900';
  const emptyStateClasses = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';
  const filterContainerClasses =
    theme === 'dark'
      ? 'rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4 shadow-lg shadow-slate-900/40 backdrop-blur'
      : 'rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-lg shadow-slate-300/40 backdrop-blur';
  const inputClasses =
    theme === 'dark'
      ? 'w-full rounded-full border border-slate-700/60 bg-slate-950/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
      : 'w-full rounded-full border border-slate-300/70 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-500/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/30';
  const selectClasses =
    theme === 'dark'
      ? 'h-9 rounded-full border border-slate-700/60 bg-slate-950/60 px-4 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
      : 'h-9 rounded-full border border-slate-300/70 bg-white px-4 text-sm text-slate-900 focus:border-indigo-500/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/30';
  const clearButtonClasses =
    theme === 'dark'
      ? 'h-9 rounded-full border border-slate-700/60 px-4 text-xs font-medium text-slate-200 transition hover:border-indigo-500 hover:text-indigo-200'
      : 'h-9 rounded-full border border-slate-300/70 px-4 text-xs font-medium text-slate-700 transition hover:border-indigo-500 hover:text-indigo-600';

  return (
    <section className="space-y-8 px-2 py-4">
      {loading && (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-500/30 border-t-indigo-500" />
            <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full border-4 border-indigo-500/20" />
          </div>
        </div>
      )}

      {!loading && programs.length === 0 && (
      <div className={`${cardClasses} rounded-2xl p-12 text-center`}>
        <div className="mx-auto max-w-md space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${textClasses}`}>
                Sin programas disponibles
              </h3>
              <p className={`mt-2 text-sm ${emptyStateClasses}`}>
                No hay programas habilitados para tu rol. Contacta al equipo de sistemas para solicitar acceso.
              </p>
            </div>
          </div>
        </div>
      )}

      {!loading && programs.length > 0 && (
        <>
          <div className={`flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${filterContainerClasses}`}>
            <div className="flex w-full flex-col gap-3 md:max-w-lg md:flex-row">
              <label className="relative flex-1 text-xs text-slate-400">
                <span className="sr-only">Buscar programa</span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar programa por nombre, formulario o ubicacion..."
                  className={inputClasses}
                />
              </label>
              {searchTerm.trim() !== '' ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className={clearButtonClasses}
                >
                  Limpiar
                </button>
              ) : null}
            </div>

            <label className="flex w-full flex-col text-xs text-slate-400 md:w-auto">
              <span className="sr-only">Filtrar por tipo de programa</span>
              <select
                value={typeFilter === 'all' ? 'all' : String(typeFilter)}
                onChange={(event) => {
                  setTypeFilter(event.target.value === 'all' ? 'all' : Number(event.target.value));
                }}
                className={selectClasses}
              >
                <option value="all">Todos los tipos</option>
                {availableTypes.map(([codigo, descripcion]) => (
                  <option key={codigo} value={codigo}>
                    {descripcion}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {sortedPrograms.length === 0 ? (
            <div className={`${cardClasses} rounded-2xl p-12 text-center`}>
              <div className="mx-auto max-w-md space-y-4">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${textClasses}`}>No hay coincidencias</h3>
                  <p className={`mt-2 text-sm ${emptyStateClasses}`}>
                    Ajusta la busqueda o selecciona otro tipo de programa.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {sortedPrograms.map((program) => {
              const name = program.descripcion?.trim() || 'Programa';
              const hasBeenUsed = usage[program.codigo]?.openCount > 0;

              return (
                <button
                  type="button"
                  key={program.codigo}
                  onClick={() => openProgram(program)}
                  aria-label={name}
                  className={`
                    group relative overflow-hidden rounded-2xl p-6 text-left
                    ${cardClasses}
                    transition-all duration-300 ease-out
                    hover:-translate-y-2 hover:scale-[1.02]
                    hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/25
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500
                    active:scale-[0.98]
                  `}
                >
                  {/* Indicador de programa usado recientemente */}
                  {hasBeenUsed && (
                    <div className="absolute right-3 top-3">
                      <div className="flex h-2 w-2 items-center justify-center">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
                      </div>
                    </div>
                  )}

                  {/* Efecto de brillo al hover */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10" />
                  </div>

                  {/* Contenido del card */}
                  <div className="relative flex h-full min-h-[120px] flex-col items-center justify-center space-y-3 text-center">
                    {/* Icono decorativo */}
                    <div className="rounded-xl bg-indigo-500/10 p-3 ring-1 ring-indigo-500/20 transition-transform duration-300 group-hover:scale-110 group-hover:ring-indigo-500/40">
                      <svg className="h-7 w-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>

                    {/* Nombre del programa */}
                    <h3
                      className={`
                        line-clamp-2 w-full px-2 text-base font-semibold leading-snug
                        ${textClasses}
                        transition-colors duration-300
                        group-hover:text-indigo-500
                      `}
                      title={name}
                    >
                      {name}
                    </h3>

                    {/* Indicador visual de interacción */}
                    <div className="flex items-center gap-1 opacity-0 transition-all duration-300 group-hover:opacity-100">
                      <span className="text-xs font-medium text-indigo-500">Abrir</span>
                      <svg className="h-4 w-4 translate-x-0 text-indigo-500 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          )}
        </>
      )}
    </section>
  );
};

export default DashboardOverview;
