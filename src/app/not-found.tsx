'use client';

import { Box, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        p: 3,
        background: 'linear-gradient(135deg, #121212 0%, #2d1b4e 100%)'
      }}
    >
      <Typography variant="h1" sx={{ mb: 2, fontSize: { xs: '3rem', md: '4rem' } }}>
        404
      </Typography>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Страница не найдена
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, maxWidth: 500 }}>
        Запрашиваемая страница не существует или была перемещена.
      </Typography>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={() => router.push('/')}
        sx={{ 
          py: 1.5, 
          px: 4,
          background: 'linear-gradient(45deg, #9c27b0 30%, #673ab7 90%)',
        }}
      >
        Вернуться на главную
      </Button>
    </Box>
  );
}
