'use client';

import { createContext, useContext } from 'react';

interface DashboardUser {
  id: number;
  username: string;
  nombre: string;
  apellido: string;
  rol?: number | null;
}

interface DashboardProgram {
  codigo: number;
  descripcion: string;
  ubicacion: string;
  formulario: string;
  tipoCodigo?: number | null;
  tipoDescripcion?: string | null;
}

export interface DashboardContextValue {
  user: DashboardUser | null;
  programs: DashboardProgram[];
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  logout: () => void;
  pageTitle: string;
  setPageTitle: (title: string) => void;
}

export const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

export const useDashboard = (): DashboardContextValue => {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error('useDashboard debe utilizarse dentro de DashboardContext.Provider');
  }

  return context;
};
