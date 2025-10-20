'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDashboard } from '../dashboard/DashboardContext';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { useCatalogStyles } from './catalog-ui';
import CatalogToast from './CatalogToast';
import ConfirmDialog from './ConfirmDialog';
import { useFeedbackFlash } from '@/hooks/useFeedbackFlash';

interface Grupo {
  codigo: number;
  descripcion: string;
}

interface Marca {
  codigo: number;
  descripcion: string;
}

interface Categoria {
  codigo: number;
  descripcion: string;
  tasa: number;
}

interface Item {
  codigo: number;
  descripcion: string;
  codigoBarra: string | null;
  activo: string;
  afectaStock: string;
  marcaCodigo: number;
  marcaDescripcion: string;
  grupoCodigo: number;
  grupoDescripcion: string;
  categoriaCodigo: number;
  categoriaDescripcion: string;
  categoriaTasa: number;
  porcGanancia: number;
  indDescuento: string;
}

interface ItemFormState {
  descripcion: string;
  codigoBarra: string;
  activo: 'S' | 'N';
  afectaStock: 'S' | 'N';
  marcaCodigo: number | '';
  grupoCodigo: number | '';
  categoriaCodigo: number | '';
  porcGanancia: number | '';
  indDescuento: 'S' | 'N';
}

const DEFAULT_FORM: ItemFormState = {
  descripcion: '',
  codigoBarra: '',
  activo: 'S',
  afectaStock: 'S',
  marcaCodigo: '',
  grupoCodigo: '',
  categoriaCodigo: '',
  porcGanancia: '',
  indDescuento: 'N',
};

const ItemManager = () => {
  const { setPageTitle, theme } = useDashboard();
  const authFetch = useAuthFetch();
  const styles = useCatalogStyles(theme);
  const { feedback, showFeedback, clearFeedback } = useFeedbackFlash();

  const [items, setItems] = useState<Item[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [formState, setFormState] = useState<ItemFormState>(DEFAULT_FORM);
  const [editingCodigo, setEditingCodigo] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch('/catalog/inventory/items');
      const data = (await response.json()) as {
        items?: Item[];
        grupos?: Grupo[];
        marcas?: Marca[];
        categorias?: Categoria[];
      };

      setItems(data.items ?? []);
      setGrupos(data.grupos ?? []);
      setMarcas(data.marcas ?? []);
      setCategorias(data.categorias ?? []);

      setFormState((prev) => ({
        ...prev,
        marcaCodigo:
          prev.marcaCodigo !== '' && (data.marcas ?? []).some((marca) => marca.codigo === prev.marcaCodigo)
            ? prev.marcaCodigo
            : data.marcas?.[0]?.codigo ?? '',
        grupoCodigo:
          prev.grupoCodigo !== '' && (data.grupos ?? []).some((grupo) => grupo.codigo === prev.grupoCodigo)
            ? prev.grupoCodigo
            : data.grupos?.[0]?.codigo ?? '',
        categoriaCodigo:
          prev.categoriaCodigo !== '' && (data.categorias ?? []).some((cat) => cat.codigo === prev.categoriaCodigo)
            ? prev.categoriaCodigo
            : data.categorias?.[0]?.codigo ?? '',
      }));
    } catch (error) {
      showFeedback((error as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, showFeedback]);

  useEffect(() => {
    setPageTitle('Items de inventario');
    void fetchData();
    return () => setPageTitle('Sistema General');
  }, [fetchData, setPageTitle]);

  const resetForm = useCallback(() => {
    setFormState({
      ...DEFAULT_FORM,
      marcaCodigo: marcas[0]?.codigo ?? '',
      grupoCodigo: grupos[0]?.codigo ?? '',
      categoriaCodigo: categorias[0]?.codigo ?? '',
    });
    setEditingCodigo(null);
  }, [categorias, grupos, marcas]);

  const handleChange = <K extends keyof ItemFormState>(field: K, value: ItemFormState[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formState.descripcion.trim()) {
      showFeedback('La descripción es obligatoria.', 'error');
      return false;
    }
    if (formState.marcaCodigo === '' || formState.grupoCodigo === '' || formState.categoriaCodigo === '') {
      showFeedback('Selecciona marca, grupo y categoría IVA.', 'error');
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
      codigoBarra: formState.codigoBarra.trim() || null,
      activo: formState.activo,
      afectaStock: formState.afectaStock,
      marcaCodigo: Number(formState.marcaCodigo),
      grupoCodigo: Number(formState.grupoCodigo),
      categoriaCodigo: Number(formState.categoriaCodigo),
      porcGanancia: Number(formState.porcGanancia) || 0,
      indDescuento: formState.indDescuento,
    };

    try {
      if (editingCodigo === null) {
        await authFetch('/catalog/inventory/items', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showFeedback('Item creado.');
      } else {
        const response = await authFetch(`/catalog/inventory/items/${editingCodigo}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (response.status === 404) {
          showFeedback('Item no encontrado.', 'error');
        } else {
          showFeedback('Item actualizado.');
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

  const handleEdit = (item: Item) => {
    setEditingCodigo(item.codigo);
    setFormState({
      descripcion: item.descripcion,
      codigoBarra: item.codigoBarra ?? '',
      activo: item.activo === 'N' ? 'N' : 'S',
      afectaStock: item.afectaStock === 'N' ? 'N' : 'S',
      marcaCodigo: item.marcaCodigo,
      grupoCodigo: item.grupoCodigo,
      categoriaCodigo: item.categoriaCodigo,
      porcGanancia: item.porcGanancia ?? '',
      indDescuento: item.indDescuento === 'S' ? 'S' : 'N',
    });
    clearFeedback();
  };

  const handleDelete = useCallback(async () => {
    if (confirmDelete === null) return;
    setSaving(true);
    clearFeedback();
    try {
      const response = await authFetch(`/catalog/inventory/items/${confirmDelete}`, { method: 'DELETE' });
      if (response.status === 404) {
        showFeedback('Item no encontrado.', 'error');
      } else {
        showFeedback('Item eliminado.');
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

  const marcaOptions = useMemo(() => marcas, [marcas]);
  const grupoOptions = useMemo(() => grupos, [grupos]);
  const categoriaOptions = useMemo(() => categorias, [categorias]);

  return (
    <div className={styles.panel}>
      <CatalogToast feedback={feedback} theme={theme} onClose={clearFeedback} />

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={`text-lg font-semibold ${styles.heading}`}>Items de inventario</h2>
            <p className={`text-xs ${styles.subheading}`}>
              Gestiona los artículos disponibles, sus marcas, grupos y categorizaciones de IVA.
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

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_440px]">
          <section className={`${styles.section} overflow-hidden`}>
            <div className="grid grid-cols-[80px_minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1fr)_120px] border-b border-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              <span>Codigo</span>
              <span>Descripcion</span>
              <span>Clasificación</span>
              <span>Estado</span>
              <span className="text-center">Acciones</span>
            </div>

            <div className={`divide-y ${styles.divider}`}>
              {loading && (
                <div className="flex justify-center py-6">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                </div>
              )}

              {!loading && items.length === 0 && (
                <p className={`px-4 py-6 text-center text-xs ${styles.subheading}`}>
                  Aún no se registraron items.
                </p>
              )}

              {items.map((item) => (
                <div
                  key={item.codigo}
                  className={`grid grid-cols-[80px_minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1fr)_120px] items-center gap-3 px-4 py-3 text-sm ${styles.textPrimary} ${styles.hoverLift}`}
                >
                  <span className="text-xs opacity-70">#{item.codigo}</span>
                  <div className="space-y-1">
                    <p className="font-semibold">{item.descripcion}</p>
                    <p className={`text-xs ${styles.textSecondary}`}>
                      Marca: {item.marcaDescripcion} • Grupo: {item.grupoDescripcion}
                    </p>
                    {item.codigoBarra ? (
                      <p className={`text-xs ${styles.textSecondary}`}>Cod. barra: {item.codigoBarra}</p>
                    ) : null}
                    <p className={`text-xs ${styles.textSecondary}`}>
                      Ganancia: {item.porcGanancia}% • Descuento:{' '}
                      {item.indDescuento === 'S' ? 'Sí' : 'No'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className={`text-xs ${styles.textSecondary}`}>
                      Categoría IVA: {item.categoriaDescripcion}
                    </p>
                    <p className={`text-xs ${styles.textSecondary}`}>Tasa: {item.categoriaTasa}%</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-semibold">
                    <span
                      className={`${styles.pill} ${
                        item.activo === 'S'
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200'
                          : 'border-rose-500/60 bg-rose-500/10 text-rose-200'
                      }`}
                    >
                      {item.activo === 'S' ? 'Activo' : 'Inactivo'}
                    </span>
                    <span
                      className={`${styles.pill} ${
                        item.afectaStock === 'S'
                          ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-200'
                          : 'border-slate-500/60 bg-slate-500/10 text-slate-200'
                      }`}
                    >
                      {item.afectaStock === 'S' ? 'Afecta stock' : 'Sin stock'}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="rounded-full border border-indigo-500/60 px-3 py-1 text-[10px] font-semibold text-indigo-200 transition hover:bg-indigo-500 hover:text-white"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(item.codigo)}
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
              {editingCodigo === null ? 'Nuevo item' : `Editar item #${editingCodigo}`}
            </h3>

            <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
              Descripción *
              <input
                value={formState.descripcion}
                onChange={(event) => handleChange('descripcion', event.target.value)}
                className={`${styles.input} px-3 py-2`}
                placeholder="Ej: Mouse inalámbrico"
              />
            </label>

            <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
              Código de barra
              <input
                value={formState.codigoBarra}
                onChange={(event) => handleChange('codigoBarra', event.target.value)}
                className={`${styles.input} px-3 py-2`}
                placeholder="EAN / SKU"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                Marca *
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

              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                Grupo *
                <select
                  value={formState.grupoCodigo}
                  onChange={(event) =>
                    handleChange('grupoCodigo', event.target.value === '' ? '' : Number(event.target.value))
                  }
                  className={`${styles.input} px-3 py-2`}
                >
                  {grupoOptions.length === 0 ? <option value="">Sin grupos</option> : null}
                  {grupoOptions.map((grupo) => (
                    <option key={grupo.codigo} value={grupo.codigo}>
                      {grupo.descripcion}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
              Categoría IVA *
              <select
                value={formState.categoriaCodigo}
                onChange={(event) =>
                  handleChange('categoriaCodigo', event.target.value === '' ? '' : Number(event.target.value))
                }
                className={`${styles.input} px-3 py-2`}
              >
                {categoriaOptions.length === 0 ? <option value="">Sin categorías</option> : null}
                {categoriaOptions.map((categoria) => (
                  <option key={categoria.codigo} value={categoria.codigo}>
                    {categoria.descripcion} ({categoria.tasa}%)
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                Activo *
                <select
                  value={formState.activo}
                  onChange={(event) => handleChange('activo', event.target.value === 'N' ? 'N' : 'S')}
                  className={`${styles.input} px-3 py-2`}
                >
                  <option value="S">Sí</option>
                  <option value="N">No</option>
                </select>
              </label>

              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                Afecta stock *
                <select
                  value={formState.afectaStock}
                  onChange={(event) => handleChange('afectaStock', event.target.value === 'N' ? 'N' : 'S')}
                  className={`${styles.input} px-3 py-2`}
                >
                  <option value="S">Sí</option>
                  <option value="N">No</option>
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                Porcentaje de ganancia (%)
                <input
                  type="number"
                  value={formState.porcGanancia}
                  onChange={(event) =>
                    handleChange('porcGanancia', event.target.value === '' ? '' : Number(event.target.value))
                  }
                  className={`${styles.input} px-3 py-2`}
                  placeholder="Ej: 25"
                  step="0.01"
                />
              </label>

              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                Permite descuento *
                <select
                  value={formState.indDescuento}
                  onChange={(event) => handleChange('indDescuento', event.target.value === 'S' ? 'S' : 'N')}
                  className={`${styles.input} px-3 py-2`}
                >
                  <option value="S">Sí</option>
                  <option value="N">No</option>
                </select>
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={
                  saving ||
                  formState.marcaCodigo === '' ||
                  formState.grupoCodigo === '' ||
                  formState.categoriaCodigo === '' ||
                  marcas.length === 0 ||
                  grupos.length === 0 ||
                  categorias.length === 0
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
        title="Eliminar item"
        description="Esta acción no se puede deshacer. El item se eliminará permanentemente."
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

export default ItemManager;
