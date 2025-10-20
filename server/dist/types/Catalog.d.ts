import { Program } from './Program';
export interface Role {
    codigo: number;
    descripcion: string;
}
export interface RoleDetail {
    role: Role;
    assignedPrograms: Program[];
    availablePrograms: Program[];
}
export interface DocType {
    codigo: number;
    descripcion: string;
}
export interface CurrencyType {
    codigo: number;
    denominacion: string;
    tasa: number;
    simbolo: string;
}
export interface Estado {
    codigo: number;
    descripcion: string;
}
export interface Timbrado {
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
export interface PaymentMethod {
    codigo: number;
    descripcion: string;
}
export interface Falla {
    codigo: number;
    descripcion: string;
}
export interface PersonType {
    codigo: number;
    descripcion: string;
}
export interface ProgramType {
    codigo: number;
    descripcion: string;
}
export interface ProgramCatalog {
    codigo: number;
    descripcion: string;
    ubicacion: string;
    formulario: string;
    habilitado: number;
    tipoCodigo: number;
    tipoDescripcion: string;
}
export interface ProgramCatalogInput {
    descripcion: string;
    ubicacion: string;
    formulario: string;
    habilitado: number;
    tipoCodigo: number;
}
export interface Person {
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
    fechaGrabacion: string | null;
}
export interface PersonDetail {
    persona: Person;
    assignedTypes: PersonType[];
    availableTypes: PersonType[];
}
export interface PersonInput {
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
    observacion: string | null;
    estadoCivil: string;
    fechaNacimiento: string;
    tipoDocumentoCodigo: number;
}
export interface Empresa {
    codigo: number;
    razonSocial: string;
    ruc: string;
    telefono: string | null;
    celular: string;
    direccion: string;
    logo: string | null;
}
export interface Motivo {
    codigo: number;
    descripcion: string;
}
export interface Caja {
    codigo: number;
    descripcion: string;
}
export interface CajaUsuario {
    cajaCodigo: number;
    usuarioCodigo: number;
    cajaDescripcion: string;
    usuarioUsername: string;
    usuarioNombre: string;
    usuarioApellido: string;
}
export interface UsuarioBasico {
    codigo: number;
    username: string;
    nombre: string;
    apellido: string;
    estado: number;
}
export interface Dispositivo {
    codigo: number;
    descripcion: string;
    modeloCodigo: number;
    modeloDescripcion: string;
    marcaCodigo: number;
    marcaDescripcion: string;
    ram: number;
    rom: number;
}
export interface Modelo {
    codigo: number;
    descripcion: string;
}
export interface Marca {
    codigo: number;
    descripcion: string;
}
export interface Grupo {
    codigo: number;
    descripcion: string;
}
export interface CategoriaIva {
    codigo: number;
    descripcion: string;
    tasa: number;
}
export interface ItemInput {
    descripcion: string;
    codigoBarra: string | null;
    activo: string;
    afectaStock: string;
    marcaCodigo: number;
    grupoCodigo: number;
    categoriaCodigo: number;
    porcGanancia: number;
    indDescuento: string;
}
export interface Item extends ItemInput {
    codigo: number;
    marcaDescripcion: string;
    grupoDescripcion: string;
    categoriaDescripcion: string;
    categoriaTasa: number;
}
export interface AperturaCaja {
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
export interface AperturaDetalle {
    monedaCodigo: number;
    denominacion: string;
    tasa: number;
    cantidad: number;
    monto: number;
}
export interface AperturaDetalleInput {
    monedaCodigo: number;
    cantidad: number;
}
export interface ArqueoDetalle {
    codigo: number;
    aperturaCodigo: number;
    fecha: string;
    descripcion: string | null;
    tipo: string;
    monedaCodigo: number | null;
    monedaDenominacion: string | null;
    monedaSimbolo: string | null;
    tasa: number | null;
    cantidad: number | null;
    monto: number;
}
export interface ArqueoDetalleInput {
    monedaCodigo: number;
    cantidad: number;
}
export interface ArqueoCaja {
    codigo: number;
    aperturaCodigo: number;
    fecha: string;
    estado: number;
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
    total: number;
    motivo: string | null;
    detalles: ArqueoDetalle[];
}
export interface CierreDetalle {
    aperturaCodigo: number;
    monedaCodigo: number;
    denominacion: string | null;
    simbolo: string | null;
    tasa: number | null;
    cantidad: number;
    monto: number;
}
export interface CierreDetalleInput {
    monedaCodigo: number;
    cantidad: number;
}
export interface CierreCaja {
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
    detalles: CierreDetalle[];
}
export interface AperturaCajaInput {
    cajaCodigo: number;
    estadoCodigo: number;
    detalles: AperturaDetalleInput[];
}
export interface PedidoVentaDetalleInput {
    itemCodigo: number;
    cantidad: number;
    precio: number;
}
export interface PedidoVentaDetalle extends PedidoVentaDetalleInput {
    codigo: number;
    descripcion: string;
    subtotal: number;
}
export interface PedidoVentaInput {
    fechaPedido: string;
    fechaEntrega: string | null;
    observacion: string | null;
    personaCodigo: number;
    adelanto: number;
    items: PedidoVentaDetalleInput[];
}
export interface PedidoVenta {
    codigo: number;
    fechaPedido: string;
    fechaEntrega: string | null;
    observacion: string | null;
    adelanto: number;
    fechaGrabacion: string;
    personaCodigo: number;
    personaNombre: string;
    aperturaCodigo: number;
    usuarioGrabacion: number;
    estado: number;
    estadoDescripcion: string | null;
    items: PedidoVentaDetalle[];
    total: number;
}
//# sourceMappingURL=Catalog.d.ts.map