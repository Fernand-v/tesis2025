'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDashboard } from '../dashboard/DashboardContext';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { useCatalogStyles } from './catalog-ui';
import CatalogToast from './CatalogToast';
import ConfirmDialog from './ConfirmDialog';
import { useFeedbackFlash } from '@/hooks/useFeedbackFlash';

interface ProgramType {
  codigo: number;
  descripcion: string;
}

interface ProgramRecord {
  codigo: number;
  descripcion: string;
  ubicacion: string;
  formulario: string;
  habilitado: number;
  tipoCodigo: number;
  tipoDescripcion: string;
}

interface ProgramFormState {
  descripcion: string;
  ubicacion: string;
  formulario: string;
  habilitado: boolean;
  tipoCodigo: number | '';
}

const DEFAULT_FORM: ProgramFormState = {
  descripcion: '',
  ubicacion: '',
  formulario: '',
  habilitado: true,
  tipoCodigo: '',
};

const ProgramManager = () => {
  const { setPageTitle, theme } = useDashboard();
  const authFetch = useAuthFetch();
  const styles = useCatalogStyles(theme);
  const { feedback, showFeedback, clearFeedback } = useFeedbackFlash();

  const [programas, setProgramas] = useState<ProgramRecord[]>([]);
  const [tipos, setTipos] = useState<ProgramType[]>([]);
  const [formState, setFormState] = useState<ProgramFormState>(DEFAULT_FORM);
  const [editingCodigo, setEditingCodigo] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const fetchProgramas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch('/catalog/programs');
      const data = (await response.json()) as { programas?: ProgramRecord[]; tipos?: ProgramType[] };
      setProgramas(data.programas ?? []);
      setTipos(data.tipos ?? []);
      setFormState((prev) => ({
        ...prev,
        tipoCodigo:
          prev.tipoCodigo !== '' && (data.tipos ?? []).some((tipo) => tipo.codigo === prev.tipoCodigo)
            ? prev.tipoCodigo
            : data.tipos?.[0]?.codigo ?? '',
      }));
    } catch (error) {
      showFeedback((error as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, showFeedback]);

  useEffect(() => {
    setPageTitle('Programas');
    void fetchProgramas();
    return () => setPageTitle('Sistema General');
  }, [fetchProgramas, setPageTitle]);

  const resetForm = useCallback(() => {
    setFormState({
      ...DEFAULT_FORM,
      tipoCodigo: tipos[0]?.codigo ?? '',
    });
    setEditingCodigo(null);
  }, [tipos]);

  const handleChange = <K extends keyof ProgramFormState>(field: K, value: ProgramFormState[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formState.descripcion.trim()) {
      showFeedback('La descripcion es obligatoria.', 'error');
      return false;
    }

    if (!formState.ubicacion.trim()) {
      showFeedback('La ubicacion es obligatoria.', 'error');
      return false;
    }

    if (!formState.formulario.trim()) {
      showFeedback('El nombre del formulario es obligatorio.', 'error');
      return false;
    }

    if (formState.tipoCodigo === '') {
      showFeedback('Selecciona un tipo de programa.', 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    clearFeedback();

    const payload = {
      descripcion: formState.descripcion.trim(),
      ubicacion: formState.ubicacion.trim(),
      formulario: formState.formulario.trim(),
      habilitado: formState.habilitado ? 1 : 0,
      tipoCodigo: Number(formState.tipoCodigo),
    };

    try {
      if (editingCodigo === null) {
        await authFetch('/catalog/programs', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showFeedback('Programa creado.');
      } else {
        const response = await authFetch(`/catalog/programs/${editingCodigo}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (response.status === 404) {
          showFeedback('Programa no encontrado.', 'error');
        } else {
          showFeedback('Programa actualizado.');
        }
      }

      resetForm();
      await fetchProgramas();
    } catch (error) {
      showFeedback((error as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (programa: ProgramRecord) => {
    setEditingCodigo(programa.codigo);
    setFormState({
      descripcion: programa.descripcion,
      ubicacion: programa.ubicacion,
      formulario: programa.formulario,
      habilitado: programa.habilitado === 1,
      tipoCodigo: programa.tipoCodigo,
    });
    clearFeedback();
  };

  const handleDelete = useCallback(async () => {
    if (confirmDelete === null) return;
    setSaving(true);
    clearFeedback();
    try {
      const response = await authFetch(`/catalog/programs/${confirmDelete}`, { method: 'DELETE' });
      if (response.status === 404) {
        showFeedback('Programa no encontrado.', 'error');
      } else {
        showFeedback('Programa eliminado.');
        if (editingCodigo === confirmDelete) {
          resetForm();
        }
        await fetchProgramas();
      }
    } catch (error) {
      showFeedback((error as Error).message, 'error');
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  }, [authFetch, clearFeedback, confirmDelete, editingCodigo, fetchProgramas, resetForm, showFeedback]);

  const tipoOptions = useMemo(() => tipos, [tipos]);

  return (
    <div className={styles.panel}>
      <CatalogToast feedback={feedback} theme={theme} onClose={clearFeedback} />

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={`text-lg font-semibold ${styles.heading}`}>Programas</h2>
            <p className={`text-xs ${styles.subheading}`}>
              Gestiona los programas disponibles en el sistema y su visibilidad.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchProgramas}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${styles.pill}`}
          >
            Actualizar
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className={`${styles.section} overflow-hidden`}>
            <div className="grid grid-cols-[80px_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_120px] border-b border-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              <span>Codigo</span>
              <span>Programa</span>
              <span>Formulario</span>
              <span>Tipo</span>
              <span className="text-center">Acciones</span>
            </div>

            <div className={`divide-y ${styles.divider}`}>
              {loading && (
                <div className="flex justify-center py-6">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                </div>
              )}

              {!loading && programas.length === 0 && (
                <p className={`px-4 py-6 text-center text-xs ${styles.subheading}`}>
                  Aun no se registraron programas.
                </p>
              )}

              {programas.map((programa) => (
                <div
                  key={programa.codigo}
                  className={`grid grid-cols-[80px_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_120px] items-center gap-3 px-4 py-3 text-sm ${styles.textPrimary} ${styles.hoverLift}`}
                >
                  <span className="text-xs opacity-70">#{programa.codigo}</span>
                  <div>
                    <p className="font-semibold">{programa.descripcion}</p>
                    <p className={`text-xs ${styles.textSecondary}`}>Ruta: {programa.ubicacion}</p>
                  </div>
                  <span className={`text-xs ${styles.textSecondary}`}>{programa.formulario}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-semibold ${styles.textSecondary}`}>
                      {programa.tipoDescripcion}
                    </span>
                    <span
                      className={`${styles.pill} ${
                        programa.habilitado === 1
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200'
                          : 'border-slate-500/60 bg-slate-500/10 text-slate-200'
                      }`}
                    >
                      {programa.habilitado === 1 ? 'Habilitado' : 'Oculto'}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(programa)}
                      className="rounded-full border border-indigo-500/60 px-3 py-1 text-[10px] font-semibold text-indigo-200 transition hover:bg-indigo-500 hover:text-white"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(programa.codigo)}
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

          <form onSubmit={handleSubmit} className={`${styles.section} space-y-4 p-6`}>
            <h3 className={`text-sm font-semibold ${styles.heading}`}>
              {editingCodigo === null ? 'Nuevo programa' : `Editar programa #${editingCodigo}`}
            </h3>

            <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
              Descripcion *
              <input
                value={formState.descripcion}
                onChange={(event) => handleChange('descripcion', event.target.value)}
                className={`${styles.input} px-3 py-2`}
                placeholder="Ej: Gestion de inventario"
              />
            </label>

            <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
              Ubicacion *
              <input
                value={formState.ubicacion}
                onChange={(event) => handleChange('ubicacion', event.target.value)}
                className={`${styles.input} px-3 py-2`}
                placeholder="rutas/inventario"
              />
            </label>

            <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
              Formulario *
              <input
                value={formState.formulario}
                onChange={(event) => handleChange('formulario', event.target.value)}
                className={`${styles.input} px-3 py-2`}
                placeholder="InventarioPage"
              />
            </label>

            <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
              Tipo *
              <select
                value={formState.tipoCodigo}
                onChange={(event) =>
                  handleChange('tipoCodigo', event.target.value === '' ? '' : Number(event.target.value))
                }
                className={`${styles.input} px-3 py-2`}
              >
                {tipoOptions.length === 0 ? <option value="">Sin tipos</option> : null}
                {tipoOptions.map((tipo) => (
                  <option key={tipo.codigo} value={tipo.codigo}>
                    {tipo.descripcion}
                  </option>
                ))}
              </select>
            </label>

            <label className={`flex items-center gap-2 text-sm ${styles.textSecondary}`}>
              <input
                type="checkbox"
                checked={formState.habilitado}
                onChange={(event) => handleChange('habilitado', event.target.checked)}
                className="h-4 w-4 rounded border border-slate-600 bg-transparent text-indigo-500 focus:ring-indigo-500"
              />
              Visible en el menu
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={
                  saving || tipoOptions.length === 0 || formState.tipoCodigo === '' || tipos.length === 0
                }
                className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
              >
                {editingCodigo === null ? 'Crear' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${styles.pill}`}
              >
                Limpiar
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        theme={theme}
        title="Eliminar programa"
        description="Esta accion no se puede deshacer. El programa se eliminara permanentemente."
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

export default ProgramManager;

