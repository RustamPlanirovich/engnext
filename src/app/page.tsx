'use client';

import { Box, Typography, Card, CardContent, Grid, Button } from '@mui/material';
import { School as SchoolIcon, Refresh as RefreshIcon, Analytics as AnalyticsIcon } from '@mui/icons-material';
import Layout from '@/components/Layout';
import Link from 'next/link';

export default function Home() {
  return (
    <Layout>
      <Box sx={{ 
        textAlign: 'center', 
        my: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4
      }}>
        <Typography variant="h2" component="h1" gutterBottom>
          English Galaxy
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom sx={{ maxWidth: 600, mb: 4 }}>
          Приложение для тренировки английского языка
        </Typography>
        
        <Grid container spacing={4} justifyContent="center" maxWidth="lg">
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'translateY(-8px)',
              }
            }}>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
                <SchoolIcon sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
                <Typography variant="h5" component="h2" gutterBottom>
                  Уроки
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Выберите урок для изучения и тренировки английского языка
                </Typography>
                <Link href="/lessons" passHref style={{ marginTop: 'auto' }}>
                  <Button variant="contained" color="primary" fullWidth>
                    Перейти к урокам
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'translateY(-8px)',
              }
            }}>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
                <RefreshIcon sx={{ fontSize: 60, mb: 2, color: 'secondary.main' }} />
                <Typography variant="h5" component="h2" gutterBottom>
                  Повторение
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Повторите сложные предложения для лучшего запоминания
                </Typography>
                <Link href="/practice" passHref style={{ marginTop: 'auto' }}>
                  <Button variant="contained" color="secondary" fullWidth>
                    Начать повторение
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'translateY(-8px)',
              }
            }}>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
                <AnalyticsIcon sx={{ fontSize: 60, mb: 2, color: 'info.main' }} />
                <Typography variant="h5" component="h2" gutterBottom>
                  Аналитика
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Просмотрите статистику вашего прогресса и ошибок
                </Typography>
                <Link href="/analytics" passHref style={{ marginTop: 'auto' }}>
                  <Button variant="contained" color="info" fullWidth>
                    Посмотреть аналитику
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
}
