'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDashboard } from '../dashboard/DashboardContext';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { useCatalogStyles } from './catalog-ui';
import CatalogToast from './CatalogToast';
import ConfirmDialog from './ConfirmDialog';
import { useFeedbackFlash } from '@/hooks/useFeedbackFlash';

interface Marca {
  codigo: number;
  descripcion: string;
}

const MarcaManager = () => {
  const { setPageTitle, theme } = useDashboard();
  const authFetch = useAuthFetch();
  const styles = useCatalogStyles(theme);
  const { feedback, showFeedback, clearFeedback } = useFeedbackFlash();

  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [descripcion, setDescripcion] = useState('');
  const [editingCodigo, setEditingCodigo] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const fetchMarcas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch('/catalog/inventory/brands');
      const data = (await response.json()) as { marcas?: Marca[] };
      setMarcas(data.marcas ?? []);
    } catch (error) {
      showFeedback((error as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, showFeedback]);

  useEffect(() => {
    setPageTitle('Marcas');
    void fetchMarcas();
    return () => setPageTitle('Sistema General');
  }, [fetchMarcas, setPageTitle]);

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
    clearFeedback();

    try {
      if (editingCodigo === null) {
        await authFetch('/catalog/inventory/brands', {
          method: 'POST',
          body: JSON.stringify({ descripcion: value }),
        });
        showFeedback('Marca creada.');
      } else {
        const response = await authFetch(`/catalog/inventory/brands/${editingCodigo}`, {
          method: 'PUT',
          body: JSON.stringify({ descripcion: value }),
        });
        if (response.status === 404) {
          showFeedback('Marca no encontrada.', 'error');
        } else {
          showFeedback('Marca actualizada.');
        }
      }

      resetForm();
      await fetchMarcas();
    } catch (error) {
      showFeedback((error as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (marca: Marca) => {
    setEditingCodigo(marca.codigo);
    setDescripcion(marca.descripcion);
    clearFeedback();
  };

  const handleDelete = useCallback(async () => {
    if (confirmDelete === null) return;
    setSaving(true);
    clearFeedback();
    try {
      const response = await authFetch(`/catalog/inventory/brands/${confirmDelete}`, { method: 'DELETE' });
      if (response.status === 404) {
        showFeedback('Marca no encontrada.', 'error');
      } else {
        showFeedback('Marca eliminada.');
        if (editingCodigo === confirmDelete) {
          resetForm();
        }
        await fetchMarcas();
      }
    } catch (error) {
      showFeedback((error as Error).message, 'error');
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  }, [authFetch, clearFeedback, confirmDelete, editingCodigo, fetchMarcas, resetForm, showFeedback]);

  return (
    <div className={styles.panel}>
      <CatalogToast feedback={feedback} theme={theme} onClose={clearFeedback} />

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={`text-lg font-semibold ${styles.heading}`}>Marcas</h2>
            <p className={`text-xs ${styles.subheading}`}>Lista de marcas utilizadas en tus productos.</p>
          </div>
          <button
            type="button"
            onClick={fetchMarcas}
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

              {!loading && marcas.length === 0 && (
                <p className={`px-4 py-6 text-center text-xs ${styles.subheading}`}>
                  Aun no se registraron marcas.
                </p>
              )}

              {marcas.map((marca) => (
                <div
                  key={marca.codigo}
                  className={`grid grid-cols-[80px_1fr_100px] items-center gap-2 px-4 py-2 text-sm ${styles.textPrimary} ${styles.hoverLift}`}
                >
                  <span className="text-xs opacity-70">{marca.codigo}</span>
                  <span>{marca.descripcion}</span>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(marca)}
                      className="rounded-full border border-indigo-500/60 px-3 py-1 text-[10px] font-semibold text-indigo-200 transition hover:bg-indigo-500 hover:text-white"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(marca.codigo)}
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
              {editingCodigo === null ? 'Nueva marca' : `Editar marca #${editingCodigo}`}
            </h3>

            <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
              Descripcion
              <input
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                className={`${styles.input} px-3 py-2`}
                placeholder="Ej: Lenovo"
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
        title="Eliminar marca"
        description="Esta accion no se puede deshacer. La marca se eliminara permanentemente."
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

export default MarcaManager;

