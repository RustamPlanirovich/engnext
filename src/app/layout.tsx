import { ReactNode } from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import ThemeRegistry from '@/components/ThemeRegistry';
import AppInitializer from '@/components/AppInitializer';
import './globals.css';

export const metadata = {
  title: 'English Learning App',
  description: 'Application for English language training',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <ThemeRegistry>
            <AppInitializer />
            {children}
          </ThemeRegistry>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
