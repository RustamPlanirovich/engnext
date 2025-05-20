// Type declarations for modules without TypeScript definitions

declare module '@mui/material-nextjs/v13-appRouter' {
  import { ReactNode } from 'react';
  
  export interface AppRouterCacheProviderProps {
    children: ReactNode;
  }
  
  export function AppRouterCacheProvider(props: AppRouterCacheProviderProps): JSX.Element;
}
