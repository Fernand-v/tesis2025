'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDashboard } from '../dashboard/DashboardContext';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { useCatalogStyles } from './catalog-ui';
import CatalogToast from './CatalogToast';
import ConfirmDialog from './ConfirmDialog';
import { useFeedbackFlash } from '@/hooks/useFeedbackFlash';

interface Modelo {
  codigo: number;
  descripcion: string;
}

interface Marca {
  codigo: number;
  descripcion: string;
}

interface Dispositivo {
  codigo: number;
  descripcion: string;
  modeloCodigo: number;
  modeloDescripcion: string;
  marcaCodigo: number;
  marcaDescripcion: string;
  ram: number;
  rom: number;
}

interface DeviceFormState {
  descripcion: string;
  modeloCodigo: number | '';
  marcaCodigo: number | '';
  ram: string;
  rom: string;
}

const DEFAULT_FORM: DeviceFormState = {
  descripcion: '',
  modeloCodigo: '',
  marcaCodigo: '',
  ram: '',
  rom: '',
};

const DispositivoManager = () => {
  const { setPageTitle, theme } = useDashboard();
  const authFetch = useAuthFetch();
  const styles = useCatalogStyles(theme);
  const { feedback, showFeedback, clearFeedback } = useFeedbackFlash();

  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [formState, setFormState] = useState<DeviceFormState>(DEFAULT_FORM);
  const [editingCodigo, setEditingCodigo] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch('/catalog/devices');
      const data = (await response.json()) as {
        dispositivos?: Dispositivo[];
        modelos?: Modelo[];
        marcas?: Marca[];
      };
      setDispositivos(data.dispositivos ?? []);
      setModelos(data.modelos ?? []);
      setMarcas(data.marcas ?? []);

      setFormState((prev) => ({
        ...prev,
        modeloCodigo:
          prev.modeloCodigo !== '' && (data.modelos ?? []).some((modelo) => modelo.codigo === prev.modeloCodigo)
            ? prev.modeloCodigo
            : data.modelos?.[0]?.codigo ?? '',
        marcaCodigo:
          prev.marcaCodigo !== '' && (data.marcas ?? []).some((marca) => marca.codigo === prev.marcaCodigo)
            ? prev.marcaCodigo
            : data.marcas?.[0]?.codigo ?? '',
      }));
    } catch (error) {
      showFeedback((error as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, showFeedback]);

  useEffect(() => {
    setPageTitle('Dispositivos');
    void fetchData();
    return () => setPageTitle('Sistema General');
  }, [fetchData, setPageTitle]);

  const resetForm = useCallback(() => {
    setFormState((prev) => ({
      ...DEFAULT_FORM,
      modeloCodigo: modelos[0]?.codigo ?? '',
      marcaCodigo: marcas[0]?.codigo ?? '',
    }));
    setEditingCodigo(null);
  }, [marcas, modelos]);

  const handleChange = (field: keyof DeviceFormState, value: string | number | '') => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formState.descripcion.trim()) {
      showFeedback('La descripcion es obligatoria.', 'error');
      return false;
    }
    if (formState.modeloCodigo === '') {
      showFeedback('Selecciona un modelo.', 'error');
      return false;
    }
    if (formState.marcaCodigo === '') {
      showFeedback('Selecciona una marca.', 'error');
      return false;
    }
    const ramValue = Number(formState.ram);
    const romValue = Number(formState.rom);
    if (!Number.isFinite(ramValue) || ramValue <= 0) {
      showFeedback('La memoria RAM debe ser mayor a cero.', 'error');
      return false;
    }
    if (!Number.isFinite(romValue) || romValue <= 0) {
      showFeedback('La memoria ROM debe ser mayor a cero.', 'error');
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
      modeloCodigo: Number(formState.modeloCodigo),
      marcaCodigo: Number(formState.marcaCodigo),
      ram: Number(formState.ram),
      rom: Number(formState.rom),
    };

    try {
      if (editingCodigo === null) {
        await authFetch('/catalog/devices', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showFeedback('Dispositivo creado.');
      } else {
        const response = await authFetch(`/catalog/devices/${editingCodigo}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (response.status === 404) {
          showFeedback('Dispositivo no encontrado.', 'error');
        } else {
          showFeedback('Dispositivo actualizado.');
        }
      }

      resetForm();
      await fetchData();
    } catch (error) {
      showFeedback((error as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (dispositivo: Dispositivo) => {
    setEditingCodigo(dispositivo.codigo);
    setFormState({
      descripcion: dispositivo.descripcion,
      modeloCodigo: dispositivo.modeloCodigo,
      marcaCodigo: dispositivo.marcaCodigo,
      ram: dispositivo.ram.toString(),
      rom: dispositivo.rom.toString(),
    });
    clearFeedback();
  };

  const handleDelete = useCallback(async () => {
    if (confirmDelete === null) return;
    setSaving(true);
    clearFeedback();
    try {
      const response = await authFetch(`/catalog/devices/${confirmDelete}`, { method: 'DELETE' });
      if (response.status === 404) {
        showFeedback('Dispositivo no encontrado.', 'error');
      } else {
        showFeedback('Dispositivo eliminado.');
        if (editingCodigo === confirmDelete) {
          resetForm();
        }
        await fetchData();
      }
    } catch (error) {
      showFeedback((error as Error).message, 'error');
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  }, [authFetch, clearFeedback, confirmDelete, editingCodigo, fetchData, resetForm, showFeedback]);

  const modeloOptions = useMemo(() => modelos, [modelos]);
  const marcaOptions = useMemo(() => marcas, [marcas]);

  return (
    <div className={styles.panel}>
      <CatalogToast feedback={feedback} theme={theme} onClose={clearFeedback} />

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={`text-lg font-semibold ${styles.heading}`}>Dispositivos</h2>
            <p className={`text-xs ${styles.subheading}`}>
              Inventario de dispositivos con sus caracteristicas tecnicas.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${styles.pill}`}
          >
            Actualizar
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          <section className={`${styles.section} overflow-hidden`}>
            <div className="grid grid-cols-[80px_1fr_120px] border-b border-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
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

              {!loading && dispositivos.length === 0 && (
                <p className={`px-4 py-6 text-center text-xs ${styles.subheading}`}>
                  Aun no se registraron dispositivos.
                </p>
              )}

              {dispositivos.map((dispositivo) => (
                <div
                  key={dispositivo.codigo}
                  className={`grid grid-cols-[80px_1fr_120px] items-center gap-2 px-4 py-3 text-sm ${styles.textPrimary} ${styles.hoverLift}`}
                >
                  <span className="text-xs opacity-70">#{dispositivo.codigo}</span>
                  <div className="space-y-1">
                    <p className="font-semibold">{dispositivo.descripcion}</p>
                    <p className={`text-xs ${styles.textSecondary}`}>
                      Modelo: {dispositivo.modeloDescripcion} • Marca: {dispositivo.marcaDescripcion}
                    </p>
                    <p className={`text-xs ${styles.textSecondary}`}>
                      RAM: {dispositivo.ram} GB • ROM: {dispositivo.rom} GB
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(dispositivo)}
                      className="rounded-full border border-indigo-500/60 px-3 py-1 text-[10px] font-semibold text-indigo-200 transition hover:bg-indigo-500 hover:text-white"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(dispositivo.codigo)}
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
              {editingCodigo === null ? 'Nuevo dispositivo' : `Editar dispositivo #${editingCodigo}`}
            </h3>

            <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
              Descripcion
              <input
                value={formState.descripcion}
                onChange={(event) => handleChange('descripcion', event.target.value)}
                className={`${styles.input} px-3 py-2`}
                placeholder="Ej: Notebook Lenovo"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                Modelo
                <select
                  value={formState.modeloCodigo}
                  onChange={(event) =>
                    handleChange('modeloCodigo', event.target.value === '' ? '' : Number(event.target.value))
                  }
                  className={`${styles.input} px-3 py-2`}
                >
                  {modeloOptions.length === 0 ? <option value="">Sin modelos</option> : null}
                  {modeloOptions.map((modelo) => (
                    <option key={modelo.codigo} value={modelo.codigo}>
                      {modelo.descripcion}
                    </option>
                  ))}
                </select>
              </label>

              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                Marca
                <select
                  value={formState.marcaCodigo}
                  onChange={(event) =>
                    handleChange('marcaCodigo', event.target.value === '' ? '' : Number(event.target.value))
                  }
                  className={`${styles.input} px-3 py-2`}
                >
                  {marcaOptions.length === 0 ? <option value="">Sin marcas</option> : null}
                  {marcaOptions.map((marca) => (
                    <option key={marca.codigo} value={marca.codigo}>
                      {marca.descripcion}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                RAM (GB)
                <input
                  type="number"
                  min="1"
                  value={formState.ram}
                  onChange={(event) => handleChange('ram', event.target.value)}
                  className={`${styles.input} px-3 py-2`}
                  placeholder="8"
                />
              </label>

              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                ROM (GB)
                <input
                  type="number"
                  min="1"
                  value={formState.rom}
                  onChange={(event) => handleChange('rom', event.target.value)}
                  className={`${styles.input} px-3 py-2`}
                  placeholder="256"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={
                  saving ||
                  formState.modeloCodigo === '' ||
                  formState.marcaCodigo === '' ||
                  modelos.length === 0 ||
                  marcas.length === 0
                }
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
        title="Eliminar dispositivo"
        description="Esta accion no se puede deshacer. El registro se eliminara permanentemente."
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

export default DispositivoManager;

