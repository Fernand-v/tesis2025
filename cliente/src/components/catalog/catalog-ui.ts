import { useMemo } from 'react';

export type CatalogTheme = 'light' | 'dark';

export interface CatalogStyles {
  isDark: boolean;
  panel: string;
  section: string;
  mutedSurface: string;
  input: string;
  heading: string;
  subheading: string;
  textPrimary: string;
  textSecondary: string;
  divider: string;
  overlay: string;
  toast: {
    success: string;
    error: string;
  };
  hoverLift: string;
  pill: string;
}

const fadeClasses = 'transition-all duration-200 ease-out';

export const useCatalogStyles = (theme: CatalogTheme): CatalogStyles =>
  useMemo(() => {
    const isDark = theme === 'dark';

    const palette = isDark
      ? {
          panel: 'rounded-3xl border border-slate-700/60 bg-slate-900/65 shadow-xl shadow-slate-900/40 backdrop-blur-sm',
          section: 'rounded-2xl border border-slate-700/60 bg-slate-950/45',
          mutedSurface: 'border border-slate-800/60 bg-slate-900/50',
          input:
            'rounded-xl border border-slate-700/60 bg-slate-950/50 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40',
          heading: 'text-slate-100',
          subheading: 'text-slate-400',
          textPrimary: 'text-slate-100',
          textSecondary: 'text-slate-400',
          divider: 'divide-slate-800/60',
          overlay: 'bg-black/60',
          toastSuccess: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
          toastError: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
          pill: 'border border-slate-700/60 bg-slate-950/40 text-slate-200',
        }
      : {
          panel: 'rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-300/30 backdrop-blur-sm',
          section: 'rounded-2xl border border-slate-200 bg-slate-50/60',
          mutedSurface: 'border border-slate-200 bg-white/70',
          input:
            'rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30',
          heading: 'text-slate-900',
          subheading: 'text-slate-600',
          textPrimary: 'text-slate-900',
          textSecondary: 'text-slate-600',
          divider: 'divide-slate-200/70',
          overlay: 'bg-slate-900/50',
          toastSuccess: 'border-emerald-600/30 bg-emerald-100 text-emerald-900',
          toastError: 'border-rose-600/30 bg-rose-100 text-rose-900',
          pill: 'border border-slate-200 bg-white text-slate-700',
        };

    return {
      isDark,
      panel: `${palette.panel} ${fadeClasses}`,
      section: `${palette.section} ${fadeClasses}`,
      mutedSurface: `${palette.mutedSurface} ${fadeClasses}`,
      input: `${palette.input} ${fadeClasses}`,
      heading: palette.heading,
      subheading: palette.subheading,
      textPrimary: palette.textPrimary,
      textSecondary: palette.textSecondary,
      divider: palette.divider,
      overlay: palette.overlay,
      toast: {
        success: `rounded-lg border px-4 py-3 text-sm shadow ${palette.toastSuccess}`,
        error: `rounded-lg border px-4 py-3 text-sm shadow ${palette.toastError}`,
      },
      hoverLift: 'transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:shadow-lg',
      pill: `${palette.pill} rounded-full px-3 py-1 text-xs font-medium ${fadeClasses}`,
    };
  }, [theme]);

