'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDashboard } from '../dashboard/DashboardContext';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { useCatalogStyles } from './catalog-ui';
import CatalogToast from './CatalogToast';
import ConfirmDialog from './ConfirmDialog';
import { useFeedbackFlash } from '@/hooks/useFeedbackFlash';

interface PaymentMethod {
  codigo: number;
  descripcion: string;
}

const PaymentMethodsManager = () => {
  const { setPageTitle, theme } = useDashboard();
  const authFetch = useAuthFetch();
  const styles = useCatalogStyles(theme);
  const { feedback, showFeedback, clearFeedback } = useFeedbackFlash();

  const [formas, setFormas] = useState<PaymentMethod[]>([]);
  const [descripcion, setDescripcion] = useState('');
  const [editingCodigo, setEditingCodigo] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const fetchFormas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch('/catalog/payment-methods');
      const data = (await response.json()) as { formas?: PaymentMethod[] };
      setFormas(data.formas ?? []);
    } catch (err) {
      showFeedback((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, showFeedback]);

  useEffect(() => {
    setPageTitle('Formas de pago');
    void fetchFormas();
    return () => setPageTitle('Sistema General');
  }, [fetchFormas, setPageTitle]);

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
        await authFetch('/catalog/payment-methods', {
          method: 'POST',
          body: JSON.stringify({ descripcion: value }),
        });
        showFeedback('Forma de pago creada.');
      } else {
        await authFetch(`/catalog/payment-methods/${editingCodigo}`, {
          method: 'PUT',
          body: JSON.stringify({ descripcion: value }),
        });
        showFeedback('Forma de pago actualizada.');
      }

      resetForm();
      await fetchFormas();
    } catch (err) {
      showFeedback((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = useCallback(
    (forma: PaymentMethod) => {
      setEditingCodigo(forma.codigo);
      setDescripcion(forma.descripcion);
      clearFeedback();
    },
    [clearFeedback],
  );

  const handleDelete = useCallback(async () => {
    if (confirmDelete === null) return;

    setSaving(true);
    try {
      await authFetch(`/catalog/payment-methods/${confirmDelete}`, { method: 'DELETE' });
      if (editingCodigo === confirmDelete) {
        resetForm();
      }
      showFeedback('Forma de pago eliminada.');
      await fetchFormas();
    } catch (err) {
      showFeedback((err as Error).message, 'error');
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  }, [authFetch, confirmDelete, editingCodigo, fetchFormas, resetForm, showFeedback]);

  return (
    <div className={styles.panel}>
      <CatalogToast feedback={feedback} theme={theme} onClose={clearFeedback} />

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={`text-lg font-semibold ${styles.heading}`}>Formas de pago</h2>
            <p className={`text-xs ${styles.subheading}`}>
              Gestiona las formas de pago disponibles en operaciones comerciales.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchFormas}
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
              {!loading && formas.length === 0 && (
                <p className={`px-4 py-6 text-center text-xs ${styles.subheading}`}>
                  Aun no se registraron formas de pago.
                </p>
              )}
              {formas.map((forma) => (
                <div
                  key={forma.codigo}
                  className={`grid grid-cols-[80px_1fr_100px] items-center gap-2 px-4 py-2 text-sm ${styles.textPrimary} ${styles.hoverLift}`}
                >
                  <span className="text-xs opacity-60">{forma.codigo}</span>
                  <span>{forma.descripcion}</span>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(forma)}
                      className="rounded-full border border-indigo-500/60 px-3 py-1 text-[10px] font-semibold text-indigo-200 transition hover:bg-indigo-500 hover:text-white"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(forma.codigo)}
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
              {editingCodigo === null ? 'Nueva forma' : `Editar forma #${editingCodigo}`}
            </h3>
            <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
              Descripcion
              <input
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                placeholder="Ej: Contado"
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
        title="Eliminar forma de pago"
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

export default PaymentMethodsManager;

