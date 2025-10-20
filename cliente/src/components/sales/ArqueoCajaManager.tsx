'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { useDashboard } from '../dashboard/DashboardContext';
import { useCatalogStyles } from '../catalog/catalog-ui';
import CatalogToast from '../catalog/CatalogToast';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { useFeedbackFlash } from '@/hooks/useFeedbackFlash';
import { useGenerarReporte } from '@/hooks/useGenerarReporte';

type MonedaApi = {
  codigo: number;
  denominacion: string;
  tasa: number;
  simbolo: string;
};

type DetalleEstado = {
  monedaCodigo: number;
  denominacion: string;
  simbolo: string;
  tasa: number;
  cantidad: number;
};

type ArqueoDetalleApi = {
  codigo: number;
  aperturaCodigo: number;
  descripcion: string | null;
  tipo: string;
  monto: number;
  monedaDenominacion: string | null;
  cantidad: number | null;
};

type ArqueoCajaApi = {
  codigo: number;
  aperturaCodigo: number;
  fecha: string;
  cajaDescripcion: string;
  usuarioNombre: string;
  usuarioApellido: string;
  total: number;
  motivo: string | null;
  detalles: ArqueoDetalleApi[];
};

type ResumenDisponible = {
  aperturaCodigo: number;
  cajaDescripcion: string;
  aperturaFecha: string;
  saldoDisponible: number;
  montoApertura: number;
  saldoAnterior: number;
  totalCreditos: number;
  totalDebitos: number;
};

const numberFormatter = new Intl.NumberFormat('es-PY', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatAmount = (value: number) => numberFormatter.format(Math.round(value));

const formatDate = (value: string) => {
  if (!value) {
    return '';
  }
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) {
    return value;
  }
  return `${day}/${month}/${year}`;
};

const ArqueoCajaManager = () => {
  const { setPageTitle, theme } = useDashboard();
  const styles = useCatalogStyles(theme);
  const authFetch = useAuthFetch();
  const { feedback, showFeedback, clearFeedback } = useFeedbackFlash();
  const generarReporte = useGenerarReporte();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [monedas, setMonedas] = useState<MonedaApi[]>([]);
  const [detalles, setDetalles] = useState<DetalleEstado[]>([]);
  const [arqueos, setArqueos] = useState<ArqueoCajaApi[]>([]);
  const [resumen, setResumen] = useState<ResumenDisponible | null>(null);
  const [motivo, setMotivo] = useState('');

  const totalRetiro = useMemo(
    () => detalles.reduce((acc, detalle) => acc + detalle.cantidad * detalle.tasa, 0),
    [detalles],
  );
  const saldoDisponible = resumen?.saldoDisponible ?? 0;
  const excedeSaldo = totalRetiro - saldoDisponible > 0.5;
  const saldoRestante = saldoDisponible - totalRetiro;

  const detallesParaEnviar = useMemo(
    () =>
      detalles
        .filter((detalle) => detalle.cantidad > 0)
        .map((detalle) => ({
          monedaCodigo: detalle.monedaCodigo,
          cantidad: detalle.cantidad,
        })),
    [detalles],
  );

  const formDeshabilitado = loading || saving || resumen === null || monedas.length === 0;
  const botonDeshabilitado =
    formDeshabilitado || !motivo.trim() || detallesParaEnviar.length === 0 || excedeSaldo;

  const construirDetalleInicial = useCallback(
    (monedasDisponibles: MonedaApi[]): DetalleEstado[] =>
      monedasDisponibles.map((moneda) => ({
        monedaCodigo: moneda.codigo,
        denominacion: moneda.denominacion,
        simbolo: moneda.simbolo,
        tasa: moneda.tasa,
        cantidad: 0,
      })),
    [],
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const monedasRes = await authFetch('/catalog/currencies');
      const monedasPayload = (await monedasRes.json()) as { monedas?: MonedaApi[] };
      const monedasLista = monedasPayload.monedas ?? [];
      setMonedas(monedasLista);
      setDetalles(construirDetalleInicial(monedasLista));
    } catch (error) {
      if (error instanceof Error) {
        showFeedback(error.message, 'error');
      } else {
        showFeedback('No se pudieron obtener las monedas disponibles.', 'error');
      }
      setLoading(false);
      return;
    }

    try {
      const resumenRes = await authFetch('/sales/cash-audits/available');
      const resumenDisponible = (await resumenRes.json()) as ResumenDisponible;
      setResumen(resumenDisponible);
    } catch (error) {
      setResumen(null);
      if (error instanceof Error) {
        const message = error.message;
        if (
          message.includes('No tienes una apertura de caja activa') ||
          message.includes('No se encontro una apertura activa')
        ) {
          // No hay apertura activa, es un estado esperado luego de un cierre.
        } else {
          showFeedback(message, 'error');
        }
      } else {
        showFeedback('No se pudo obtener el saldo disponible.', 'error');
      }
    }

    try {
      const arqueosRes = await authFetch('/sales/cash-audits?mine=true');
      const arqueosPayload = (await arqueosRes.json()) as { arqueos?: ArqueoCajaApi[] };
      setArqueos(arqueosPayload.arqueos ?? []);
    } catch (error) {
      if (error instanceof Error) {
        showFeedback(error.message, 'error');
      } else {
        showFeedback('No se pudo obtener el historial de arqueos.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [authFetch, construirDetalleInicial, showFeedback]);

  useEffect(() => {
    setPageTitle('Arqueo de caja');
    void fetchData();
  }, [fetchData, setPageTitle]);

  const handleCantidadChange = useCallback((monedaCodigo: number, value: number) => {
    setDetalles((prev) =>
      prev.map((detalle) =>
        detalle.monedaCodigo === monedaCodigo
          ? { ...detalle, cantidad: Number.isFinite(value) && value > 0 ? value : 0 }
          : detalle,
      ),
    );
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (formDeshabilitado) {
        return;
      }

      if (!motivo.trim()) {
        showFeedback('Ingresa el motivo del arqueo.', 'error');
        return;
      }

      if (excedeSaldo) {
        showFeedback('El monto a retirar supera el saldo disponible.', 'error');
        return;
      }

      if (detallesParaEnviar.length === 0) {
        showFeedback('Registra al menos una moneda con cantidad mayor a cero.', 'error');
        return;
      }

      setSaving(true);
      try {
        const response = await authFetch('/sales/cash-audits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            motivo: motivo.trim(),
            detalles: detallesParaEnviar,
          }),
        });

        const payload = (await response.json().catch(() => null)) as ArqueoCajaApi | null;

        showFeedback('Arqueo registrado correctamente.');

        if (payload && typeof payload.aperturaCodigo === 'number') {
          try {
            await generarReporte({
              nombreReporte: 'arqueo_caja',
              parametros: {
                P_APERTURA: payload.aperturaCodigo,
              },
            });
            showFeedback('Reporte generado.', 'success');
          } catch {
            showFeedback('El arqueo se registro, pero no se pudo generar el reporte.', 'error');
          }
        }

        setMotivo('');
        await fetchData();
      } catch (error) {
        if (error instanceof Error) {
          showFeedback(error.message, 'error');
        } else {
          showFeedback('No se pudo registrar el arqueo.', 'error');
        }
      } finally {
        setSaving(false);
      }
    },
    [authFetch, detallesParaEnviar, excedeSaldo, fetchData, formDeshabilitado, generarReporte, motivo, showFeedback],
  );

  const detallesRetiro = useCallback(
    (lista: ArqueoDetalleApi[]) => lista.filter((detalle) => detalle.tipo === 'D'),
    [],
  );

  const handleReimpresion = useCallback(
    async (aperturaCodigo: number) => {
      try {
        await generarReporte({
          nombreReporte: 'arqueo_caja',
          parametros: {
            P_APERTURA: aperturaCodigo,
          },
        });
        showFeedback('Reporte generado.', 'success');
      } catch (error) {
        if (error instanceof Error) {
          showFeedback(error.message, 'error');
        } else {
          showFeedback('No se pudo generar el reporte.', 'error');
        }
      }
    },
    [generarReporte, showFeedback],
  );

  return (
    <div className="p-5 sm:p-6">
      <CatalogToast feedback={feedback} theme={theme} onClose={clearFeedback} />
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className={`${styles.panel} p-6`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className={`text-xl font-semibold ${styles.heading}`}>Arqueo de caja</h1>
              <p className={`text-sm ${styles.subheading}`}>
                Registra el retiro de efectivo cuando la caja necesita un arqueo parcial o total.
              </p>
            </div>
            {loading || saving ? (
              <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1 text-xs font-medium text-indigo-300">
                {saving ? 'Guardando cambios...' : 'Cargando datos...'}
              </span>
            ) : null}
          </div>

          {resumen ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <p className="text-xs uppercase tracking-wide text-slate-400">Saldo disponible</p>
                <p className="text-lg font-semibold text-emerald-400">{formatAmount(resumen.saldoDisponible)} Gs.</p>
              </div>
              <div className={`${styles.mutedSurface} rounded-2xl px-4 py-3`}>
                <p className="text-xs uppercase tracking-wide text-slate-400">Ingresos por credito</p>
                <p className={`text-sm font-semibold ${styles.textPrimary}`}>
                  {formatAmount(resumen.totalCreditos)} Gs.
                </p>
                <p className={`text-[11px] ${styles.textSecondary}`}>
                  Apertura {formatAmount(resumen.montoApertura)} Gs. - Saldo anterior {formatAmount(resumen.saldoAnterior)} Gs.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              No se encontro una apertura activa asignada. Crea o asigna una apertura para continuar.
            </div>
          )}
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <section className={`${styles.section} p-6`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-sm font-semibold ${styles.heading}`}>Registrar arqueo</h2>
              {resumen && resumen.totalDebitos > 0 ? (
                <span className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold text-indigo-200">
                  Arqueo previo registrado
                </span>
              ) : null}
            </div>
            <p className={`mt-1 text-sm leading-relaxed ${styles.textSecondary}`}>
              Ingresar el motivo y las cantidades por moneda. El sistema valida que el retiro no supere el saldo disponible.
            </p>

            <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-2 text-sm">
                <span className={styles.textSecondary}>Motivo del arqueo *</span>
                <textarea
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  rows={3}
                  className={`${styles.input} resize-none px-3 py-2`}
                  placeholder="Describe el motivo o destino del retiro"
                  disabled={formDeshabilitado}
                />
              </label>

              {monedas.length === 0 ? (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
                  Aun no se configuraron tipos de moneda. Agrega monedas en el catalogo para continuar.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${styles.textSecondary}`}>Detalle por moneda</span>
                    <span className="text-[11px] text-slate-400">Los montos se calculan automaticamente.</span>
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
                            <span className="text-[11px] text-slate-400">
                              Tasa: {formatAmount(detalle.tasa)} {detalle.simbolo || 'Gs.'}
                            </span>
                          </div>
                          <label className="flex items-center gap-2 text-xs text-slate-300">
                            Cantidad
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={detalle.cantidad}
                              onChange={(event) =>
                                handleCantidadChange(detalle.monedaCodigo, Number(event.target.value))
                              }
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

              {resumen ? (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    excedeSaldo
                      ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                      : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-wide opacity-80">Saldo disponible</span>
                      <span className="text-base font-semibold">{formatAmount(saldoDisponible)} Gs.</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-wide opacity-80">Total a retirar</span>
                      <span className="text-base font-semibold">{formatAmount(totalRetiro)} Gs.</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-wide opacity-80">
                        {excedeSaldo ? 'Excedente' : 'Saldo restante'}
                      </span>
                      <span className="text-base font-semibold">
                        {formatAmount(excedeSaldo ? Math.abs(saldoRestante) : Math.max(saldoRestante, 0))} Gs.
                      </span>
                    </div>
                  </div>
                  {excedeSaldo ? (
                    <p className="mt-2 text-xs opacity-80">
                      El monto ingresado supera el saldo disponible. Ajusta las cantidades para continuar.
                    </p>
                  ) : saldoRestante > 0.5 ? (
                    <p className="mt-2 text-xs opacity-80">
                      Quedara un saldo disponible de {formatAmount(saldoRestante)} Gs. en la caja.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs opacity-80">El retiro consumira por completo el saldo disponible.</p>
                  )}
                </div>
              ) : null}

              <button
                type="submit"
                className="w-full rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
                disabled={botonDeshabilitado}
              >
                Registrar arqueo
              </button>
            </form>
          </section>

          <section className={`${styles.section} p-6`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-sm font-semibold ${styles.heading}`}>Historial de arqueos</h2>
              <span className={`text-xs ${styles.textSecondary}`}>
                {arqueos.length} registro{arqueos.length === 1 ? '' : 's'}
              </span>
            </div>
            <p className={`mt-1 text-sm ${styles.textSecondary}`}>
              Consulta los arqueos registrados para auditar retiros y mantener el control de caja.
            </p>

            <div className="mt-5 space-y-4">
              {arqueos.length === 0 ? (
                <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 px-4 py-6 text-center text-xs text-slate-400">
                  Aun no se registraron arqueos para tus aperturas.
                </div>
              ) : (
                arqueos.map((arqueo) => {
                  const retiros = detallesRetiro(arqueo.detalles);
                  return (
                    <article
                      key={`${arqueo.aperturaCodigo}-${arqueo.codigo}`}
                      className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                        <div>
                          <p className="text-xs text-slate-400">
                            Apertura #{arqueo.aperturaCodigo} - {formatDate(arqueo.fecha)}
                          </p>
                          <p className="text-sm font-semibold text-slate-100">
                            {arqueo.motivo ?? 'Sin motivo registrado'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Caja {arqueo.cajaDescripcion} - Responsable {arqueo.usuarioNombre} {arqueo.usuarioApellido}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <p className="text-xs text-slate-400">Total retirado</p>
                            <p className="text-lg font-semibold text-emerald-300">{formatAmount(arqueo.total)} Gs.</p>
                          </div>
                          <button
                            type="button"
                            className="rounded-full border border-indigo-500/40 px-3 py-1 text-[11px] font-semibold text-indigo-200 transition hover:bg-indigo-500/20"
                            onClick={() => {
                              void handleReimpresion(arqueo.aperturaCodigo);
                            }}
                          >
                            Reimprimir
                          </button>
                        </div>
                      </div>

                      {retiros.length === 0 ? (
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
                              {retiros.map((detalle) => (
                                <tr key={detalle.codigo}>
                                  <td className="px-2 py-1">{detalle.monedaDenominacion ?? 'General'}</td>
                                  <td className="px-2 py-1 text-right">
                                    {detalle.cantidad !== null ? formatAmount(detalle.cantidad) : '-'}
                                  </td>
                                  <td className="px-2 py-1 text-right">{formatAmount(detalle.monto)} Gs.</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ArqueoCajaManager;


