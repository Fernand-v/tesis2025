'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDashboard } from '../dashboard/DashboardContext';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { useCatalogStyles } from '../catalog/catalog-ui';
import CatalogToast from '../catalog/CatalogToast';
import { useFeedbackFlash } from '@/hooks/useFeedbackFlash';

interface CajaAsignada {
  cajaCodigo: number;
  cajaDescripcion: string;
  usuarioCodigo: number;
  usuarioUsername: string;
}

interface Estado {
  codigo: number;
  descripcion: string;
}

interface Moneda {
  codigo: number;
  denominacion: string;
  tasa: number;
  simbolo: string;
}

interface AperturaDetalle {
  monedaCodigo: number;
  denominacion: string;
  tasa: number;
  cantidad: number;
  monto: number;
}

interface AperturaCaja {
  codigo: number;
  fecha: string;
  monto: number;
  cajaCodigo: number;
  cajaDescripcion: string;
  usuarioCodigo: number;
  usuarioUsername: string;
  usuarioNombre: string;
  usuarioApellido: string;
  estadoCodigo: number;
  estadoDescripcion: string;
  fechaGrabacion: string;
  detalles: AperturaDetalle[];
  subtotal: number;
}

interface DetalleInput {
  monedaCodigo: number;
  denominacion: string;
  tasa: number;
  cantidad: number;
}

interface AperturaFormState {
  cajaCodigo: number | '';
}

const DEFAULT_FORM: AperturaFormState = {
  cajaCodigo: '',
};

const numberFormatter = new Intl.NumberFormat('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const AperturaCajaManager = () => {
  const { setPageTitle, theme, user } = useDashboard();
  const authFetch = useAuthFetch();
  const styles = useCatalogStyles(theme);
  const { feedback, showFeedback, clearFeedback } = useFeedbackFlash();

  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [aperturas, setAperturas] = useState<AperturaCaja[]>([]);
  const [asignaciones, setAsignaciones] = useState<CajaAsignada[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [detalleInputs, setDetalleInputs] = useState<DetalleInput[]>([]);
  const [formState, setFormState] = useState<AperturaFormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentUserId = useMemo(() => {
    if (!user || typeof user.id === 'undefined' || user.id === null) {
      return null;
    }
    const parsed = Number(user.id);
    return Number.isNaN(parsed) ? null : parsed;
  }, [user]);

  const estadoAbierto = useMemo((): Estado | null => {
  // Forzamos a usar el código 1 como Abierto
  return { codigo: 1, descripcion: 'Abierto' };
}, []);

  const subtotal = useMemo(
    () => detalleInputs.reduce((acc, detalle) => acc + detalle.cantidad * detalle.tasa, 0),
    [detalleInputs],
  );

  const formattedSubtotal = numberFormatter.format(Math.round(subtotal));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [aperturasRes, asignacionesRes, estadosRes, monedasRes] = await Promise.all([
        authFetch('/sales/cash-openings?mine=true'),
        authFetch('/catalog/cash-register-users'),
        authFetch('/catalog/states'),
        authFetch('/catalog/currencies'),
      ]);

      const aperturasData = (await aperturasRes.json()) as { aperturas?: AperturaCaja[] };
      const asignacionesData = (await asignacionesRes.json()) as { asignaciones?: CajaAsignada[] };
      const estadosData = (await estadosRes.json()) as { estados?: Estado[] };
      const monedasData = (await monedasRes.json()) as { monedas?: Moneda[] };

      const filteredAsignaciones = (asignacionesData.asignaciones ?? []).filter((asignacion) => {
        if (currentUserId === null) {
          return true;
        }
        return Number(asignacion.usuarioCodigo) === currentUserId;
      });

      const mappedMonedas =
        monedasData.monedas?.map((moneda) => ({
          monedaCodigo: moneda.codigo,
          denominacion: moneda.denominacion,
          tasa: moneda.tasa,
          cantidad: 0,
        })) ?? [];

      setAperturas(aperturasData.aperturas ?? []);
      setAsignaciones(filteredAsignaciones);
      setEstados(estadosData.estados ?? []);
      setMonedas(monedasData.monedas ?? []);
      setDetalleInputs((prev) => {
        if (prev.length === 0) {
          return mappedMonedas;
        }
        return mappedMonedas.map((base) => {
          const existing = prev.find((detalle) => detalle.monedaCodigo === base.monedaCodigo);
          return existing ? { ...base, cantidad: existing.cantidad } : base;
        });
      });
    } catch (error) {
      showFeedback((error as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, currentUserId, showFeedback]);

  useEffect(() => {
    setPageTitle('Aperturas de caja');
    void fetchData();
    return () => setPageTitle('Sistema General');
  }, [fetchData, setPageTitle]);

  useEffect(() => {
    if (asignaciones.length === 0) {
      setFormState((prev) => ({ ...prev, cajaCodigo: '' }));
      return;
    }

    setFormState((prev) => ({
      ...prev,
      cajaCodigo:
        prev.cajaCodigo !== '' && asignaciones.some((asignacion) => asignacion.cajaCodigo === prev.cajaCodigo)
          ? prev.cajaCodigo
          : asignaciones[0].cajaCodigo,
    }));
  }, [asignaciones]);

  const resetForm = useCallback(() => {
    setFormState({
      cajaCodigo: asignaciones[0]?.cajaCodigo ?? '',
    });
    setDetalleInputs(
      monedas.map((moneda) => ({
        monedaCodigo: moneda.codigo,
        denominacion: moneda.denominacion,
        tasa: moneda.tasa,
        cantidad: 0,
      })),
    );
  }, [asignaciones, monedas]);

  const handleChange = <K extends keyof AperturaFormState>(field: K, value: AperturaFormState[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleCantidadChange = (monedaCodigo: number, cantidad: number) => {
    if (Number.isNaN(cantidad)) {
      setDetalleInputs((prev) =>
        prev.map((detalle) =>
          detalle.monedaCodigo === monedaCodigo ? { ...detalle, cantidad: 0 } : detalle,
        ),
      );
      return;
    }

    if (cantidad < 0) {
      return;
    }

    setDetalleInputs((prev) =>
      prev.map((detalle) =>
        detalle.monedaCodigo === monedaCodigo ? { ...detalle, cantidad } : detalle,
      ),
    );
  };

  const validateForm = () => {
    if (formState.cajaCodigo === '') {
      showFeedback('Selecciona una caja asignada.', 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm() || !estadoAbierto) return;

    setSaving(true);
    clearFeedback();

    const detalles = detalleInputs
      .filter((detalle) => detalle.cantidad > 0)
      .map((detalle) => ({
        monedaCodigo: detalle.monedaCodigo,
        cantidad: detalle.cantidad,
      }));

    try {
      const response = await authFetch('/sales/cash-openings', {
        method: 'POST',
        body: JSON.stringify({
          cajaCodigo: Number(formState.cajaCodigo),
          estadoCodigo: estadoAbierto.codigo,
          detalles,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({ message: 'No se pudo registrar la apertura' }))) as {
          message?: string;
        };
        showFeedback(payload.message ?? 'No se pudo registrar la apertura', 'error');
        return;
      }

      showFeedback('Apertura registrada.');
      resetForm();
      await fetchData();
    } catch (error) {
      showFeedback((error as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const cajasDisponibles = useMemo(
    () =>
      asignaciones.map((asignacion) => ({
        codigo: asignacion.cajaCodigo,
        descripcion: asignacion.cajaDescripcion,
        username: asignacion.usuarioUsername,
      })),
    [asignaciones],
  );

  const hasOpenApertura = useMemo(() => {
    if (!estadoAbierto) return false;
    return aperturas.some((apertura) => apertura.estadoCodigo === estadoAbierto.codigo);
  }, [aperturas, estadoAbierto]);

  const formDisabled = hasOpenApertura || cajasDisponibles.length === 0 || monedas.length === 0 || !estadoAbierto;

  const formatAmount = (value: number) => numberFormatter.format(Math.round(value));
  const formatDateTime = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString('es-PY');
  };

  return (
    <div className={styles.panel}>
      <CatalogToast feedback={feedback} theme={theme} onClose={clearFeedback} />

      <div className="flex flex-col gap-6">
        {hasOpenApertura ? (
          <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
            Ya tenes una apertura activa. Cerrala antes de registrar una nueva.
          </div>
        ) : null}

        {cajasDisponibles.length === 0 ? (
          <div className="rounded-xl border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            No tenes cajas asignadas. Solicita a un administrador que te asigne una antes de continuar.
          </div>
        ) : null}

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className={`${styles.section} space-y-4 p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-lg font-semibold ${styles.heading}`}>Aperturas registradas</h2>
                <p className={`text-xs ${styles.subheading}`}>
                  Historial de aperturas realizadas con las cajas asignadas.
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

            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                </div>
              ) : null}

              {!loading && aperturas.length === 0 ? (
                <div className={`rounded-xl border border-dashed border-slate-600/60 bg-slate-900/40 px-4 py-6 text-center text-xs ${styles.textSecondary}`}>
                  Aun no registraste aperturas.
                </div>
              ) : null}

              {aperturas.map((apertura) => (
                <article key={apertura.codigo} className={`${styles.section} space-y-3 rounded-2xl border border-slate-700/60 bg-slate-950/40 p-5`}>
                  <header className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200">
                        #{apertura.codigo} — {apertura.cajaDescripcion}
                      </h3>
                      <p className={`text-xs ${styles.textSecondary}`}>
                        {apertura.fecha} • Registrado por @{apertura.usuarioUsername}
                      </p>
                      <p className={`text-[11px] ${styles.textSecondary}`}>
                        Creado: {formatDateTime(apertura.fechaGrabacion)}
                      </p>
                      <p className={`text-[11px] font-semibold text-emerald-300`}>
                        Monto declarado: {formatAmount(apertura.monto)}
                      </p>
                    </div>
                    <span
                      className={`${styles.pill} ${
                        apertura.estadoCodigo === (estadoAbierto?.codigo ?? -1)
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200'
                          : 'border-indigo-500/60 bg-indigo-500/10 text-indigo-200'
                      }`}
                    >
                      {apertura.estadoDescripcion}
                    </span>
                  </header>

                  <div className="overflow-hidden rounded-xl border border-slate-800/60">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-900/60 text-slate-400">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold uppercase tracking-[0.18em]">Moneda</th>
                          <th className="px-3 py-2 text-right font-semibold uppercase tracking-[0.18em]">Tasa</th>
                          <th className="px-3 py-2 text-right font-semibold uppercase tracking-[0.18em]">Cantidad</th>
                          <th className="px-3 py-2 text-right font-semibold uppercase tracking-[0.18em]">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-200">
                        {apertura.detalles.length === 0 ? (
                          <tr>
                            <td className="px-3 py-3 text-center text-[11px] text-slate-400" colSpan={4}>
                              Sin detalle cargado.
                            </td>
                          </tr>
                        ) : (
                          apertura.detalles.map((detalle) => (
                            <tr key={`${apertura.codigo}-${detalle.monedaCodigo}`} className="bg-transparent">
                              <td className="px-3 py-2">{detalle.denominacion}</td>
                              <td className="px-3 py-2 text-right">{formatAmount(detalle.tasa)}</td>
                              <td className="px-3 py-2 text-right">{formatAmount(detalle.cantidad)}</td>
                              <td className="px-3 py-2 text-right font-semibold text-emerald-300">
                                {formatAmount(detalle.monto)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    <div className="flex items-center justify-end gap-2 border-t border-slate-800/60 bg-slate-950/40 px-3 py-2 text-xs font-semibold text-slate-200">
                      <span>Subtotal</span>
                      <span className="text-emerald-300">{formatAmount(apertura.subtotal)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={`${styles.section} space-y-5 p-6`}>
            <h2 className={`text-sm font-semibold ${styles.heading}`}>Registrar nueva apertura</h2>
            {monedas.length === 0 ? (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-[11px] text-amber-200">
                Aun no se configuraron tipos de moneda. Crea al menos uno para cargar el detalle de la apertura.
              </div>
            ) : null}
            {!estadoAbierto ? (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-[11px] text-amber-200">
                No hay estados configurados. Configura al menos un estado (por ejemplo, Abierto) para registrar aperturas.
              </div>
            ) : null}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                Fecha *
                <input
                  type="date"
                  value={today}
                  readOnly
                  className={`${styles.input} px-3 py-2`}
                  disabled
                />
              </label>

              <label className={`flex flex-col gap-2 text-sm ${styles.textSecondary}`}>
                Caja asignada *
                <select
                  value={formState.cajaCodigo}
                  onChange={(event) =>
                    handleChange('cajaCodigo', event.target.value === '' ? '' : Number(event.target.value))
                  }
                  className={`${styles.input} px-3 py-2`}
                  disabled={formDisabled || saving}
                >
                  {cajasDisponibles.length === 0 ? <option value="">Sin cajas asignadas</option> : null}
                  {cajasDisponibles.map((caja) => (
                    <option key={caja.codigo} value={caja.codigo}>
                      {caja.descripcion} (@{caja.username})
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${styles.textSecondary}`}>Detalle por moneda</span>
                  <span className="text-[11px] text-slate-400">Monto calculado automaticamente</span>
                </div>
                <div className="space-y-3">
                  {detalleInputs.map((detalle) => {
                    const monto = detalle.tasa * detalle.cantidad;
                    return (
                      <div
                        key={detalle.monedaCodigo}
                        className="grid gap-2 rounded-xl border border-slate-700/60 bg-slate-950/40 p-3 md:grid-cols-[minmax(0,1fr)_120px_140px]"
                      >
                        <div className="flex flex-col text-xs text-slate-200">
                          <span className="font-semibold">{detalle.denominacion}</span>
                          <span className="text-[11px] text-slate-400">
                            Tasa: {formatAmount(detalle.tasa)}
                          </span>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-slate-300">
                          Cantidad
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={detalle.cantidad}
                            onChange={(event) =>
                              handleCantidadChange(detalle.monedaCodigo, Number(event.target.value))
                            }
                            className={`${styles.input} w-full px-3 py-2`}
                            disabled={formDisabled || saving}
                          />
                        </label>
                        <div className="flex flex-col justify-center text-right text-xs font-semibold text-emerald-300">
                          <span>Monto</span>
                          <span>{formatAmount(monto)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-950/40 px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-200">Subtotal calculado</p>
                  {estadoAbierto ? (
                    <p className={`text-[11px] ${styles.textSecondary}`}>
                      Estado asignado automaticamente: {estadoAbierto.descripcion}
                    </p>
                  ) : null}
                </div>
                <span className="text-lg font-semibold text-emerald-300">{formattedSubtotal}</span>
              </div>

              <button
                type="submit"
                disabled={formDisabled || saving}
                className="w-full rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
              >
                Registrar apertura
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AperturaCajaManager;
