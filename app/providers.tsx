'use client';

import { ThemeProvider } from 'next-themes';
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <AudioPlayerProvider>
        {children}
      </AudioPlayerProvider>
    </ThemeProvider>
  );
}
