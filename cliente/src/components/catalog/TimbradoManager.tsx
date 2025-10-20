'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useDashboard } from '../dashboard/DashboardContext';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { useCatalogStyles } from './catalog-ui';
import CatalogToast from './CatalogToast';
import ConfirmDialog from './ConfirmDialog';
import { useFeedbackFlash } from '@/hooks/useFeedbackFlash';

interface Timbrado {
  codigo: number;
  numero: string;
  fechaInicio: string;
  fechaFin: string;
  digitoDesde: string;
  digitoHasta: string;
  activo: string;
  autorizacion: string;
  puntoExpedicion: number;
  establecimiento: number;
}

interface FormState {
  numero: string;
  fechaInicio: string;
  fechaFin: string;
  digitoDesde: string;
  digitoHasta: string;
  activo: string;
  autorizacion: string;
  puntoExpedicion: string;
  establecimiento: string;
}

const EMPTY_FORM: FormState = {
  numero: '',
  fechaInicio: '',
  fechaFin: '',
  digitoDesde: '',
  digitoHasta: '',
  activo: 'S',
  autorizacion: '',
  puntoExpedicion: '',
  establecimiento: '',
};

const formatDate = (value: string): string => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10);
  }
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
};

const normalizeDate = (value: string): string => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10);
  }
  return parsed.toISOString().slice(0, 10);
};

const TimbradoManager = () => {
  const { setPageTitle, theme } = useDashboard();
  const authFetch = useAuthFetch();
  const styles = useCatalogStyles(theme);
  const { feedback, showFeedback, clearFeedback } = useFeedbackFlash();

  const [timbrados, setTimbrados] = useState<Timbrado[]>([]);
  const [formState, setFormState] = useState<FormState>(EMPTY_FORM);
  const [editingCodigo, setEditingCodigo] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Timbrado | null>(null);

  const statusBadgeClass = useMemo<Record<'active' | 'inactive', string>>(
    () =>
      theme === 'dark'
        ? {
            active: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200',
            inactive: 'border-rose-500/60 bg-rose-500/10 text-rose-200',
          }
        : {
            active: 'border-emerald-400 bg-emerald-100 text-emerald-800',
            inactive: 'border-rose-400 bg-rose-100 text-rose-800',
          },
    [theme],
  );

  const fetchTimbrados = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch('/catalog/timbrados');
      const data = (await response.json()) as { timbrados?: Timbrado[] };
      setTimbrados(data.timbrados ?? []);
    } catch (err) {
      showFeedback((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, showFeedback]);

  useEffect(() => {
    setPageTitle('Timbrados');
    void fetchTimbrados();
    return () => setPageTitle('Sistema General');
  }, [fetchTimbrados, setPageTitle]);

  const resetForm = useCallback(() => {
    setFormState(EMPTY_FORM);
    setEditingCodigo(null);
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (state: FormState): string | null => {
    if (
      !state.numero.trim() ||
      !state.fechaInicio ||
      !state.fechaFin ||
      !state.digitoDesde.trim() ||
      !state.digitoHasta.trim() ||
      !state.autorizacion.trim() ||
      !state.puntoExpedicion.trim() ||
      !state.establecimiento.trim()
    ) {
      return 'Todos los campos son obligatorios.';
    }

    const punto = Number(state.puntoExpedicion);
    const estab = Number(state.establecimiento);
    if (!Number.isFinite(punto) || punto < 0 || !Number.isFinite(estab) || estab < 0) {
      return 'El punto de expedicion y el establecimiento deben ser numeros validos.';
    }

    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errorText = validateForm(formState);
    if (errorText) {
      showFeedback(errorText, 'error');
      return;
    }

    setSaving(true);

    const payload = {
      numero: formState.numero.trim(),
      fechaInicio: normalizeDate(formState.fechaInicio),
      fechaFin: normalizeDate(formState.fechaFin),
      digitoDesde: formState.digitoDesde.trim(),
      digitoHasta: formState.digitoHasta.trim(),
      activo: formState.activo,
      autorizacion: formState.autorizacion.trim(),
      puntoExpedicion: Number(formState.puntoExpedicion),
      establecimiento: Number(formState.establecimiento),
    };

    try {
      if (editingCodigo === null) {
        await authFetch('/catalog/timbrados', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showFeedback('Timbrado creado.');
      } else {
        await authFetch(`/catalog/timbrados/${editingCodigo}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showFeedback('Timbrado actualizado.');
      }

      resetForm();
      await fetchTimbrados();
    } catch (err) {
      showFeedback((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = useCallback(
    (timbrado: Timbrado) => {
      setEditingCodigo(timbrado.codigo);
      setFormState({
        numero: timbrado.numero,
        fechaInicio: normalizeDate(timbrado.fechaInicio),
        fechaFin: normalizeDate(timbrado.fechaFin),
        digitoDesde: timbrado.digitoDesde,
        digitoHasta: timbrado.digitoHasta,
        activo: timbrado.activo,
        autorizacion: timbrado.autorizacion,
        puntoExpedicion: timbrado.puntoExpedicion.toString(),
        establecimiento: timbrado.establecimiento.toString(),
      });
      clearFeedback();
    },
    [clearFeedback],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await authFetch(`/catalog/timbrados/${deleteTarget.codigo}`, { method: 'DELETE' });
      if (editingCodigo === deleteTarget.codigo) {
        resetForm();
      }
      showFeedback('Timbrado eliminado.');
      await fetchTimbrados();
    } catch (err) {
      showFeedback((err as Error).message, 'error');
    } finally {
      setSaving(false);
      setDeleteTarget(null);
    }
  }, [authFetch, deleteTarget, editingCodigo, fetchTimbrados, resetForm, showFeedback]);

  return (
    <div className={styles.panel}>
      <CatalogToast feedback={feedback} theme={theme} onClose={clearFeedback} />

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={`text-lg font-semibold ${styles.heading}`}>Timbrados</h2>
            <p className={`text-xs ${styles.subheading}`}>
              Controla los timbrados activos y su informacion de vigencia.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchTimbrados}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${styles.pill}`}
          >
            Actualizar
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className={`${styles.section} overflow-hidden`}>
            <div className="grid grid-cols-[100px_1fr_120px] border-b border-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              <span>Codigo</span>
              <span>Detalle</span>
              <span className="text-center">Acciones</span>
            </div>
            <div className={`divide-y ${styles.divider}`}>
              {loading && (
                <div className="flex justify-center py-6">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                </div>
              )}
              {!loading && timbrados.length === 0 && (
                <p className={`px-4 py-6 text-center text-xs ${styles.subheading}`}>
                  No hay timbrados registrados.
                </p>
              )}
              {timbrados.map((timbrado) => {
                const isEditing = editingCodigo === timbrado.codigo;
                const statusTone =
                  timbrado.activo === 'S' ? statusBadgeClass.active : statusBadgeClass.inactive;

                return (
                  <div
                    key={timbrado.codigo}
                    className={`grid grid-cols-[100px_1fr_120px] items-center gap-2 px-4 py-3 text-sm ${styles.textPrimary} ${styles.hoverLift} ${
                      isEditing ? 'ring-1 ring-indigo-400/60' : ''
                    }`}
                  >
                    <span className="text-xs font-semibold opacity-70">#{timbrado.codigo}</span>
                    <div className="space-y-1">
                      <p className="font-semibold">{timbrado.numero}</p>
                      <p className={`text-xs ${styles.textSecondary}`}>
                        {formatDate(timbrado.fechaInicio)} - {formatDate(timbrado.fechaFin)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className={`${styles.pill} ${statusTone}`}>
                          {timbrado.activo === 'S' ? 'Activo' : 'Inactivo'}
                        </span>
                        <span className={styles.textSecondary}>
                          Rangos {timbrado.digitoDesde} - {timbrado.digitoHasta}
                        </span>
                        <span className={styles.textSecondary}>
                          Pto {timbrado.puntoExpedicion} - Est {timbrado.establecimiento}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(timbrado)}
                        className="rounded-full border border-indigo-500/60 px-3 py-1 text-[10px] font-semibold text-indigo-200 transition hover:bg-indigo-500 hover:text-white"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(timbrado)}
                        className="rounded-full border border-rose-500/60 px-3 py-1 text-[10px] font-semibold text-rose-200 transition hover:bg-rose-500 hover:text-white disabled:opacity-60"
                        disabled={saving}
                      >
                        Borrar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <form onSubmit={handleSubmit} className={`${styles.section} space-y-4 p-5`}>
            <h3 className={`text-sm font-semibold ${styles.heading}`}>
              {editingCodigo === null ? 'Nuevo timbrado' : `Editar timbrado #${editingCodigo}`}
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                Numero
                <input
                  name="numero"
                  value={formState.numero}
                  onChange={handleChange}
                  placeholder="12345678"
                  className={`${styles.input} px-3 py-2`}
                />
              </label>

              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                Autorizacion
                <input
                  name="autorizacion"
                  value={formState.autorizacion}
                  onChange={handleChange}
                  placeholder="Resolucion..."
                  className={`${styles.input} px-3 py-2`}
                />
              </label>

              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                Fecha inicio
                <input
                  type="date"
                  name="fechaInicio"
                  value={formState.fechaInicio}
                  onChange={handleChange}
                  className={`${styles.input} px-3 py-2`}
                />
              </label>

              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                Fecha fin
                <input
                  type="date"
                  name="fechaFin"
                  value={formState.fechaFin}
                  onChange={handleChange}
                  className={`${styles.input} px-3 py-2`}
                />
              </label>

              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                Digito desde
                <input
                  name="digitoDesde"
                  value={formState.digitoDesde}
                  onChange={handleChange}
                  placeholder="0000001"
                  className={`${styles.input} px-3 py-2`}
                />
              </label>

              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                Digito hasta
                <input
                  name="digitoHasta"
                  value={formState.digitoHasta}
                  onChange={handleChange}
                  placeholder="9999999"
                  className={`${styles.input} px-3 py-2`}
                />
              </label>

              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                Punto de expedicion
                <input
                  name="puntoExpedicion"
                  type="number"
                  value={formState.puntoExpedicion}
                  onChange={handleChange}
                  placeholder="1"
                  className={`${styles.input} px-3 py-2`}
                />
              </label>

              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                Establecimiento
                <input
                  name="establecimiento"
                  type="number"
                  value={formState.establecimiento}
                  onChange={handleChange}
                  placeholder="1"
                  className={`${styles.input} px-3 py-2`}
                />
              </label>

              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                Estado
                <select
                  name="activo"
                  value={formState.activo}
                  onChange={handleChange}
                  className={`${styles.input} px-3 py-2`}
                >
                  <option value="S">Activo</option>
                  <option value="N">Inactivo</option>
                </select>
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
              >
                {editingCodigo === null ? 'Crear' : 'Guardar cambios'}
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
        open={deleteTarget !== null}
        theme={theme}
        title="Eliminar timbrado"
        description={
          deleteTarget ? (
            <span>
              Se eliminara el timbrado <strong>{deleteTarget.numero}</strong> (codigo #
              {deleteTarget.codigo}). Esta accion no se puede deshacer.
            </span>
          ) : (
            'Esta accion no se puede deshacer.'
          )
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        busy={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        tone="danger"
      />
    </div>
  );
};

export default TimbradoManager;
