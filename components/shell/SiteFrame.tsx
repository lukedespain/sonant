'use client';

import type { ReactNode } from 'react';
import AppShell, { type ShellData } from './AppShell';

/** Every page sits in the composer portal: sidebar on the left, the page on the right. */
export default function SiteFrame({ shell, children }: { shell: ShellData; children: ReactNode }) {
  return <AppShell data={shell}>{children}</AppShell>;
}
