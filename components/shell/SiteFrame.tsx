'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import AppShell, { type ShellData } from './AppShell';

const APP_ROUTES = ['/briefs', '/dashboard', '/admin'];

export function isAppRoute(pathname: string | null) {
  if (!pathname) return false;
  return APP_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'));
}

/** Marketing pages get the big Thought Collective header and footer; the product gets the sidebar app. */
export default function SiteFrame({
  shell,
  nav,
  footer,
  children,
}: {
  shell: ShellData;
  nav: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  if (isAppRoute(pathname)) return <AppShell data={shell}>{children}</AppShell>;
  return (
    <>
      {nav}
      {children}
      {footer}
    </>
  );
}
