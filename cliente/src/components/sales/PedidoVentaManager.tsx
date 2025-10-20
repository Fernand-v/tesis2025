"use client";

import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Search,
  Package,
  ShoppingCart,
  Calendar,
  DollarSign,
  User,
  Filter,
  X,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Barcode,
  List,
} from "lucide-react";

import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useFeedbackFlash } from "@/hooks/useFeedbackFlash";
import { useDashboard } from "../dashboard/DashboardContext";
import { useCatalogStyles } from "../catalog/catalog-ui";
import CatalogToast from "../catalog/CatalogToast";

interface PersonApi {
  codigo?: number;
  nombre?: string;
  apellido?: string;
  razonSocial?: string;
  PER_CODIGO?: number;
  PER_NOMBRE?: string;
  PER_APELLIDO?: string;
}

interface PersonOption {
  codigo: number;
  nombre: string;
}

interface EstadoOption {
  codigo: number;
  descripcion: string;
}

interface ItemApi {
  codigo?: number;
  descripcion?: string;
  codigoBarra?: string | null;
  ITEM_CODIGO?: number;
  ITEM_DESC?: string;
  ITEM_COD_BARRA?: string | null;
}

interface ItemRecord {
  codigo: number;
  descripcion: string;
  codigoBarra: string | null;
}

interface PedidoDetalle {
  codigo: number;
  descripcion: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

interface Pedido {
  codigo: number;
  fechaPedido: string;
  fechaEntrega: string | null;
  observacion: string | null;
  personaCodigo: number;
  personaNombre: string;
  adelanto: number;
  total: number;
  estado: number;
  estadoDescripcion: string | null;
  items: PedidoDetalle[];
}

interface AperturaResumen {
  codigo: number;
  estadoCodigo: number;
  estadoDescripcion: string;
}

interface OrderItem {
  id: string;
  itemCodigo: number;
  descripcion: string;
  codigoBarra: string | null;
  cantidad: number;
  precio: number;
}

type FilterValue = number | "all";
type TabId = "create" | "list";

type OrderFilterInput = {
  personaCodigo: FilterValue;
  estadoCodigo: FilterValue;
  fechaDesde: string;
  fechaHasta: string;
  texto: string;
};

const buildPersonName = (persona: PersonApi): string => {
  const nombre = typeof persona.nombre === "string" ? persona.nombre : persona.PER_NOMBRE ?? "";
  const apellido =
    typeof persona.apellido === "string" ? persona.apellido : persona.PER_APELLIDO ?? "";
  const full = `${nombre} ${apellido}`.trim();
  if (full) return full;
  if (typeof persona.razonSocial === "string") return persona.razonSocial;
  return nombre || apellido || "Persona";
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("es-PY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));

const PedidoVentaManager = () => {
  const { setPageTitle, theme } = useDashboard();
  const authFetch = useAuthFetch();
  const styles = useCatalogStyles(theme);
  const { feedback, showFeedback, clearFeedback } = useFeedbackFlash();

  const [persons, setPersons] = useState<PersonOption[]>([]);
  const [estados, setEstados] = useState<EstadoOption[]>([]);
  const [itemsCatalog, setItemsCatalog] = useState<ItemRecord[]>([]);
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<PersonOption | null>(null);
  const [fechaPedido, setFechaPedido] = useState(() => new Date().toISOString().slice(0, 10));
  const [observacion, setObservacion] = useState("");
  const [adelanto, setAdelanto] = useState<number>(0);
  const [barcodeValue, setBarcodeValue] = useState("");
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemModalSearch, setItemModalSearch] = useState("");
  const [loadingCombos, setLoadingCombos] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aperturaActiva, setAperturaActiva] = useState<AperturaResumen | null>(null);
  const [checkingApertura, setCheckingApertura] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("create");
  const [filterPersonaCodigo, setFilterPersonaCodigo] = useState<FilterValue>("all");
  const [filterEstadoCodigo, setFilterEstadoCodigo] = useState<FilterValue>("all");
  const [filterFechaDesde, setFilterFechaDesde] = useState("");
  const [filterFechaHasta, setFilterFechaHasta] = useState("");
  const [filterTexto, setFilterTexto] = useState("");
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [personSearch, setPersonSearch] = useState("");

  const totalPedido = useMemo(
    () => orderItems.reduce((acc, item) => acc + item.cantidad * item.precio, 0),
    [orderItems],
  );
  const faltante = useMemo(() => Math.max(totalPedido - adelanto, 0), [totalPedido, adelanto]);
  const aperturaDisponible = Boolean(aperturaActiva);

  const personaFilterOptions = useMemo(
    () => [
      { codigo: "all" as const, nombre: "Todas las personas" },
      ...persons.map((persona) => ({ codigo: persona.codigo, nombre: persona.nombre })),
    ],
    [persons],
  );

  const estadoFilterOptions = useMemo(
    () => [
      { codigo: "all" as const, descripcion: "Todos los estados" },
      ...estados.map((estado) => ({ codigo: estado.codigo, descripcion: estado.descripcion })),
    ],
    [estados],
  );

  const itemModalFiltered = useMemo(() => {
    if (!itemModalSearch.trim()) return itemsCatalog;
    const needle = itemModalSearch.trim().toLowerCase();
    return itemsCatalog.filter(
      (item) =>
        item.descripcion.toLowerCase().includes(needle) ||
        (item.codigoBarra && item.codigoBarra.toLowerCase().includes(needle)),
    );
  }, [itemModalSearch, itemsCatalog]);

  const filteredPersons = useMemo(() => {
    if (!personSearch.trim()) return persons;
    const query = personSearch.trim().toLowerCase();
    return persons.filter((p) => p.nombre.toLowerCase().includes(query));
  }, [personSearch, persons]);

  const resetForm = useCallback(() => {
    setSelectedPerson(null);
    setOrderItems([]);
    setObservacion("");
    setAdelanto(0);
    setFechaPedido(new Date().toISOString().slice(0, 10));
    setBarcodeValue("");
  }, []);

  const addOrIncrementItem = useCallback((item: ItemRecord) => {
    setOrderItems((prev) => {
      const existing = prev.find((line) => line.itemCodigo === item.codigo);
      if (existing) {
        return prev.map((line) =>
          line.itemCodigo === item.codigo ? { ...line, cantidad: line.cantidad + 1 } : line,
        );
      }
      return [
        ...prev,
        {
          id: `${item.codigo}-${Date.now()}`,
          itemCodigo: item.codigo,
          descripcion: item.descripcion,
          codigoBarra: item.codigoBarra,
          cantidad: 1,
          precio: 0,
        },
      ];
    });
  }, []);

  const handleBarcodeSubmit = useCallback(() => {
    if (!barcodeValue.trim()) return;
    const found = itemsCatalog.find(
      (item) =>
        item.codigoBarra &&
        item.codigoBarra.toLowerCase() === barcodeValue.trim().toLowerCase(),
    );
    if (found) {
      addOrIncrementItem(found);
      setBarcodeValue("");
    } else {
      showFeedback("No se encontró ningún item con ese código de barra", "error");
    }
  }, [addOrIncrementItem, barcodeValue, itemsCatalog, showFeedback]);

  const updateItemField = useCallback(
    (id: string, field: "cantidad" | "precio", value: number) => {
      if (!Number.isFinite(value) || value < 0) return;
      setOrderItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, [field]: field === "cantidad" && value === 0 ? item[field] : value }
            : item,
        ),
      );
    },
    [],
  );

  const removeItem = useCallback((id: string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const closeItemModal = useCallback(() => {
    setItemModalOpen(false);
    setItemModalSearch("");
  }, []);

  const handleSelectModalItem = useCallback(
    (item: ItemRecord) => {
      addOrIncrementItem(item);
      setItemModalSearch("");
      setItemModalOpen(false);
    },
    [addOrIncrementItem],
  );

  const handleSelectPerson = useCallback((p: PersonOption) => {
    setSelectedPerson(p);
    setShowPersonModal(false);
  }, []);

  const fetchCombos = useCallback(async () => {
    clearFeedback();
    setLoadingCombos(true);
    setCheckingApertura(true);
    try {
      const [personsRes, estadosRes, itemsRes, aperturasRes] = await Promise.all([
        authFetch("/catalog/persons"),
        authFetch("/catalog/states"),
        authFetch("/catalog/inventory/items"),
        authFetch("/sales/cash-openings?mine=true"),
      ]);

      const personsData = (await personsRes.json()) as { personas?: PersonApi[] };
      const estadosData = (await estadosRes.json()) as { estados?: EstadoOption[] };
      const itemsData = (await itemsRes.json()) as { items?: ItemApi[] };
      const aperturasData = (await aperturasRes.json()) as { aperturas?: AperturaResumen[] };

      const mappedPersons = (personsData.personas ?? [])
        .map((persona) => ({
          codigo: Number(persona.codigo ?? persona.PER_CODIGO ?? 0),
          nombre: buildPersonName(persona),
        }))
        .filter((option) => Number.isFinite(option.codigo) && option.codigo > 0);

      setPersons(mappedPersons);
      setEstados(estadosData.estados ?? []);

      const mappedItems =
        itemsData.items?.map((item) => ({
          codigo: Number(item.codigo ?? item.ITEM_CODIGO ?? 0),
          descripcion: String(item.descripcion ?? item.ITEM_DESC ?? "Item"),
          codigoBarra: item.codigoBarra ?? item.ITEM_COD_BARRA ?? null,
        })) ?? [];

      setItemsCatalog(mappedItems);

      const apertura =
        (aperturasData.aperturas ?? []).find(
          (entry) =>
            entry.estadoCodigo === 1 ||
            (entry.estadoDescripcion?.toLowerCase().includes("abiert") ?? false),
        ) ?? null;

      setAperturaActiva(apertura);
    } catch (error) {
      showFeedback((error as Error).message, "error");
    } finally {
      setLoadingCombos(false);
      setCheckingApertura(false);
    }
  }, [authFetch, clearFeedback, showFeedback]);
  const fetchOrders = useCallback(
    async (override?: Partial<OrderFilterInput>) => {
      clearFeedback();
      setOrdersLoading(true);
      try {
        const personaValue = override?.personaCodigo ?? filterPersonaCodigo;
        const estadoValue = override?.estadoCodigo ?? filterEstadoCodigo;
        const fechaDesdeValue = override?.fechaDesde ?? filterFechaDesde;
        const fechaHastaValue = override?.fechaHasta ?? filterFechaHasta;
        const textoValue = override?.texto ?? filterTexto;

        const params = new URLSearchParams();
        if (personaValue !== "all") params.set("personaCodigo", String(personaValue));
        if (estadoValue !== "all") params.set("estado", String(estadoValue));
        if (fechaDesdeValue.trim()) params.set("fechaDesde", fechaDesdeValue);
        if (fechaHastaValue.trim()) params.set("fechaHasta", fechaHastaValue);
        if (textoValue.trim()) params.set("q", textoValue.trim());

        const query = params.toString();
        const response = await authFetch(`/sales/orders${query ? `?${query}` : ""}`);
        const data = (await response.json()) as { pedidos?: Pedido[] };
        setOrders(data.pedidos ?? []);
      } catch (error) {
        showFeedback((error as Error).message, "error");
      } finally {
        setOrdersLoading(false);
      }
    },
    [
      authFetch,
      clearFeedback,
      filterEstadoCodigo,
      filterFechaDesde,
      filterFechaHasta,
      filterPersonaCodigo,
      filterTexto,
      showFeedback,
    ],
  );

  useEffect(() => {
    setPageTitle("Pedidos de venta");
    void (async () => {
      await fetchCombos();
      await fetchOrders();
    })();
    return () => setPageTitle("Sistema General");
  }, [fetchCombos, fetchOrders, setPageTitle]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!selectedPerson) {
        showFeedback("Selecciona una persona para el pedido.", "error");
        return;
      }

      if (orderItems.length === 0) {
        showFeedback("Agrega al menos un item al pedido.", "error");
        return;
      }

      const invalidItem = orderItems.find(
        (item) => item.cantidad <= 0 || item.precio <= 0 || Number.isNaN(item.precio),
      );
      if (invalidItem) {
        showFeedback("Verifica cantidades y precios de los items.", "error");
        return;
      }

      if (!aperturaDisponible) {
        showFeedback("Necesitas una apertura de caja activa para registrar pedidos.", "error");
        return;
      }

      setSaving(true);
      clearFeedback();

      try {
        await authFetch("/sales/orders", {
          method: "POST",
          body: JSON.stringify({
            fechaPedido,
            fechaEntrega: null,
            observacion: observacion.trim() === "" ? null : observacion.trim(),
            personaCodigo: selectedPerson.codigo,
            adelanto,
            items: orderItems.map((item) => ({
              itemCodigo: item.itemCodigo,
              cantidad: item.cantidad,
              precio: item.precio,
            })),
          }),
        });

        showFeedback("Pedido registrado correctamente.");
        resetForm();
        await fetchOrders();
        setActiveTab("list");
      } catch (error) {
        showFeedback((error as Error).message, "error");
      } finally {
        setSaving(false);
      }
    },
    [
      adelanto,
      aperturaDisponible,
      authFetch,
      clearFeedback,
      fetchOrders,
      fechaPedido,
      observacion,
      orderItems,
      resetForm,
      selectedPerson,
      showFeedback,
    ],
  );

  const handleFilterSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      void fetchOrders();
    },
    [fetchOrders],
  );

  const handleClearFilters = useCallback(() => {
    setFilterPersonaCodigo("all");
    setFilterEstadoCodigo("all");
    setFilterFechaDesde("");
    setFilterFechaHasta("");
    setFilterTexto("");
    void fetchOrders({
      personaCodigo: "all",
      estadoCodigo: "all",
      fechaDesde: "",
      fechaHasta: "",
      texto: "",
    });
  }, [fetchOrders]);

  const canSubmit =
    selectedPerson !== null && orderItems.length > 0 && aperturaDisponible && !saving;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 md:p-10">
      <CatalogToast feedback={feedback} theme={theme} onClose={clearFeedback} />

      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-xl">
                <ShoppingCart className="w-8 h-8 text-indigo-400" />
              </div>
              Pedidos de Venta
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Gestiona la carga y el seguimiento de los pedidos de tus clientes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void fetchCombos()}
              disabled={loadingCombos}
              className="px-4 py-2 bg-slate-800/60 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-600/50 flex items-center gap-2 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingCombos ? "animate-spin" : ""}`} />
              Actualizar Catálogos
            </button>
            <button
              type="button"
              onClick={() => void fetchOrders()}
              disabled={ordersLoading}
              className="px-4 py-2 bg-slate-800/60 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-600/50 flex items-center gap-2 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${ordersLoading ? "animate-spin" : ""}`} />
              Actualizar Pedidos
            </button>
          </div>
        </div>

        {!checkingApertura && !aperturaDisponible && (
          <div className="mt-4 bg-amber-500/10 border border-amber-500/40 rounded-xl p-4 flex items-start gap-3 text-amber-100">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Apertura de caja requerida</p>
              <p className="text-xs text-amber-200/80">
                No se detectó una apertura de caja activa. Para registrar pedidos es necesario abrir
                caja.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className={`${styles.panel} overflow-hidden`}>
          {/* Tabs */}
          <div className="border-b border-slate-700/60 px-6 pt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className={`px-6 py-2.5 text-sm font-semibold rounded-t-xl flex items-center gap-2 transition-all ${
                activeTab === "create"
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Plus className="w-4 h-4" />
              Registrar Pedido
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className={`px-6 py-2.5 text-sm font-semibold rounded-t-xl flex items-center gap-2 transition-all ${
                activeTab === "list"
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <List className="w-4 h-4" />
              Pedidos Registrados
            </button>
          </div>

          <div className="p-6">
            {activeTab === "create" ? (
              <>
                {/* Formulario principal */}
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
                    <div>
                      <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                        Cliente
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPersonModal(true)}
                        className={`${styles.input} h-[42px] w-full flex justify-between items-center font-medium`}
                      >
                        {selectedPerson ? (
                          <span>{selectedPerson.nombre}</span>
                        ) : (
                          <span className="text-slate-500">Seleccionar cliente...</span>
                        )}
                        <Search className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                        Fecha Pedido
                      </label>
                      <input
                        type="date"
                        value={fechaPedido}
                        onChange={(e) => setFechaPedido(e.target.value)}
                        className={`${styles.input} h-[42px] w-full`}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                        Adelanto (Gs.)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={adelanto}
                        onChange={(e) => setAdelanto(Number(e.target.value))}
                        className={`${styles.input} h-[42px] w-full`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                      Observaciones
                    </label>
                    <textarea
                      value={observacion}
                      onChange={(e) => setObservacion(e.target.value)}
                      className={`${styles.input} w-full min-h-[90px] resize-none`}
                      placeholder="Notas o instrucciones especiales..."
                    />
                  </div>
                  {/* === Items del pedido === */}
                  <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-2xl p-6 border border-slate-700/40">
                    <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-indigo-400" />
                      Items del Pedido
                    </h3>

                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                      <div className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                          <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                          <input
                            type="text"
                            value={barcodeValue}
                            onChange={(e) => setBarcodeValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleBarcodeSubmit();
                              }
                            }}
                            placeholder="Escanear código de barras"
                            className={`${styles.input} w-full pl-12 pr-4 h-[56px] text-[15px] font-medium`}

                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleBarcodeSubmit}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-md"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setItemModalOpen(true)}
                        className="px-5 py-2.5 bg-slate-700/60 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-600/50 flex items-center gap-2 transition-all"
                      >
                        <Search className="w-4 h-4" />
                        Buscar Catálogo
                      </button>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-700/50">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-900/60 text-slate-400 uppercase text-xs tracking-wider">
                              <th className="px-4 py-3 text-left font-semibold">Producto</th>
                              <th className="px-4 py-3 text-center font-semibold">Cantidad</th>
                              <th className="px-4 py-3 text-center font-semibold">Precio Unit.</th>
                              <th className="px-4 py-3 text-right font-semibold">Subtotal</th>
                              <th className="px-4 py-3 text-center font-semibold">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700/50">
                            {orderItems.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="py-10 text-center text-slate-500 text-sm"
                                >
                                  <Package className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                                  No hay items agregados
                                </td>
                              </tr>
                            ) : (
                              orderItems.map((item) => (
                                <tr
                                  key={item.id}
                                  className="bg-slate-800/30 hover:bg-slate-800/50 transition"
                                >
                                  <td className="px-4 py-3">
                                    <p className="text-white font-semibold">{item.descripcion}</p>
                                    {item.codigoBarra && (
                                      <p className="text-xs text-slate-500">
                                        Código: {item.codigoBarra}
                                      </p>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <input
                                      type="number"
                                      min={1}
                                      value={item.cantidad}
                                      onChange={(e) =>
                                        updateItemField(
                                          item.id,
                                          "cantidad",
                                          Number(e.target.value),
                                        )
                                      }
                                      className={`${styles.input} w-20 text-center`}
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <input
                                      type="number"
                                      min={0}
                                      step={100}
                                      value={item.precio}
                                      onChange={(e) =>
                                        updateItemField(
                                          item.id,
                                          "precio",
                                          Number(e.target.value),
                                        )
                                      }
                                      className={`${styles.input} w-28 text-center`}
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                                    {formatNumber(item.cantidad * item.precio)} Gs.
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => removeItem(item.id)}
                                      className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {orderItems.length > 0 && (
                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="text-center bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
                          <p className="text-xs text-slate-400 uppercase mb-1">Total Pedido</p>
                          <p className="text-2xl font-bold text-white">
                            {formatNumber(totalPedido)} Gs.
                          </p>
                        </div>
                        <div className="text-center bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
                          <p className="text-xs text-slate-400 uppercase mb-1">Adelanto</p>
                          <p className="text-2xl font-bold text-indigo-400">
                            {formatNumber(adelanto)} Gs.
                          </p>
                        </div>
                        <div className="text-center bg-emerald-500/20 rounded-xl p-4 border border-emerald-500/30">
                          <p className="text-xs text-emerald-300 uppercase mb-1">
                            Saldo Pendiente
                          </p>
                          <p className="text-2xl font-bold text-emerald-300">
                            {formatNumber(faltante)} Gs.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 bg-slate-700/60 hover:bg-slate-700 text-white rounded-xl border border-slate-600/50 font-semibold"
                    >
                      Limpiar Formulario
                    </button>
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition disabled:opacity-50 flex items-center gap-2 justify-center"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Guardando…
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" /> Registrar Pedido
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                {/* === Pestaña Pedidos Registrados === */}
                <form
  onSubmit={handleFilterSubmit}
  className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40 space-y-4 mb-6"
>
  <div className="flex items-center gap-2 mb-1">
    <Filter className="w-5 h-5 text-indigo-400" />
    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
      Filtros de búsqueda
    </h3>
  </div>

  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
    <div className="xl:col-span-2">
      <label className="block text-xs text-slate-400 mb-1">Cliente</label>
      <select
        value={filterPersonaCodigo === "all" ? "all" : String(filterPersonaCodigo)}
        onChange={(e) =>
          setFilterPersonaCodigo(e.target.value === "all" ? "all" : Number(e.target.value))
        }
        className={`${styles.input} w-full h-[52px] text-base font-medium`}
      >
        {personaFilterOptions.map((opt) => (
          <option key={String(opt.codigo)} value={String(opt.codigo)}>
            {opt.nombre}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label className="block text-xs text-slate-400 mb-1">Estado</label>
      <select
        value={filterEstadoCodigo === "all" ? "all" : String(filterEstadoCodigo)}
        onChange={(e) =>
          setFilterEstadoCodigo(e.target.value === "all" ? "all" : Number(e.target.value))
        }
        className={`${styles.input} w-full h-[52px] text-base font-medium`}
      >
        {estadoFilterOptions.map((opt) => (
          <option key={String(opt.codigo)} value={String(opt.codigo)}>
            {opt.descripcion}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label className="block text-xs text-slate-400 mb-1">Desde</label>
      <input
        type="date"
        value={filterFechaDesde}
        onChange={(e) => setFilterFechaDesde(e.target.value)}
        className={`${styles.input} w-full h-[52px] text-base font-medium`}
      />
    </div>

    <div>
      <label className="block text-xs text-slate-400 mb-1">Hasta</label>
      <input
        type="date"
        value={filterFechaHasta}
        onChange={(e) => setFilterFechaHasta(e.target.value)}
        className={`${styles.input} w-full h-[52px] text-base font-medium`}
      />
    </div>

    <div>
      <label className="block text-xs text-slate-400 mb-1">Buscar</label>
      <input
        type="text"
        value={filterTexto}
        onChange={(e) => setFilterTexto(e.target.value)}
        placeholder="Texto…"
        className={`${styles.input} w-full h-[52px] text-base font-medium`}
      />
    </div>
  </div>

  <div className="flex gap-3 pt-2">
    <button
      type="submit"
      disabled={ordersLoading}
      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
    >
      <Search className="w-4 h-4" />
      {ordersLoading ? "Buscando…" : "Aplicar Filtros"}
    </button>
    <button
      type="button"
      onClick={handleClearFilters}
      className="px-6 py-3 bg-slate-700/60 hover:bg-slate-700 text-white rounded-xl border border-slate-600/50 font-semibold flex items-center gap-2"
    >
      <X className="w-4 h-4" /> Limpiar
    </button>
  </div>
</form>


                {ordersLoading ? (
                  <div className="flex justify-center py-16">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-20 text-slate-500">
                    <Package className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                    No hay pedidos registrados
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const faltantePedido = Math.max(order.total - order.adelanto, 0);
                      return (
                        <div
                          key={order.codigo}
                          className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40 hover:border-indigo-500/40 transition"
                        >
                          <div className="flex flex-wrap justify-between gap-4 mb-3">
                            <div>
                              <p className="text-xs text-slate-400 uppercase">
                                Pedido #{order.codigo}
                              </p>
                              <p className="text-white font-semibold">{order.personaNombre}</p>
                              <p className="text-xs text-slate-500">
                                Fecha: {order.fechaPedido}
                              </p>
                              {order.observacion && (
                                <p className="text-xs text-slate-500 italic mt-1">
                                  “{order.observacion}”
                                </p>
                              )}
                            </div>
                            <div className="text-right text-sm">
                              <p className="font-semibold text-white">
                                Total {formatNumber(order.total)} Gs.
                              </p>
                              <p className="text-indigo-400">
                                Adelanto {formatNumber(order.adelanto)} Gs.
                              </p>
                              <p className="text-emerald-400">
                                Pendiente {formatNumber(faltantePedido)} Gs.
                              </p>
                            </div>
                          </div>
                          <div className="overflow-hidden rounded-xl border border-slate-700/50">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider">
                                <tr>
                                  <th className="px-4 py-3 text-left">Producto</th>
                                  <th className="px-4 py-3 text-center">Cant.</th>
                                  <th className="px-4 py-3 text-center">Precio Unit.</th>
                                  <th className="px-4 py-3 text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-700/50">
                                {order.items.map((detalle) => (
                                  <tr key={detalle.codigo}>
                                    <td className="px-4 py-2 text-white">
                                      {detalle.descripcion}
                                    </td>
                                    <td className="px-4 py-2 text-center text-slate-300">
                                      {detalle.cantidad}
                                    </td>
                                    <td className="px-4 py-2 text-center text-slate-300">
                                      {formatNumber(detalle.precio)} Gs.
                                    </td>
                                    <td className="px-4 py-2 text-right text-emerald-400 font-semibold">
                                      {formatNumber(detalle.subtotal)} Gs.
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal Selección Cliente */}
      {showPersonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-3xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl border border-slate-700/60">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-400" /> Seleccionar Cliente
              </h3>
              <button
                onClick={() => setShowPersonModal(false)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={personSearch}
                  onChange={(e) => setPersonSearch(e.target.value)}
                  placeholder="Buscar cliente…"
                  className={`${styles.input} w-full pl-11`}
                />
              </div>
              <div className="max-h-[50vh] overflow-y-auto divide-y divide-slate-700/50">
                {filteredPersons.length === 0 ? (
                  <p className="text-center text-slate-500 py-10">No se encontraron clientes</p>
                ) : (
                  filteredPersons.map((p) => (
                    <button
                      key={p.codigo}
                      onClick={() => handleSelectPerson(p)}
                      className="w-full text-left px-5 py-4 hover:bg-indigo-500/10 transition flex justify-between items-center group"
                    >
                      <span className="text-white font-medium group-hover:text-indigo-300">
                        {p.nombre}
                      </span>
                      <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition">
                        Seleccionar
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Catálogo */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl border border-slate-700/60">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/60">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" /> Seleccionar Producto
              </h3>
              <button
                onClick={closeItemModal}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={itemModalSearch}
                  onChange={(e) => setItemModalSearch(e.target.value)}
                  placeholder="Buscar producto o código…"
                  className={`${styles.input} w-full pl-11`}
                />
              </div>
              <div className="max-h-[50vh] overflow-y-auto divide-y divide-slate-700/50">
                {itemModalFiltered.length === 0 ? (
                  <p className="text-center text-slate-500 py-10">
                    No se encontraron productos
                  </p>
                ) : (
                  itemModalFiltered.map((item) => (
                    <button
                      key={item.codigo}
                      onClick={() => handleSelectModalItem(item)}
                      className="w-full text-left px-5 py-4 hover:bg-indigo-500/10 transition flex justify-between items-center group"
                    >
                      <span className="text-white font-medium group-hover:text-indigo-300">
                        {item.descripcion}
                      </span>
                      <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition">
                        Agregar
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PedidoVentaManager;
