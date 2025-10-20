'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDashboard } from '../dashboard/DashboardContext';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { useCatalogStyles } from './catalog-ui';
import CatalogToast from './CatalogToast';
import ConfirmDialog from './ConfirmDialog';
import { useFeedbackFlash } from '@/hooks/useFeedbackFlash';

interface Falla {
  codigo: number;
  descripcion: string;
}

const FallasManager = () => {
  const { setPageTitle, theme } = useDashboard();
  const authFetch = useAuthFetch();
  const styles = useCatalogStyles(theme);
  const { feedback, showFeedback, clearFeedback } = useFeedbackFlash();

  const [fallas, setFallas] = useState<Falla[]>([]);
  const [descripcion, setDescripcion] = useState('');
  const [editingCodigo, setEditingCodigo] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const fetchFallas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch('/catalog/fallas');
      const data = (await response.json()) as { fallas?: Falla[] };
      setFallas(data.fallas ?? []);
    } catch (err) {
      showFeedback((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, showFeedback]);

  useEffect(() => {
    setPageTitle('Fallas');
    void fetchFallas();
    return () => setPageTitle('Sistema General');
  }, [fetchFallas, setPageTitle]);

  const resetForm = useCallback(() => {
    setDescripcion('');
    setEditingCodigo(null);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = descripcion.trim();

    if (!value) {
      showFeedback('La descripcion es obligatoria.', 'error');
      return;
    }

    setSaving(true);

    try {
      if (editingCodigo === null) {
        await authFetch('/catalog/fallas', {
          method: 'POST',
          body: JSON.stringify({ descripcion: value }),
        });
        showFeedback('Falla creada.');
      } else {
        await authFetch(`/catalog/fallas/${editingCodigo}`, {
          method: 'PUT',
          body: JSON.stringify({ descripcion: value }),
        });
        showFeedback('Falla actualizada.');
      }

      resetForm();
      await fetchFallas();
    } catch (err) {
      showFeedback((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = useCallback(
    (falla: Falla) => {
      setEditingCodigo(falla.codigo);
      setDescripcion(falla.descripcion);
      clearFeedback();
    },
    [clearFeedback],
  );

  const handleDelete = useCallback(async () => {
    if (confirmDelete === null) return;

    setSaving(true);
    try {
      await authFetch(`/catalog/fallas/${confirmDelete}`, { method: 'DELETE' });
      if (editingCodigo === confirmDelete) {
        resetForm();
      }
      showFeedback('Falla eliminada.');
      await fetchFallas();
    } catch (err) {
      showFeedback((err as Error).message, 'error');
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  }, [authFetch, confirmDelete, editingCodigo, fetchFallas, resetForm, showFeedback]);

  return (
    <div className={styles.panel}>
      <CatalogToast feedback={feedback} theme={theme} onClose={clearFeedback} />

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={`text-lg font-semibold ${styles.heading}`}>Catalogo de fallas</h2>
            <p className={`text-xs ${styles.subheading}`}>
              Utilizadas para diagnosticos y presupuestos de servicio.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchFallas}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${styles.pill}`}
          >
            Actualizar
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className={`${styles.section} overflow-hidden`}>
            <div className="grid grid-cols-[80px_1fr_100px] border-b border-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              <span>Codigo</span>
              <span>Descripcion</span>
              <span className="text-center">Acciones</span>
            </div>
            <div className={`divide-y ${styles.divider}`}>
              {loading && (
                <div className="flex justify-center py-6">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                </div>
              )}
              {!loading && fallas.length === 0 && (
                <p className={`px-4 py-6 text-center text-xs ${styles.subheading}`}>
                  Aun no se registraron fallas.
                </p>
              )}
              {fallas.map((falla) => (
                <div
                  key={falla.codigo}
                  className={`grid grid-cols-[80px_1fr_100px] items-center gap-2 px-4 py-2 text-sm ${styles.textPrimary} ${styles.hoverLift}`}
                >
                  <span className="text-xs opacity-60">{falla.codigo}</span>
                  <span>{falla.descripcion}</span>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(falla)}
                      className="rounded-full border border-indigo-500/60 px-3 py-1 text-[10px] font-semibold text-indigo-200 transition hover:bg-indigo-500 hover:text-white"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(falla.codigo)}
                      className="rounded-full border border-rose-500/60 px-3 py-1 text-[10px] font-semibold text-rose-200 transition hover:bg-rose-500 hover:text-white disabled:opacity-60"
                      disabled={saving}
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <form onSubmit={handleSubmit} className={`${styles.section} space-y-4 p-5`}>
            <h3 className={`text-sm font-semibold ${styles.heading}`}>
              {editingCodigo === null ? 'Nueva falla' : `Editar falla #${editingCodigo}`}
            </h3>
            <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
              Descripcion
              <input
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                placeholder="Ej: Equipo no enciende"
                className={`${styles.input} px-3 py-2`}
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
              >
                {editingCodigo === null ? 'Crear' : 'Guardar'}
              </button>
              {editingCodigo !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${styles.pill}`}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        theme={theme}
        title="Eliminar falla"
        description="Esta accion no se puede deshacer. El registro se quitara permanentemente."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        busy={saving}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        tone="danger"
      />
    </div>
  );
};

export default FallasManager;

