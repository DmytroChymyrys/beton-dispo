'use client';

import { useEffect } from 'react';
import { captureAttribution } from '@/lib/attribution';

/**
 * Records first-touch attribution once per session. Mounted in the localized
 * layout so it runs on whichever page the visitor happens to land on, not only
 * the home page. Renders nothing.
 */
export function AttributionTracker() {
  useEffect(() => {
    captureAttribution();
  }, []);

  return null;
}
