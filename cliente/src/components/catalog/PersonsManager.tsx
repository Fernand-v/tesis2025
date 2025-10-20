'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useDashboard } from '../dashboard/DashboardContext';
import { useAuthFetch } from '@/hooks/useAuthFetch';

interface DocType {
  codigo: number;
  descripcion: string;
}

interface PersonSummary {
  codigo: number;
  nombre: string;
  apellido: string;
  correo: string;
  activo: string;
  tipoDocumentoCodigo: number;
  tipoDocumentoDescripcion: string;
}

interface PersonDetailResponse {
  persona: {
    codigo: number;
    nombre: string;
    apellido: string;
    telefono: string;
    celular: string;
    direccion: string;
    activo: string;
    correo: string;
    ruc: string;
    documento: string;
    digitoVerificador: string;
    observacion?: string | null;
    estadoCivil: string;
    fechaNacimiento: string;
    tipoDocumentoCodigo: number;
    tipoDocumentoDescripcion: string;
  };
  assignedTypes: Array<{ codigo: number; descripcion: string }>;
  availableTypes: Array<{ codigo: number; descripcion: string }>;
}

interface PersonFormState {
  nombre: string;
  apellido: string;
  telefono: string;
  celular: string;
  direccion: string;
  activo: string;
  correo: string;
  ruc: string;
  documento: string;
  digitoVerificador: string;
  observacion: string;
  estadoCivil: string;
  fechaNacimiento: string;
  tipoDocumentoCodigo: number | '';
}

const DEFAULT_FORM: PersonFormState = {
  nombre: '',
  apellido: '',
  telefono: '',
  celular: '',
  direccion: '',
  activo: 'S',
  correo: '',
  ruc: '',
  documento: '',
  digitoVerificador: '',
  observacion: '',
  estadoCivil: '',
  fechaNacimiento: '',
  tipoDocumentoCodigo: '',
};

const PERSON_FIELDS: Array<{ key: keyof PersonFormState; label: string; colSpan?: string; type?: string }> = [
  { key: 'nombre', label: 'Nombre *' },
  { key: 'apellido', label: 'Apellido *' },
  { key: 'telefono', label: 'Teléfono *' },
  { key: 'celular', label: 'Celular *' },
  { key: 'direccion', label: 'Dirección *', colSpan: 'md:col-span-2' },
  { key: 'correo', label: 'Correo *' },
  { key: 'ruc', label: 'RUC *' },
  { key: 'documento', label: 'Documento *' },
  { key: 'digitoVerificador', label: 'Dígito *' },
  { key: 'estadoCivil', label: 'Estado civil *' },
  { key: 'fechaNacimiento', label: 'Fecha de nacimiento *', type: 'date' },
];

const PersonsManager = () => {
  const { setPageTitle, theme } = useDashboard();
  const authFetch = useAuthFetch();

  const [personas, setPersonas] = useState<PersonSummary[]>([]);
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [formState, setFormState] = useState<PersonFormState>(DEFAULT_FORM);
  const [selectedCodigo, setSelectedCodigo] = useState<number | null>(null);
  const [detail, setDetail] = useState<PersonDetailResponse | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const panelClass = useMemo(
    () =>
      theme === 'dark'
        ? 'rounded-3xl border border-slate-700/60 bg-slate-900/60 shadow-lg shadow-slate-900/40'
        : 'rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-300/30',
    [theme],
  );

  useEffect(() => {
    setPageTitle('Personas');
    void fetchDocTypes();
    void fetchPersonas();
    return () => setPageTitle('Sistema general');
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchDocTypes = useCallback(async () => {
    try {
      const response = await authFetch('/catalog/doc-types');
      const data = (await response.json()) as { tipos?: DocType[] };
      setDocTypes(data.tipos ?? []);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [authFetch]);

  const fetchPersonas = useCallback(async () => {
    setLoadingList(true);
    try {
      const response = await authFetch('/catalog/persons');
      const data = (await response.json()) as { personas?: PersonSummary[] };
      setPersonas(data.personas ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingList(false);
    }
  }, [authFetch]);

  const fetchDetail = async (codigo: number) => {
    setLoadingDetail(true);
    try {
      const response = await authFetch(`/catalog/persons/${codigo}`);
      const data = (await response.json()) as PersonDetailResponse;
      setDetail(data);
      setSelectedCodigo(codigo);
      setFormState({
        nombre: data.persona.nombre,
        apellido: data.persona.apellido,
        telefono: data.persona.telefono,
        celular: data.persona.celular,
        direccion: data.persona.direccion,
        activo: data.persona.activo,
        correo: data.persona.correo,
        ruc: data.persona.ruc,
        documento: data.persona.documento,
        digitoVerificador: data.persona.digitoVerificador,
        observacion: data.persona.observacion ?? '',
        estadoCivil: data.persona.estadoCivil,
        fechaNacimiento: data.persona.fechaNacimiento.slice(0, 10),
        tipoDocumentoCodigo: data.persona.tipoDocumentoCodigo,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleChange = (field: keyof PersonFormState, value: string | number) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const validateRequired = (state: PersonFormState) =>
    !!state.nombre &&
    !!state.apellido &&
    !!state.telefono &&
    !!state.celular &&
    !!state.direccion &&
    !!state.correo &&
    !!state.ruc &&
    !!state.documento &&
    !!state.digitoVerificador &&
    !!state.estadoCivil &&
    !!state.fechaNacimiento &&
    state.tipoDocumentoCodigo !== '';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateRequired(formState)) return setError('Completa todos los campos obligatorios');

    setSaving(true);
    setError(null);
    try {
      if (selectedCodigo === null) {
        const response = await authFetch('/catalog/persons', {
          method: 'POST',
          body: JSON.stringify(formState),
        });
        const data = (await response.json()) as PersonDetailResponse;
        setMessage('✅ Persona creada');
        await fetchPersonas();
        await fetchDetail(data.persona.codigo);
      } else {
        await authFetch(`/catalog/persons/${selectedCodigo}`, {
          method: 'PUT',
          body: JSON.stringify(formState),
        });
        setMessage('✅ Persona actualizada');
        await fetchPersonas();
        await fetchDetail(selectedCodigo);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (selectedCodigo === null) return;
    setSaving(true);
    try {
      await authFetch(`/catalog/persons/${selectedCodigo}`, { method: 'DELETE' });
      setMessage('🗑️ Persona eliminada');
      setSelectedCodigo(null);
      setDetail(null);
      setFormState(DEFAULT_FORM);
      await fetchPersonas();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
    }
  };

  const handleAssignType = async (tipoCodigo: number) => {
    if (selectedCodigo === null) return;
    setAssigning(true);
    try {
      await authFetch(`/catalog/persons/${selectedCodigo}/types`, {
        method: 'POST',
        body: JSON.stringify({ tipoCodigo }),
      });
      await fetchDetail(selectedCodigo);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveType = async (tipoCodigo: number) => {
    if (selectedCodigo === null) return;
    setAssigning(true);
    try {
      await authFetch(`/catalog/persons/${selectedCodigo}/types/${tipoCodigo}`, { method: 'DELETE' });
      await fetchDetail(selectedCodigo);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAssigning(false);
    }
  };

  const renderInputField = (f: { key: keyof PersonFormState; label: string; colSpan?: string; type?: string }) => {
  const col = f.colSpan ? f.colSpan : '';

  // 🗓️ Campo de fecha (mantiene la mejora anterior)
  if (f.type === 'date') {
    return (
      <label key={f.key} className={`flex flex-col gap-2 text-sm text-slate-300 ${col}`}>
        {f.label}
        <input
          type="date"
          value={formState[f.key] as string}
          onChange={(e) => handleChange(f.key, e.target.value)}
          className={`rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 
            text-slate-100 outline-none transition focus:border-indigo-400 
            focus:ring-2 focus:ring-indigo-500/40
            [&::-webkit-calendar-picker-indicator]:invert
            [&::-webkit-calendar-picker-indicator]:opacity-70
            hover:[&::-webkit-calendar-picker-indicator]:opacity-100`}
        />
      </label>
    );
  }

  // 🧍‍♂️ Campo de estado civil con lista desplegable
  if (f.key === 'estadoCivil') {
    return (
      <label key={f.key} className={`flex flex-col gap-2 text-sm text-slate-300 ${col}`}>
        {f.label}
        <select
          value={formState.estadoCivil}
          onChange={(e) => handleChange('estadoCivil', e.target.value)}
          className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 
            text-slate-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
        >
          <option value="">Selecciona...</option>
          <option value="Soltero/a">Soltero/a</option>
          <option value="Casado/a">Casado/a</option>
          <option value="Viudo/a">Viudo/a</option>
          <option value="Divorciado/a">Divorciado/a</option>
          <option value="Concubino/a (Unión de hecho)">Concubino/a (Unión de hecho)</option>
        </select>
        <p className="text-[10px] text-slate-500 mt-1">
          Elige el estado civil actual de la persona.
        </p>
      </label>
    );
  }

  // 📦 Campos de texto normales
  return (
    <label key={f.key} className={`flex flex-col gap-2 text-sm text-slate-300 ${col}`}>
      {f.label}
      <input
        type={f.type || 'text'}
        value={formState[f.key] as string}
        onChange={(e) => handleChange(f.key, e.target.value)}
        className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 
          text-slate-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
      />
    </label>
  );
};


  return (
    <div className={panelClass}>
      {message && (
        <div className="fixed right-6 top-6 z-50 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 shadow">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{error}</div>
      )}

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        {/* Lista */}
        <section className="rounded-2xl border border-slate-700/60 bg-slate-950/40 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Personas registradas</h2>
            <button
              onClick={fetchPersonas}
              className="rounded-full border border-slate-600/60 px-3 py-1 text-[10px] text-slate-200 hover:border-indigo-400 hover:text-white"
            >
              Actualizar
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {loadingList ? (
              <div className="flex justify-center py-6">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              </div>
            ) : (
              personas.map((p) => (
                <button
                  key={p.codigo}
                  onClick={() => fetchDetail(p.codigo)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                    selectedCodigo === p.codigo
                      ? 'border-indigo-500/70 bg-indigo-500/20 text-white'
                      : 'border-slate-700/60 bg-slate-900/40 text-slate-300 hover:border-indigo-400 hover:text-white'
                  }`}
                >
                  <span className="font-semibold">
                    {p.nombre} {p.apellido}
                  </span>
                  <span className="block text-xs text-slate-400">
                    {p.tipoDocumentoDescripcion} - {p.tipoDocumentoCodigo} • {p.activo === 'S' ? 'Activo' : 'Inactivo'}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Formulario unificado */}
        <section className="rounded-2xl border border-slate-700/60 bg-slate-950/40 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                {selectedCodigo ? 'Editar persona' : 'Nueva persona'}
              </h2>
              <p className="text-xs text-slate-400">
                {selectedCodigo ? 'Actualiza los datos y administra tipos.' : 'Completa los campos para crear.'}
              </p>
            </div>

            {selectedCodigo && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="rounded-full border border-rose-500/60 px-4 py-2 text-xs text-rose-200 hover:bg-rose-500 hover:text-white"
              >
                Eliminar
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {PERSON_FIELDS.map(renderInputField)}
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                Tipo documento *
                <select
                  value={formState.tipoDocumentoCodigo}
                  onChange={(e) => handleChange('tipoDocumentoCodigo', Number(e.target.value))}
                  className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="">Selecciona...</option>
                  {docTypes.map((doc) => (
                    <option key={doc.codigo} value={doc.codigo}>
                      {doc.descripcion}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm text-slate-300">
                Activo *
                <select
                  value={formState.activo}
                  onChange={(e) => handleChange('activo', e.target.value)}
                  className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="S">Activo</option>
                  <option value="N">Inactivo</option>
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm text-slate-300 md:col-span-2">
                Observación
                <input
                  value={formState.observacion}
                  onChange={(e) => handleChange('observacion', e.target.value)}
                  className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-indigo-500 px-4 py-2 text-sm text-white font-semibold hover:bg-indigo-400 disabled:opacity-60"
              >
                {selectedCodigo ? 'Guardar cambios' : 'Crear persona'}
              </button>
              {selectedCodigo && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCodigo(null);
                    setFormState(DEFAULT_FORM);
                    setDetail(null);
                  }}
                  className="rounded-full border border-slate-600/60 px-4 py-2 text-sm text-slate-200 hover:border-indigo-400 hover:text-white"
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </form>

          {/* Tipos asociados */}
          {detail && (
            <div className="grid gap-6 md:grid-cols-2 mt-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-2">Tipos asignados</h3>
                {detail.assignedTypes.length === 0 ? (
                  <p className="rounded-xl border border-slate-700/60 bg-slate-950/40 px-3 py-2 text-xs text-slate-400">
                    No hay tipos relacionados.
                  </p>
                ) : (
                  detail.assignedTypes.map((tipo) => (
                    <div
                      key={tipo.codigo}
                      className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-xs text-slate-200 mb-2"
                    >
                      <span>{tipo.descripcion}</span>
                      <button
                        onClick={() => handleRemoveType(tipo.codigo)}
                        disabled={assigning}
                        className="rounded-full border border-rose-500/60 px-3 py-1 text-[10px] text-rose-200 hover:bg-rose-500 hover:text-white"
                      >
                        Quitar
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-2">Tipos disponibles</h3>
                {detail.availableTypes.length === 0 ? (
                  <p className="rounded-xl border border-slate-700/60 bg-slate-950/40 px-3 py-2 text-xs text-slate-400">
                    Todos los tipos están asignados.
                  </p>
                ) : (
                  detail.availableTypes.map((tipo) => (
                    <div
                      key={tipo.codigo}
                      className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-xs text-slate-200 mb-2"
                    >
                      <span>{tipo.descripcion}</span>
                      <button
                        onClick={() => handleAssignType(tipo.codigo)}
                        disabled={assigning}
                        className="rounded-full border border-emerald-500/60 px-3 py-1 text-[10px] text-emerald-200 hover:bg-emerald-500 hover:text-white"
                      >
                        Asignar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Modal eliminar */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className={`rounded-2xl p-6 shadow-xl ${
              theme === 'dark'
                ? 'bg-slate-900 border border-slate-700 text-slate-100'
                : 'bg-white border border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <AlertCircle className="h-10 w-10 text-rose-500" />
              <h3 className="text-lg font-semibold">¿Eliminar persona?</h3>
              <p className="text-sm text-slate-400">
                Esta acción no se puede deshacer. Se eliminará permanentemente del sistema.
              </p>
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-slate-500/50 px-4 py-2 text-sm text-slate-300 hover:border-slate-400 hover:bg-slate-700/40"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="rounded-xl bg-rose-600/90 px-4 py-2 text-sm text-white font-semibold hover:bg-rose-600"
              >
                {saving ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonsManager;
