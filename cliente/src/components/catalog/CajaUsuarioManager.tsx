'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDashboard } from '../dashboard/DashboardContext';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { useCatalogStyles } from './catalog-ui';
import CatalogToast from './CatalogToast';
import ConfirmDialog from './ConfirmDialog';
import { useFeedbackFlash } from '@/hooks/useFeedbackFlash';

interface Caja {
  codigo: number;
  descripcion: string;
}

interface UsuarioBasico {
  codigo: number;
  username: string;
  nombre: string;
  apellido: string;
  estado: number;
}

interface Asignacion {
  cajaCodigo: number;
  usuarioCodigo: number;
  cajaDescripcion: string;
  usuarioUsername: string;
  usuarioNombre: string;
  usuarioApellido: string;
}

interface ConfirmData {
  cajaCodigo: number;
  usuarioCodigo: number;
  resumen: string;
}

const CajaUsuarioManager = () => {
  const { setPageTitle, theme } = useDashboard();
  const authFetch = useAuthFetch();
  const styles = useCatalogStyles(theme);
  const { feedback, showFeedback, clearFeedback } = useFeedbackFlash();

  const [cajas, setCajas] = useState<Caja[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioBasico[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [selectedCaja, setSelectedCaja] = useState<number | null>(null);
  const [selectedUsuario, setSelectedUsuario] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmData, setConfirmData] = useState<ConfirmData | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch('/catalog/cash-register-users');
      const data = (await response.json()) as {
        asignaciones?: Asignacion[];
        cajas?: Caja[];
        usuarios?: UsuarioBasico[];
      };

      setAsignaciones(data.asignaciones ?? []);
      setCajas(data.cajas ?? []);
      setUsuarios(data.usuarios ?? []);
    } catch (error) {
      showFeedback((error as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, showFeedback]);

  // Carga inicial
  useEffect(() => {
    setPageTitle('Cajas asignadas a usuarios');
    void fetchOverview();
    return () => setPageTitle('Sistema General');
  }, [fetchOverview, setPageTitle]);

  // Selección automática después de cargar datos
  useEffect(() => {
    if (cajas.length > 0 && !selectedCaja) {
      setSelectedCaja(cajas[0].codigo);
    }
    if (usuarios.length > 0 && !selectedUsuario) {
      setSelectedUsuario(usuarios[0].codigo);
    }
  }, [cajas, usuarios, selectedCaja, selectedUsuario]);

  const handleAssign = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const caja = Number(selectedCaja);
    const usuario = Number(selectedUsuario);

    if (!caja || !usuario) {
      showFeedback('Selecciona una caja y un usuario válidos.', 'error');
      return;
    }

    setSaving(true);
    clearFeedback();

    try {
      const response = await authFetch('/catalog/cash-register-users', {
        method: 'POST',
        body: JSON.stringify({ cajaCodigo: caja, usuarioCodigo: usuario }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({ message: 'No se pudo asignar' }))) as {
          message?: string;
        };
        showFeedback(payload.message ?? 'No se pudo asignar', 'error');
      } else {
        const data = (await response.json()) as { asignaciones?: Asignacion[] };
        if (data.asignaciones) {
          setAsignaciones(data.asignaciones);
        }
        showFeedback('Asignación registrada correctamente.');
      }
    } catch (error) {
      showFeedback((error as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmRemove = (asignacion: Asignacion) => {
    setConfirmData({
      cajaCodigo: asignacion.cajaCodigo,
      usuarioCodigo: asignacion.usuarioCodigo,
      resumen: `${asignacion.cajaDescripcion} → ${asignacion.usuarioUsername}`,
    });
    clearFeedback();
  };

  const handleRemove = useCallback(async () => {
    if (!confirmData) return;
    setSaving(true);
    clearFeedback();

    try {
      const response = await authFetch(
        `/catalog/cash-register-users/${confirmData.cajaCodigo}/${confirmData.usuarioCodigo}`,
        { method: 'DELETE' },
      );

      if (response.status === 404) {
        showFeedback('Asignación no encontrada.', 'error');
      } else if (!response.ok) {
        const payload = (await response.json().catch(() => ({ message: 'No se pudo eliminar' }))) as {
          message?: string;
        };
        showFeedback(payload.message ?? 'No se pudo eliminar', 'error');
      } else {
        showFeedback('Asignación eliminada correctamente.');
        await fetchOverview();
      }
    } catch (error) {
      showFeedback((error as Error).message, 'error');
    } finally {
      setSaving(false);
      setConfirmData(null);
    }
  }, [authFetch, clearFeedback, confirmData, fetchOverview, showFeedback]);

  const usuariosActivos = useMemo(() => usuarios.filter((usuario) => usuario.estado !== 1), [usuarios]);

  return (
    <div className={styles.panel}>
      <CatalogToast feedback={feedback} theme={theme} onClose={clearFeedback} />

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={`text-lg font-semibold ${styles.heading}`}>Cajas asignadas a usuarios</h2>
            <p className={`text-xs ${styles.subheading}`}>
              Administra qué usuarios pueden operar una caja específica.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchOverview}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${styles.pill}`}
          >
            Actualizar
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* Tabla de asignaciones */}
          <section className={`${styles.section} overflow-hidden`}>
            <div className="grid grid-cols-[180px_1fr_120px] border-b border-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              <span>Caja</span>
              <span>Usuario</span>
              <span className="text-center">Acciones</span>
            </div>

            <div className={`divide-y ${styles.divider}`}>
              {loading && (
                <div className="flex justify-center py-6">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                </div>
              )}

              {!loading && asignaciones.length === 0 && (
                <p className={`px-4 py-6 text-center text-xs ${styles.subheading}`}>
                  Aún no se registraron asignaciones.
                </p>
              )}

              {asignaciones.map((asignacion) => (
                <div
                  key={`${asignacion.cajaCodigo}-${asignacion.usuarioCodigo}`}
                  className={`grid grid-cols-[180px_1fr_120px] items-center gap-2 px-4 py-2 text-sm ${styles.textPrimary} ${styles.hoverLift}`}
                >
                  <div>
                    <p className="font-semibold">{asignacion.cajaDescripcion}</p>
                    <p className={`text-xs ${styles.textSecondary}`}>Cod: {asignacion.cajaCodigo}</p>
                  </div>
                  <div>
                    <p className="font-semibold">@{asignacion.usuarioUsername}</p>
                    <p className={`text-xs ${styles.textSecondary}`}>
                      {asignacion.usuarioNombre} {asignacion.usuarioApellido}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleConfirmRemove(asignacion)}
                      className="rounded-full border border-rose-500/60 px-3 py-1 text-[10px] font-semibold text-rose-200 transition hover:bg-rose-500 hover:text-white disabled:opacity-60"
                      disabled={saving}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Formulario de asignación */}
          <section className={`${styles.section} space-y-4 p-5`}>
            <h3 className={`text-sm font-semibold ${styles.heading}`}>Asignar caja a usuario</h3>
            <form className="space-y-4" onSubmit={handleAssign}>
              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                Caja
                <select
                  value={selectedCaja ?? ''}
                  onChange={(e) => setSelectedCaja(e.target.value ? Number(e.target.value) : null)}
                  className={`${styles.input} px-3 py-2`}
                >
                  <option value="">Selecciona una caja...</option>
                  {cajas.map((caja) => (
                    <option key={caja.codigo} value={caja.codigo}>
                      {caja.descripcion}
                    </option>
                  ))}
                </select>
              </label>

              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                Usuario
                <select
                  value={selectedUsuario ?? ''}
                  onChange={(e) => setSelectedUsuario(e.target.value ? Number(e.target.value) : null)}
                  className={`${styles.input} px-3 py-2`}
                >
                  <option value="">Selecciona un usuario...</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario.codigo} value={usuario.codigo}>
                      @{usuario.username} — {usuario.nombre} {usuario.apellido}
                      {usuario.estado === 1 ? ' (inactivo)' : ''}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={
                    saving || !selectedCaja || !selectedUsuario || usuariosActivos.length === 0 || cajas.length === 0
                  }
                  className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
                >
                  Asignar
                </button>
                <button
                  type="button"
                  onClick={fetchOverview}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${styles.pill}`}
                >
                  Restablecer
                </button>
              </div>
            </form>

            <div
              className={`${styles.mutedSurface} space-y-2 rounded-xl border border-dashed border-indigo-500/40 bg-indigo-500/5 p-4`}
            >
              <p className={`text-xs ${styles.textSecondary}`}>
                Usuarios activos disponibles: {usuariosActivos.length} / {usuarios.length}
              </p>
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmData !== null}
        theme={theme}
        title="Quitar asignación"
        description={
          confirmData ? (
            <span>
              Se eliminará la relación <strong>{confirmData.resumen}</strong>. Esta acción no se puede deshacer.
            </span>
          ) : (
            'Esta acción no se puede deshacer.'
          )
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        busy={saving}
        onCancel={() => setConfirmData(null)}
        onConfirm={handleRemove}
        tone="danger"
      />
    </div>
  );
};

export default CajaUsuarioManager;
