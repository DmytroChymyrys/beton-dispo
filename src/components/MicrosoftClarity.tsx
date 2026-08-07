'use client';

import { useEffect } from 'react';

type Props = {
  projectId?: string;
};

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

function scheduleAfterCriticalWork(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const idleWindow = window as IdleWindow;
  let cancelled = false;

  const run = () => {
    if (!cancelled) callback();
  };

  if (idleWindow.requestIdleCallback) {
    const idleId = idleWindow.requestIdleCallback(run, { timeout: 2500 });
    return () => {
      cancelled = true;
      idleWindow.cancelIdleCallback?.(idleId);
    };
  }

  const timeoutId = window.setTimeout(run, 1500);
  return () => {
    cancelled = true;
    window.clearTimeout(timeoutId);
  };
}

export function MicrosoftClarity({ projectId }: Props) {
  useEffect(() => {
    if (!projectId) return;

    return scheduleAfterCriticalWork(() => {
      void import('@microsoft/clarity')
        .then(({ default: Clarity }) => {
          Clarity.init(projectId);
        })
        .catch(() => {
          // Clarity must never affect the user experience.
        });
    });
  }, [projectId]);

  return null;
}
