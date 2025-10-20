'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDashboard } from '../dashboard/DashboardContext';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { CheckCircleIcon, XCircleIcon, RefreshCcwIcon, AlertTriangleIcon } from 'lucide-react';

interface Role {
  codigo: number;
  descripcion: string;
}

interface Program {
  codigo: number;
  descripcion: string;
  ubicacion: string;
  formulario: string;
}

interface RoleDetail {
  role: Role;
  assignedPrograms: Program[];
  availablePrograms: Program[];
}

export default function RolesManager() {
  const { setPageTitle, refreshProfile, theme } = useDashboard();
  const authFetch = useAuthFetch();

  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [detail, setDetail] = useState<RoleDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Panel & estilo dinámico según tema
  const panelClass = useMemo(
    () =>
      theme === 'dark'
        ? 'rounded-3xl border border-slate-700/60 bg-slate-900/60 shadow-xl shadow-slate-900/40 backdrop-blur-sm'
        : 'rounded-3xl border border-slate-200 bg-white shadow-md shadow-slate-300/30',
    [theme],
  );

  const textPrimary = theme === 'dark' ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';
  const inputClass =
    theme === 'dark'
      ? 'rounded-xl border border-slate-700/60 bg-slate-950/40 text-slate-100 placeholder:text-slate-500'
      : 'rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400';

  // ==== DATA ====

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch('/catalog/roles');
      const data = (await response.json()) as { roles?: Role[] };
      setRoles(data.roles ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  const fetchDetail = useCallback(
    async (codigo: number) => {
      setLoading(true);
      setError(null);
      try {
        const response = await authFetch(`/catalog/roles/${codigo}`);
        const data = (await response.json()) as RoleDetail;
        setDetail(data);
        setEditDesc(data.role.descripcion);
        setSelectedRole(codigo);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [authFetch],
  );

  useEffect(() => {
    setPageTitle('Gestión de Roles');
    void fetchRoles();
    return () => setPageTitle('Sistema general');
  }, [fetchRoles, setPageTitle]);

  // ==== UTILIDAD ====

  const showTempMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      setMessage(msg);
    } else {
      setError(msg);
    }
    setTimeout(() => {
      setMessage(null);
      setError(null);
    }, 4000);
  };

  // ==== CRUD ====

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newRoleDesc.trim()) return showTempMessage('La descripción es obligatoria', 'error');
    setSaving(true);
    try {
      const res = await authFetch('/catalog/roles', {
        method: 'POST',
        body: JSON.stringify({ descripcion: newRoleDesc.trim() }),
      });
      const data = (await res.json()) as RoleDetail;
      setNewRoleDesc('');
      await fetchRoles();
      setDetail(data);
      setSelectedRole(data.role.codigo);
      showTempMessage('Rol creado correctamente');
      await refreshProfile();
    } catch (err) {
      showTempMessage((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRole || !detail) return;
    if (!editDesc.trim()) return showTempMessage('La descripción es obligatoria', 'error');
    setSaving(true);
    try {
      const res = await authFetch(`/catalog/roles/${selectedRole}`, {
        method: 'PUT',
        body: JSON.stringify({ descripcion: editDesc.trim() }),
      });
      const data = (await res.json()) as RoleDetail;
      setDetail(data);
      showTempMessage('Rol actualizado correctamente');
      await fetchRoles();
      await refreshProfile();
    } catch (err) {
      showTempMessage((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      await authFetch(`/catalog/roles/${confirmDelete}`, { method: 'DELETE' });
      setDetail(null);
      setSelectedRole(null);
      await fetchRoles();
      showTempMessage('Rol eliminado');
      await refreshProfile();
    } catch (err) {
      showTempMessage((err as Error).message, 'error');
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  };

  const handleAssign = async (codigo: number) => {
    if (!selectedRole) return;
    setAssigning(true);
    try {
      const res = await authFetch(`/catalog/roles/${selectedRole}/programs`, {
        method: 'POST',
        body: JSON.stringify({ programaCodigo: codigo }),
      });
      const data = (await res.json()) as RoleDetail;
      setDetail(data);
      showTempMessage('Programa asignado');
    } catch (err) {
      showTempMessage((err as Error).message, 'error');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (codigo: number) => {
    if (!selectedRole) return;
    setAssigning(true);
    try {
      const res = await authFetch(`/catalog/roles/${selectedRole}/programs/${codigo}`, { method: 'DELETE' });
      const data = (await res.json()) as RoleDetail;
      setDetail(data);
      showTempMessage('Programa removido');
    } catch (err) {
      showTempMessage((err as Error).message, 'error');
    } finally {
      setAssigning(false);
    }
  };

  // ==== UI ====

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* PANEL IZQUIERDO */}
      <aside className="space-y-6">
        <section className={`${panelClass} p-5`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-semibold ${textPrimary}`}>Roles</h2>
            <button
              type="button"
              onClick={fetchRoles}
              className="flex items-center gap-1 rounded-full border border-slate-500/60 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-indigo-400 hover:text-white"
            >
              <RefreshCcwIcon size={12} /> Actualizar
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {roles.map((role) => (
              <button
                key={role.codigo}
                onClick={() => fetchDetail(role.codigo)}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                  selectedRole === role.codigo
                    ? 'border-indigo-500/70 bg-indigo-500/20 text-white shadow-md'
                    : 'border-slate-700/60 bg-slate-900/40 text-slate-300 hover:border-indigo-400/60 hover:text-white'
                }`}
              >
                {role.descripcion}
              </button>
            ))}

            {!loading && roles.length === 0 && (
              <p className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-3 py-2 text-sm text-slate-400">
                No hay roles registrados.
              </p>
            )}
          </div>
        </section>

        {/* NUEVO ROL */}
        <section className={`${panelClass} p-5`}>
          <h3 className={`text-base font-semibold ${textPrimary}`}>Nuevo rol</h3>
          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            <label className={`flex flex-col gap-2 text-sm ${textSecondary}`}>
              Descripción
              <input
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                className={`${inputClass} px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40`}
                placeholder="Ej: Administrador"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
            >
              Crear rol
            </button>
          </form>
        </section>
      </aside>

      {/* PANEL DERECHO */}
      <section className={`${panelClass} p-6`}>
        {message && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            <CheckCircleIcon size={16} /> {message}
          </div>
        )}
        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            <XCircleIcon size={16} /> {error}
          </div>
        )}

        {!detail ? (
          <p
            className={`rounded-xl border border-dashed ${
              theme === 'dark' ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-slate-50'
            } px-6 py-8 text-center text-sm ${textSecondary}`}
          >
            Selecciona un rol para ver o editar su configuración.
          </p>
        ) : (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-start justify-between">
              <div>
                <h2 className={`text-lg font-semibold ${textPrimary}`}>{detail.role.descripcion}</h2>
                <p className={`text-xs ${textSecondary}`}>Gestiona los programas vinculados a este rol</p>
              </div>
              <button
                onClick={() => setConfirmDelete(selectedRole)}
                disabled={saving}
                className="rounded-full border border-rose-500/70 px-3 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-500 hover:text-white"
              >
                Eliminar
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3">
              <label className={`flex flex-col gap-2 text-sm ${textSecondary}`}>
                Descripción
                <input
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className={`${inputClass} px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40`}
                />
              </label>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
                >
                  Guardar cambios
                </button>
                <button
                  type="button"
                  onClick={() => detail && setEditDesc(detail.role.descripcion)}
                  className="rounded-full border border-slate-500/60 px-4 py-2 text-sm text-slate-200 hover:border-indigo-400 hover:text-white"
                >
                  Reestablecer
                </button>
              </div>
            </form>

            {/* Programas */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className={`text-sm font-semibold ${textPrimary}`}>Programas asignados</h3>
                <div className="mt-2 space-y-2">
                  {detail.assignedPrograms.length === 0 ? (
                    <p className={`rounded-xl border border-slate-700/60 bg-slate-950/40 px-3 py-2 text-xs ${textSecondary}`}>
                      Sin programas asignados.
                    </p>
                  ) : (
                    detail.assignedPrograms.map((p) => (
                      <div
                        key={p.codigo}
                        className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-xs text-slate-200"
                      >
                        <div>
                          <p className="font-semibold">{p.descripcion}</p>
                          <p className={`text-xs ${textSecondary}`}>Ubicación: {p.ubicacion}</p>
                        </div>
                        <button
                          onClick={() => handleUnassign(p.codigo)}
                          disabled={assigning}
                          className="flex items-center gap-1 rounded-full border border-rose-500/70 px-3 py-1 text-[10px] font-semibold text-rose-300 hover:bg-rose-500 hover:text-white"
                        >
                          <XCircleIcon size={12} /> Quitar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 className={`text-sm font-semibold ${textPrimary}`}>Programas disponibles</h3>
                <div className="mt-2 space-y-2">
                  {detail.availablePrograms.length === 0 ? (
                    <p className={`rounded-xl border border-slate-700/60 bg-slate-950/40 px-3 py-2 text-xs ${textSecondary}`}>
                      Todos los programas ya están asignados.
                    </p>
                  ) : (
                    detail.availablePrograms.map((p) => (
                      <div
                        key={p.codigo}
                        className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-xs text-slate-200"
                      >
                        <div>
                          <p className="font-semibold">{p.descripcion}</p>
                          <p className={`text-xs ${textSecondary}`}>Ubicación: {p.ubicacion}</p>
                        </div>
                        <button
                          onClick={() => handleAssign(p.codigo)}
                          disabled={assigning}
                          className="flex items-center gap-1 rounded-full border border-emerald-500/70 px-3 py-1 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500 hover:text-white"
                        >
                          <CheckCircleIcon size={12} /> Asignar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* MODAL ELIMINAR */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div
            className={`${panelClass} max-w-sm p-6 text-center animate-scaleIn ${
              theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
            }`}
          >
            <AlertTriangleIcon
              size={42}
              className={`mx-auto mb-3 ${
                theme === 'dark' ? 'text-amber-400' : 'text-amber-500'
              } animate-pulse`}
            />
            <h3 className="text-lg font-semibold mb-2">Confirmar eliminación</h3>
            <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              ¿Estás seguro de que deseas eliminar este rol? <br />
              <strong>Esta acción no se puede deshacer.</strong>
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  theme === 'dark'
                    ? 'border border-slate-500/50 bg-slate-800/50 text-slate-300 hover:bg-slate-700'
                    : 'border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="rounded-xl bg-rose-600/90 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-900/30 transition hover:bg-rose-600 disabled:opacity-50"
              >
                {saving ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
