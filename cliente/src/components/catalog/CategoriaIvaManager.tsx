'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDashboard } from '../dashboard/DashboardContext';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { useCatalogStyles } from './catalog-ui';
import CatalogToast from './CatalogToast';
import ConfirmDialog from './ConfirmDialog';
import { useFeedbackFlash } from '@/hooks/useFeedbackFlash';

interface CategoriaIva {
  codigo: number;
  descripcion: string;
  tasa: number;
}

const CategoriaIvaManager = () => {
  const { setPageTitle, theme } = useDashboard();
  const authFetch = useAuthFetch();
  const styles = useCatalogStyles(theme);
  const { feedback, showFeedback, clearFeedback } = useFeedbackFlash();

  const [categorias, setCategorias] = useState<CategoriaIva[]>([]);
  const [descripcion, setDescripcion] = useState('');
  const [tasa, setTasa] = useState('');
  const [editingCodigo, setEditingCodigo] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const fetchCategorias = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch('/catalog/inventory/taxes');
      const data = (await response.json()) as { categorias?: CategoriaIva[] };
      setCategorias(data.categorias ?? []);
    } catch (error) {
      showFeedback((error as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, showFeedback]);

  useEffect(() => {
    setPageTitle('Categorias de IVA');
    void fetchCategorias();
    return () => setPageTitle('Sistema General');
  }, [fetchCategorias, setPageTitle]);

  const resetForm = useCallback(() => {
    setDescripcion('');
    setTasa('');
    setEditingCodigo(null);
  }, []);

  const validate = () => {
    if (!descripcion.trim()) {
      showFeedback('La descripcion es obligatoria.', 'error');
      return false;
    }

    const tasaValue = Number(tasa);
    if (!Number.isFinite(tasaValue) || tasaValue < 0) {
      showFeedback('La tasa debe ser un numero positivo.', 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    clearFeedback();

    const payload = {
      descripcion: descripcion.trim(),
      tasa: Number(tasa),
    };

    try {
      if (editingCodigo === null) {
        await authFetch('/catalog/inventory/taxes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showFeedback('Categoria creada.');
      } else {
        const response = await authFetch(`/catalog/inventory/taxes/${editingCodigo}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (response.status === 404) {
          showFeedback('Categoria no encontrada.', 'error');
        } else {
          showFeedback('Categoria actualizada.');
        }
      }

      resetForm();
      await fetchCategorias();
    } catch (error) {
      showFeedback((error as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (categoria: CategoriaIva) => {
    setEditingCodigo(categoria.codigo);
    setDescripcion(categoria.descripcion);
    setTasa(categoria.tasa.toString());
    clearFeedback();
  };

  const handleDelete = useCallback(async () => {
    if (confirmDelete === null) return;
    setSaving(true);
    clearFeedback();
    try {
      const response = await authFetch(`/catalog/inventory/taxes/${confirmDelete}`, { method: 'DELETE' });
      if (response.status === 404) {
        showFeedback('Categoria no encontrada.', 'error');
      } else {
        showFeedback('Categoria eliminada.');
        if (editingCodigo === confirmDelete) {
          resetForm();
        }
        await fetchCategorias();
      }
    } catch (error) {
      showFeedback((error as Error).message, 'error');
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  }, [authFetch, clearFeedback, confirmDelete, editingCodigo, fetchCategorias, resetForm, showFeedback]);

  return (
    <div className={styles.panel}>
      <CatalogToast feedback={feedback} theme={theme} onClose={clearFeedback} />

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={`text-lg font-semibold ${styles.heading}`}>Categorias de IVA</h2>
            <p className={`text-xs ${styles.subheading}`}>
              Define las tasas de IVA aplicables a tus productos y servicios.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchCategorias}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${styles.pill}`}
          >
            Actualizar
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className={`${styles.section} overflow-hidden`}>
            <div className="grid grid-cols-[80px_1fr_100px_110px] border-b border-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              <span>Codigo</span>
              <span>Descripcion</span>
              <span className="text-center">Tasa</span>
              <span className="text-center">Acciones</span>
            </div>

            <div className={`divide-y ${styles.divider}`}>
              {loading && (
                <div className="flex justify-center py-6">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                </div>
              )}

              {!loading && categorias.length === 0 && (
                <p className={`px-4 py-6 text-center text-xs ${styles.subheading}`}>
                  Aun no se registraron categorias de IVA.
                </p>
              )}

              {categorias.map((categoria) => (
                <div
                  key={categoria.codigo}
                  className={`grid grid-cols-[80px_1fr_100px_110px] items-center gap-2 px-4 py-2 text-sm ${styles.textPrimary} ${styles.hoverLift}`}
                >
                  <span className="text-xs opacity-70">{categoria.codigo}</span>
                  <span>{categoria.descripcion}</span>
                  <span className="text-center text-xs font-semibold text-emerald-400">
                    {categoria.tasa.toFixed(2)}%
                  </span>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(categoria)}
                      className="rounded-full border border-indigo-500/60 px-3 py-1 text-[10px] font-semibold text-indigo-200 transition hover:bg-indigo-500 hover:text-white"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(categoria.codigo)}
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
              {editingCodigo === null ? 'Nueva categoria' : `Editar categoria #${editingCodigo}`}
            </h3>

            <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
              Descripcion *
              <input
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                className={`${styles.input} px-3 py-2`}
                placeholder="IVA 10%"
              />
            </label>

            <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
              Tasa (%)
              <input
                type="number"
                min="0"
                step="0.01"
                value={tasa}
                onChange={(event) => setTasa(event.target.value)}
                className={`${styles.input} px-3 py-2`}
                placeholder="10"
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
        title="Eliminar categoria"
        description="Esta accion no se puede deshacer. El registro se eliminara de forma permanente."
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

export default CategoriaIvaManager;

