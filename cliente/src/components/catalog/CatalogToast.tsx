import { X } from 'lucide-react';
import { useCatalogStyles, CatalogTheme } from './catalog-ui';
import { FeedbackState } from '@/hooks/useFeedbackFlash';

export interface CatalogToastProps {
  feedback: FeedbackState | null;
  theme: CatalogTheme;
  onClose?: () => void;
}

export const CatalogToast = ({ feedback, theme, onClose }: CatalogToastProps) => {
  const styles = useCatalogStyles(theme);

  if (!feedback) {
    return null;
  }

  const toastClass = feedback.kind === 'success' ? styles.toast.success : styles.toast.error;

  return (
    <div className="fixed right-6 top-6 z-[70] max-w-sm">
      <div className={`${toastClass} flex items-start gap-3`}>
        <span className="flex-1 leading-snug">{feedback.text}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar mensaje"
            className="rounded-full p-1 text-xs opacity-70 transition hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default CatalogToast;
