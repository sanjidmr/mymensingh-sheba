'use client';

import { createContext, useContext } from 'react';

export const AppShellContentContext = createContext(false);

export function useIsAppShellContent(): boolean {
  return useContext(AppShellContentContext);
}
