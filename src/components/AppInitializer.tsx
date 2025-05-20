'use client';

import { useEffect, useState } from 'react';
import { CircularProgress, Box, Typography, Alert } from '@mui/material';

export default function AppInitializer() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const response = await fetch('/api/init');
        if (!response.ok) {
          throw new Error('Failed to initialize application');
        }
        
        // Successfully initialized
        setIsInitializing(false);
      } catch (error) {
        console.error('Initialization error:', error);
        setError('Не удалось инициализировать приложение. Пожалуйста, обновите страницу.');
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  if (isInitializing) {
    return (
      <Box 
        sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          bgcolor: 'background.default'
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Инициализация приложения...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          bgcolor: 'background.default',
          p: 3
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  // Return null when initialization is complete
  return null;
}
