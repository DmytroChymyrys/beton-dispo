'use client';

import { useEffect } from 'react';
import Clarity from '@microsoft/clarity';

type Props = {
  projectId?: string;
};

export function MicrosoftClarity({ projectId }: Props) {
  useEffect(() => {
    if (!projectId) return;

    Clarity.init(projectId);
  }, [projectId]);

  return null;
}
