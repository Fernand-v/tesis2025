import { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useCatalogStyles } from './catalog-ui';
import { CatalogTheme } from './catalog-ui';

type ConfirmTone = 'danger' | 'primary';

export interface ConfirmDialogProps {
  open: boolean;
  theme: CatalogTheme;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
  icon?: ReactNode;
  tone?: ConfirmTone;
}

const confirmToneStyles: Record<ConfirmTone, string> = {
  danger:
    'bg-rose-600/90 hover:bg-rose-600 text-white shadow-lg shadow-rose-900/30 disabled:opacity-60',
  primary:
    'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-900/30 disabled:opacity-60',
};

export const ConfirmDialog = ({
  open,
  theme,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onCancel,
  onConfirm,
  busy = false,
  icon,
  tone = 'danger',
}: ConfirmDialogProps) => {
  const styles = useCatalogStyles(theme);

  if (!open) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center ${styles.overlay} backdrop-blur-sm transition-opacity duration-200`}
      role="dialog"
      aria-modal="true"
    >
      <div className={`${styles.panel} max-w-sm w-full px-6 py-6 text-center`}>
        <div className="flex flex-col items-center gap-3">
          {icon ?? (
            <AlertTriangle
              className={tone === 'danger' ? 'h-10 w-10 text-rose-400' : 'h-10 w-10 text-indigo-400'}
            />
          )}
          <h3 className={`text-lg font-semibold ${styles.textPrimary}`}>{title}</h3>
          <div className={`text-sm ${styles.textSecondary}`}>{description}</div>
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${styles.pill}`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${confirmToneStyles[tone]}`}
          >
            {busy ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
