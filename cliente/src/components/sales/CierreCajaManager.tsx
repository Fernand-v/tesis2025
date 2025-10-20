'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { useDashboard } from '../dashboard/DashboardContext';
import { useCatalogStyles } from '../catalog/catalog-ui';
import CatalogToast from '../catalog/CatalogToast';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { useFeedbackFlash } from '@/hooks/useFeedbackFlash';

interface Moneda {
  codigo: number;
  denominacion: string;
  tasa: number;
  simbolo: string;
}

interface DetalleEstado {
  monedaCodigo: number;
  denominacion: string;
  simbolo: string;
  tasa: number;
  cantidad: number;
}

interface CierreDetalleApi {
  aperturaCodigo: number;
  monedaCodigo: number;
  denominacion: string | null;
  simbolo: string | null;
  tasa: number | null;
  cantidad: number;
  monto: number;
}

interface CierreCajaApi {
  aperturaCodigo: number;
  fecha: string;
  monto: number;
  diferencia: number;
  cajaCodigo: number;
  cajaDescripcion: string;
  usuarioCodigo: number;
  usuarioUsername: string;
  usuarioNombre: string;
  usuarioApellido: string;
  montoApertura: number;
  saldoAnterior: number;
  totalCreditos: number;
  totalDebitos: number;
  detalles: CierreDetalleApi[];
}

interface ResumenDisponible {
  aperturaCodigo: number;
  cajaCodigo: number;
  cajaDescripcion: string;
  aperturaFecha: string;
  usuarioCodigo: number;
  usuarioUsername: string;
  usuarioNombre: string;
  usuarioApellido: string;
  montoApertura: number;
  saldoAnterior: number;
  totalCreditos: number;
  totalDebitos: number;
  saldoTeorico: number;
}

const numberFormatter = new Intl.NumberFormat('es-PY', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatAmount = (value: number) => numberFormatter.format(Math.round(value));

const formatDate = (value: string) => {
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const CierreCajaManager = () => {
  const { setPageTitle, theme } = useDashboard();
  const styles = useCatalogStyles(theme);
  const authFetch = useAuthFetch();
  const { feedback, showFeedback, clearFeedback } = useFeedbackFlash();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [detalles, setDetalles] = useState<DetalleEstado[]>([]);
  const [resumen, setResumen] = useState<ResumenDisponible | null>(null);
  const [cierres, setCierres] = useState<CierreCajaApi[]>([]);

  const totalContado = useMemo(
    () => detalles.reduce((acc, d) => acc + d.cantidad * d.tasa, 0),
    [detalles],
  );

  const saldoTeorico = resumen?.saldoTeorico ?? 0;
  const diferencia = totalContado - saldoTeorico;

  const detallesParaEnviar = useMemo(
    () =>
      detalles
        .filter((d) => d.cantidad >= 0)
        .map((d) => ({ monedaCodigo: d.monedaCodigo, cantidad: d.cantidad })),
    [detalles],
  );

  const formDeshabilitado = loading || saving || resumen === null || monedas.length === 0;
  const botonDeshabilitado =
    formDeshabilitado /*|| detallesParaEnviar.length === 0 || !detallesParaEnviar.some((d) => d.cantidad > 0)*/;

  const buildDetalleInicial = useCallback(
    (monedasDisponibles: Moneda[]) =>
      monedasDisponibles.map<DetalleEstado>((m) => ({
        monedaCodigo: m.codigo,
        denominacion: m.denominacion,
        simbolo: m.simbolo,
        tasa: m.tasa,
        cantidad: 0,
      })),
    [],
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const monedasRes = await authFetch('/catalog/currencies');
      const monedasPayload = (await monedasRes.json()) as { monedas?: Moneda[] };
      const monedasLista = monedasPayload.monedas ?? [];
      setMonedas(monedasLista);
      setDetalles(buildDetalleInicial(monedasLista));
    } catch (error) {
      if (error instanceof Error) {
        showFeedback(error.message, 'error');
      } else {
        showFeedback('No se pudieron obtener las monedas configuradas.', 'error');
      }
      setLoading(false);
      return;
    }

    try {
      const resumenRes = await authFetch('/sales/cash-closings/available');
      const resumenData = (await resumenRes.json()) as ResumenDisponible;
      setResumen(resumenData);
    } catch (error) {
      setResumen(null);
      if (error instanceof Error) {
        const message = error.message;
        if (
          message.includes('No tienes una apertura de caja activa') ||
          message.includes('No hay una apertura activa')
        ) {
          // Estado esperado cuando no existe apertura activa después del cierre.
        } else {
          showFeedback(message, 'error');
        }
      } else {
        showFeedback('No se pudo calcular el saldo teorico de la apertura.', 'error');
      }
    }

    try {
      const cierresRes = await authFetch('/sales/cash-closings?mine=true');
      const cierresPayload = (await cierresRes.json()) as { cierres?: CierreCajaApi[] };
      setCierres(cierresPayload.cierres ?? []);
    } catch (error) {
      if (error instanceof Error) {
        showFeedback(error.message, 'error');
      } else {
        showFeedback('No se pudo obtener el historial de cierres.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [authFetch, buildDetalleInicial, showFeedback]);

  useEffect(() => {
    setPageTitle('Cierre de caja');
    void fetchData();
  }, [fetchData, setPageTitle]);

  const handleCantidadChange = useCallback((monedaCodigo: number, value: number) => {
    setDetalles((prev) =>
      prev.map((d) => (d.monedaCodigo === monedaCodigo ? { ...d, cantidad: Number.isFinite(value) && value >= 0 ? value : 0 } : d)),
    );
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (formDeshabilitado) return;

     /* if (!detallesParaEnviar.some((d) => d.cantidad > 0)) {
        showFeedback('Ingresa al menos una moneda con cantidad mayor a cero.', 'error');
        return;
        }*/

      setSaving(true);
      try {
        const response = await authFetch('/sales/cash-closings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ detalles: detallesParaEnviar }),
        });

        const payload = (await response.json().catch(() => ({}))) as { message?: string };

        if (!response.ok) {
          showFeedback(payload.message ?? 'No se pudo registrar el cierre.', 'error');
          return;
        }

        showFeedback('Cierre registrado correctamente.');
        await fetchData();
      } catch (error) {
        if (error instanceof Error) {
          showFeedback(error.message, 'error');
        } else {
          showFeedback('No se pudo registrar el cierre.', 'error');
        }
      } finally {
        setSaving(false);
      }
    },
    [authFetch, detallesParaEnviar, fetchData, formDeshabilitado, showFeedback],
  );

  const resolverEstadoDiferencia = (valor: number) => {
    if (Math.abs(valor) <= 0.5) return 'Equilibrado';
    return valor > 0 ? 'Sobrante' : 'Faltante';
  };

  return (
    <div className="p-5 sm:p-6">
      <CatalogToast feedback={feedback} theme={theme} onClose={clearFeedback} />
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Panel resumen / estado actual */}
        <section className={`${styles.panel} p-6`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className={`text-xl font-semibold ${styles.heading}`}>Cierre de caja</h1>
              <p className={`text-sm ${styles.subheading}`}>
                Cuenta el efectivo disponible al finalizar la jornada y registra la diferencia contra el saldo teorico.
              </p>
            </div>
            {(loading || saving) && (
              <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1 text-xs font-medium text-indigo-300">
                {saving ? 'Guardando cambios…' : 'Cargando datos…'}
              </span>
            )}
          </div>

          {resumen ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className={`${styles.mutedSurface} rounded-2xl px-4 py-3`}>
                <p className="text-xs uppercase tracking-wide text-slate-400">Caja</p>
                <p className={`text-sm font-semibold ${styles.textPrimary}`}>{resumen.cajaDescripcion}</p>
                <p className={`text-[11px] ${styles.textSecondary}`}>Apertura #{resumen.aperturaCodigo}</p>
              </div>
              <div className={`${styles.mutedSurface} rounded-2xl px-4 py-3`}>
                <p className="text-xs uppercase tracking-wide text-slate-400">Fecha de apertura</p>
                <p className={`text-sm font-semibold ${styles.textPrimary}`}>{formatDate(resumen.aperturaFecha)}</p>
              </div>
              <div className={`${styles.mutedSurface} rounded-2xl px-4 py-3`}>
                <p className="text-xs uppercase tracking-wide text-slate-400">Arrastre anterior</p>
                <p className="text-lg font-semibold text-slate-100">{formatAmount(resumen.saldoAnterior)} Gs.</p>
              </div>
              <div className={`${styles.mutedSurface} rounded-2xl px-4 py-3`}>
                <p className="text-xs uppercase tracking-wide text-slate-400">Saldo teorico</p>
                <p className="text-lg font-semibold text-emerald-400">{formatAmount(resumen.saldoTeorico)} Gs.</p>
              </div>
              <div className={`${styles.mutedSurface} rounded-2xl px-4 py-3`}>
                <p className="text-xs uppercase tracking-wide text-slate-400">Ingresos por credito</p>
                <p className={`text-sm font-semibold ${styles.textPrimary}`}>{formatAmount(resumen.totalCreditos)} Gs.</p>
                <p className={`text-[11px] ${styles.textSecondary}`}>
                  Apertura {formatAmount(resumen.montoApertura)} Gs. - Arrastre {formatAmount(resumen.saldoAnterior)} Gs.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              No se detectó una apertura activa para cerrar. Crea una apertura o revisa el estado antes de registrar el
              cierre.
            </div>
          )}
        </section>

        {/* Contenido principal: formulario y listado */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          {/* Formulario */}
          <section className={`${styles.section} p-6`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-sm font-semibold ${styles.heading}`}>Registrar cierre</h2>
              {resumen && resumen.totalDebitos > 0 ? (
                <span className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold text-indigo-200">
                  Arqueo registrado: {formatAmount(resumen.totalDebitos)} Gs.
                </span>
              ) : null}
            </div>
            <p className={`mt-1 text-sm leading-relaxed ${styles.textSecondary}`}>
              Informa la cantidad de cada moneda contada en caja. El sistema calculará el total y almacenará la
              diferencia frente al saldo esperado.
            </p>

            <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
              {monedas.length === 0 ? (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
                  Aún no se configuraron tipos de moneda. Crea al menos una moneda para poder registrar el cierre.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${styles.textSecondary}`}>Detalle por moneda</span>
                    <span className="text-[11px] text-slate-400">Los montos se calculan automáticamente según la tasa configurada.</span>
                  </div>
                  <div className="space-y-3">
                    {detalles.map((detalle) => {
                      const monto = detalle.cantidad * detalle.tasa;
                      return (
                        <div
                          key={detalle.monedaCodigo}
                          className="grid gap-3 rounded-xl border border-slate-800/60 bg-slate-950/40 p-3 md:grid-cols-[minmax(0,1fr)_120px_140px]"
                        >
                          <div className="flex flex-col text-xs text-slate-200">
                            <span className="font-semibold">{detalle.denominacion}</span>
                            <span className="text-[11px] text-slate-400">Tasa: {formatAmount(detalle.tasa)} {detalle.simbolo || 'Gs.'}</span>
                          </div>
                          <label className="flex items-center gap-2 text-xs text-slate-300">
                            Cantidad
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={detalle.cantidad}
                              onChange={(e) => handleCantidadChange(detalle.monedaCodigo, Number(e.target.value))}
                              className={`${styles.input} w-full px-3 py-2`}
                              disabled={formDeshabilitado}
                            />
                          </label>
                          <div className="flex flex-col justify-center text-right text-xs font-semibold text-emerald-300">
                            <span>Monto</span>
                            <span>{formatAmount(monto)} Gs.</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Totales del formulario */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className={`${styles.mutedSurface} rounded-xl px-4 py-3`}>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Total contado</p>
                  <p className="text-lg font-semibold text-emerald-300">{formatAmount(totalContado)} Gs.</p>
                </div>
                <div className={`${styles.mutedSurface} rounded-xl px-4 py-3`}>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Saldo teórico</p>
                  <p className="text-lg font-semibold text-emerald-300">{formatAmount(saldoTeorico)} Gs.</p>
                </div>
                <div className={`${styles.mutedSurface} rounded-xl px-4 py-3`}>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Diferencia</p>
                  <p className={`text-lg font-semibold ${diferencia === 0 ? 'text-slate-200' : diferencia > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {formatAmount(diferencia)} Gs. ({resolverEstadoDiferencia(diferencia)})
                  </p>
                </div>
              </div>

              <div className="pt-2 text-right">
                <button type="submit" className="rounded-xl px-4 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed" disabled={botonDeshabilitado}>
                  Registrar cierre
                </button>
              </div>
            </form>
          </section>

          {/* Listado de cierres */}
          <section className={`${styles.section} p-6`}>
            <h2 className={`text-sm font-semibold ${styles.heading}`}>Historial de cierres</h2>
            <p className={`mt-1 text-sm leading-relaxed ${styles.textSecondary}`}>
              Revisa los cierres registrados por este usuario.
            </p>

            {cierres.length === 0 ? (
              <div className="mt-5 rounded-xl border border-slate-800/60 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                Sin registros todavía.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {cierres.map((cierre) => (
                  <article key={`${cierre.aperturaCodigo}-${cierre.fecha}`} className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-400">{formatDate(cierre.fecha)}</p>
                        <p className="text-sm font-semibold text-slate-100">{cierre.cajaDescripcion}</p>
                        <p className="text-[11px] text-slate-400">
                          Responsable {cierre.usuarioNombre} {cierre.usuarioApellido} - Diferencia {formatAmount(cierre.diferencia)} Gs. ({resolverEstadoDiferencia(cierre.diferencia)})
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Total contado</p>
                        <p className="text-lg font-semibold text-emerald-300">{formatAmount(cierre.monto)} Gs.</p>
                      </div>
                    </div>

                    {cierre.detalles.length === 0 ? (
                      <p className="pt-3 text-xs text-slate-400">Sin detalle de monedas registrado.</p>
                    ) : (
                      <div className="pt-3">
                        <table className="w-full text-xs text-slate-300">
                          <thead>
                            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                              <th className="px-2 py-1">Moneda</th>
                              <th className="px-2 py-1 text-right">Cantidad</th>
                              <th className="px-2 py-1 text-right">Monto</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {cierre.detalles.map((detalle: CierreDetalleApi) => (
                              <tr key={`${detalle.aperturaCodigo}-${detalle.monedaCodigo}`}>
                                <td className="px-2 py-1">{detalle.denominacion ?? 'General'}</td>
                                <td className="px-2 py-1 text-right">{formatAmount(detalle.cantidad)}</td>
                                <td className="px-2 py-1 text-right">{formatAmount(detalle.monto)} Gs.</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default CierreCajaManager;
