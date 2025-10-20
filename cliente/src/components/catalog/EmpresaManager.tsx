'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDashboard } from '../dashboard/DashboardContext';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { useCatalogStyles } from './catalog-ui';
import CatalogToast from './CatalogToast';
import ConfirmDialog from './ConfirmDialog';
import { useFeedbackFlash } from '@/hooks/useFeedbackFlash';

interface Empresa {
  codigo: number;
  razonSocial: string;
  ruc: string;
  telefono: string | null;
  celular: string;
  direccion: string;
  logo: string | null;
}

interface EmpresaFormState {
  razonSocial: string;
  ruc: string;
  telefono: string;
  celular: string;
  direccion: string;
  logo: string;
}

const DEFAULT_FORM: EmpresaFormState = {
  razonSocial: '',
  ruc: '',
  telefono: '',
  celular: '',
  direccion: '',
  logo: '',
};

const EmpresaManager = () => {
  const { setPageTitle, theme } = useDashboard();
  const authFetch = useAuthFetch();
  const styles = useCatalogStyles(theme);
  const { feedback, showFeedback, clearFeedback } = useFeedbackFlash();

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [formState, setFormState] = useState<EmpresaFormState>(DEFAULT_FORM);
  const [editingCodigo, setEditingCodigo] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const fetchEmpresas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch('/catalog/companies');
      const data = (await response.json()) as { empresas?: Empresa[] };
      setEmpresas(data.empresas ?? []);
    } catch (error) {
      showFeedback((error as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, showFeedback]);

  useEffect(() => {
    setPageTitle('Empresas');
    void fetchEmpresas();
    return () => setPageTitle('Sistema General');
  }, [fetchEmpresas, setPageTitle]);

  const resetForm = useCallback(() => {
    setFormState(DEFAULT_FORM);
    setEditingCodigo(null);
  }, []);

  const handleChange = (field: keyof EmpresaFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formState.razonSocial.trim()) {
      showFeedback('La razon social es obligatoria.', 'error');
      return false;
    }
    if (!formState.ruc.trim()) {
      showFeedback('El RUC es obligatorio.', 'error');
      return false;
    }
    if (!formState.celular.trim()) {
      showFeedback('El celular es obligatorio.', 'error');
      return false;
    }
    if (!formState.direccion.trim()) {
      showFeedback('La direccion es obligatoria.', 'error');
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
      razonSocial: formState.razonSocial.trim(),
      ruc: formState.ruc.trim(),
      telefono: formState.telefono.trim() || null,
      celular: formState.celular.trim(),
      direccion: formState.direccion.trim(),
      logo: formState.logo.trim() || null,
    };

    try {
      if (editingCodigo === null) {
        await authFetch('/catalog/companies', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showFeedback('Empresa creada.');
      } else {
        const response = await authFetch(`/catalog/companies/${editingCodigo}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (response.status === 404) {
          showFeedback('Empresa no encontrada.', 'error');
        } else {
          showFeedback('Empresa actualizada.');
        }
      }
      resetForm();
      await fetchEmpresas();
    } catch (error) {
      showFeedback((error as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (empresa: Empresa) => {
    setEditingCodigo(empresa.codigo);
    setFormState({
      razonSocial: empresa.razonSocial,
      ruc: empresa.ruc,
      telefono: empresa.telefono ?? '',
      celular: empresa.celular,
      direccion: empresa.direccion,
      logo: empresa.logo ?? '',
    });
    clearFeedback();
  };

  const handleDelete = useCallback(async () => {
    if (confirmDelete === null) return;
    setSaving(true);
    clearFeedback();
    try {
      const response = await authFetch(`/catalog/companies/${confirmDelete}`, { method: 'DELETE' });
      if (response.status === 404) {
        showFeedback('Empresa no encontrada.', 'error');
      } else {
        showFeedback('Empresa eliminada.');
        if (editingCodigo === confirmDelete) {
          resetForm();
        }
        await fetchEmpresas();
      }
    } catch (error) {
      showFeedback((error as Error).message, 'error');
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  }, [authFetch, clearFeedback, confirmDelete, editingCodigo, fetchEmpresas, resetForm, showFeedback]);

  return (
    <div className={styles.panel}>
      <CatalogToast feedback={feedback} theme={theme} onClose={clearFeedback} />

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={`text-lg font-semibold ${styles.heading}`}>Empresas registradas</h2>
            <p className={`text-xs ${styles.subheading}`}>
              Gestiona los datos de las empresas asociadas al sistema.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchEmpresas}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${styles.pill}`}
          >
            Actualizar
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className={`${styles.section} overflow-hidden`}>
            <div className="grid grid-cols-[90px_minmax(0,1fr)_140px] border-b border-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              <span>Codigo</span>
              <span>Razon social</span>
              <span className="text-center">Acciones</span>
            </div>

            <div className={`divide-y ${styles.divider}`}>
              {loading && (
                <div className="flex justify-center py-6">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                </div>
              )}

              {!loading && empresas.length === 0 && (
                <p className={`px-4 py-6 text-center text-xs ${styles.subheading}`}>
                  Aun no se registraron empresas.
                </p>
              )}

              {empresas.map((empresa) => (
                <div
                  key={empresa.codigo}
                  className={`grid grid-cols-[90px_minmax(0,1fr)_140px] items-center gap-2 px-4 py-3 text-sm ${styles.textPrimary} ${styles.hoverLift}`}
                >
                  <span className="text-xs opacity-70">#{empresa.codigo}</span>
                  <div>
                    <p className="font-semibold">{empresa.razonSocial}</p>
                    <p className={`text-xs ${styles.textSecondary}`}>
                      RUC: {empresa.ruc} • Cel: {empresa.celular}
                    </p>
                    {empresa.telefono ? (
                      <p className={`text-xs ${styles.textSecondary}`}>Tel: {empresa.telefono}</p>
                    ) : null}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(empresa)}
                      className="rounded-full border border-indigo-500/60 px-3 py-1 text-[10px] font-semibold text-indigo-200 transition hover:bg-indigo-500 hover:text-white"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(empresa.codigo)}
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
              {editingCodigo === null ? 'Nueva empresa' : `Editar empresa #${editingCodigo}`}
            </h3>

            <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
              Razon social *
              <input
                value={formState.razonSocial}
                onChange={(event) => handleChange('razonSocial', event.target.value)}
                className={`${styles.input} px-3 py-2`}
                placeholder="Ej: Sistemas SRL"
              />
            </label>

            <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
              RUC *
              <input
                value={formState.ruc}
                onChange={(event) => handleChange('ruc', event.target.value)}
                className={`${styles.input} px-3 py-2`}
                placeholder="80012345-6"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                Telefono
                <input
                  value={formState.telefono}
                  onChange={(event) => handleChange('telefono', event.target.value)}
                  className={`${styles.input} px-3 py-2`}
                  placeholder="021 555-1234"
                />
              </label>
              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                Celular *
                <input
                  value={formState.celular}
                  onChange={(event) => handleChange('celular', event.target.value)}
                  className={`${styles.input} px-3 py-2`}
                  placeholder="0981 123-456"
                />
              </label>
            </div>

            <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
              Direccion *
              <input
                value={formState.direccion}
                onChange={(event) => handleChange('direccion', event.target.value)}
                className={`${styles.input} px-3 py-2`}
                placeholder="Av. Principal 1234"
              />
            </label>

            <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
              Logo (URL)
              <input
                value={formState.logo}
                onChange={(event) => handleChange('logo', event.target.value)}
                className={`${styles.input} px-3 py-2`}
                placeholder="https://..."
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
        title="Eliminar empresa"
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

export default EmpresaManager;

