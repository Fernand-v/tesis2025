import { useCallback, useEffect, useState } from 'react';

export type FeedbackKind = 'success' | 'error';

export interface FeedbackState {
  kind: FeedbackKind;
  text: string;
}

export const useFeedbackFlash = (duration = 3200) => {
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const clearFeedback = useCallback(() => setFeedback(null), []);

  const showFeedback = useCallback(
    (text: string, kind: FeedbackKind = 'success') => {
      setFeedback({ kind, text });
    },
    [],
  );

  useEffect(() => {
    if (!feedback) return;

    const timer = window.setTimeout(() => {
      setFeedback(null);
    }, duration);

    return () => window.clearTimeout(timer);
  }, [feedback, duration]);

  return {
    feedback,
    showFeedback,
    clearFeedback,
  };
};

