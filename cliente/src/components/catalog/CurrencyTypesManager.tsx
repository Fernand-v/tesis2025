'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDashboard } from '../dashboard/DashboardContext';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { useCatalogStyles } from './catalog-ui';
import CatalogToast from './CatalogToast';
import ConfirmDialog from './ConfirmDialog';
import { useFeedbackFlash } from '@/hooks/useFeedbackFlash';

interface CurrencyType {
  codigo: number;
  denominacion: string;
  tasa: number;
  simbolo: string;
}

interface CurrencyFormState {
  denominacion: string;
  tasa: string;
  simbolo: string;
}

const DEFAULT_FORM: CurrencyFormState = {
  denominacion: '',
  tasa: '',
  simbolo: '',
};

const CurrencyTypesManager = () => {
  const { setPageTitle, theme } = useDashboard();
  const authFetch = useAuthFetch();
  const styles = useCatalogStyles(theme);
  const { feedback, showFeedback, clearFeedback } = useFeedbackFlash();

  const [monedas, setMonedas] = useState<CurrencyType[]>([]);
  const [formState, setFormState] = useState<CurrencyFormState>(DEFAULT_FORM);
  const [editingCodigo, setEditingCodigo] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      }),
    [],
  );

  const fetchMonedas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch('/catalog/currencies');
      const data = (await response.json()) as { monedas?: CurrencyType[] };
      setMonedas(data.monedas ?? []);
    } catch (err) {
      showFeedback((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, showFeedback]);

  useEffect(() => {
    setPageTitle('Tipos de moneda');
    void fetchMonedas();
    return () => setPageTitle('Sistema General');
  }, [fetchMonedas, setPageTitle]);

  const resetForm = useCallback(() => {
    setFormState(DEFAULT_FORM);
    setEditingCodigo(null);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { denominacion, tasa, simbolo } = formState;

    if (!denominacion.trim() || !tasa.trim() || !simbolo.trim()) {
      showFeedback('Todos los campos son obligatorios.', 'error');
      return;
    }

    const tasaNumber = Number(tasa);
    if (!Number.isFinite(tasaNumber) || tasaNumber <= 0) {
      showFeedback('La tasa debe ser numerica y mayor a cero.', 'error');
      return;
    }

    setSaving(true);

    const payload = {
      denominacion: denominacion.trim(),
      tasa: tasaNumber,
      simbolo: simbolo.trim(),
    };

    try {
      if (editingCodigo === null) {
        await authFetch('/catalog/currencies', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showFeedback('Tipo de moneda creado.');
      } else {
        await authFetch(`/catalog/currencies/${editingCodigo}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showFeedback('Tipo de moneda actualizado.');
      }

      resetForm();
      await fetchMonedas();
    } catch (err) {
      showFeedback((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = useCallback(
    (moneda: CurrencyType) => {
      setEditingCodigo(moneda.codigo);
      setFormState({
        denominacion: moneda.denominacion,
        tasa: moneda.tasa.toString(),
        simbolo: moneda.simbolo,
      });
      clearFeedback();
    },
    [clearFeedback],
  );

  const handleDelete = useCallback(async () => {
    if (confirmDelete === null) return;

    setSaving(true);
    try {
      await authFetch(`/catalog/currencies/${confirmDelete}`, { method: 'DELETE' });
      if (editingCodigo === confirmDelete) {
        resetForm();
      }
      showFeedback('Tipo de moneda eliminado.');
      await fetchMonedas();
    } catch (err) {
      showFeedback((err as Error).message, 'error');
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  }, [authFetch, confirmDelete, editingCodigo, fetchMonedas, resetForm, showFeedback]);

  return (
    <div className={styles.panel}>
      <CatalogToast feedback={feedback} theme={theme} onClose={clearFeedback} />

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={`text-lg font-semibold ${styles.heading}`}>Tipos de moneda</h2>
            <p className={`text-xs ${styles.subheading}`}>
              Gestiona las monedas y tasas utilizadas en el sistema.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchMonedas}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${styles.pill}`}
          >
            Actualizar
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className={`${styles.section} overflow-hidden`}>
            <div className="grid grid-cols-[80px_1fr_120px_80px] border-b border-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              <span>Codigo</span>
              <span>Denominacion</span>
              <span>Tasa</span>
              <span className="text-center">Acciones</span>
            </div>
            <div className={`divide-y ${styles.divider}`}>
              {loading && (
                <div className="flex justify-center py-6">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                </div>
              )}
              {!loading && monedas.length === 0 && (
                <p className={`px-4 py-6 text-center text-xs ${styles.subheading}`}>
                  No hay tipos de moneda registrados.
                </p>
              )}
              {monedas.map((moneda) => (
                <div
                  key={moneda.codigo}
                  className={`grid grid-cols-[80px_1fr_120px_80px] items-center gap-2 px-4 py-2 text-sm ${styles.textPrimary} ${styles.hoverLift}`}
                >
                  <span className="text-xs opacity-60">{moneda.codigo}</span>
                  <div>
                    <p className="font-medium">{moneda.denominacion}</p>
                    <p className={`text-xs ${styles.textSecondary}`}>{moneda.simbolo}</p>
                  </div>
                  <span className="text-xs font-semibold">
                    {numberFormatter.format(moneda.tasa)}
                  </span>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(moneda)}
                      className="rounded-full border border-indigo-500/60 px-3 py-1 text-[10px] font-semibold text-indigo-200 transition hover:bg-indigo-500 hover:text-white"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(moneda.codigo)}
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
              {editingCodigo === null ? 'Nueva moneda' : `Editar moneda #${editingCodigo}`}
            </h3>

            <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
              Denominacion
              <input
                value={formState.denominacion}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, denominacion: event.target.value }))
                }
                placeholder="Guarani paraguayo"
                className={`${styles.input} px-3 py-2`}
              />
            </label>

            <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
              Tasa de cambio
              <input
                type="number"
                step="0.0001"
                min="0"
                value={formState.tasa}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, tasa: event.target.value }))
                }
                placeholder="1.0000"
                className={`${styles.input} px-3 py-2`}
              />
            </label>

            <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
              Simbolo
              <input
                value={formState.simbolo}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, simbolo: event.target.value }))
                }
                placeholder="Gs."
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
        title="Eliminar tipo de moneda"
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

export default CurrencyTypesManager;

