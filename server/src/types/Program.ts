export interface Program {
  codigo: number;
  descripcion: string;
  ubicacion: string;
  formulario: string;
  tipoCodigo?: number | null;
  tipoDescripcion?: string | null;
}
