'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardActions, 
  Grid, 
  CircularProgress, 
  Button,
  Chip,
  Divider,
  FormControlLabel,
  Switch
} from '@mui/material';
import { 
  Chat as ChatIcon,
  School as SchoolIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import ClientLayout from '@/components/ClientLayout';
import { DialogSet, DialogDifficulty } from '@/types/dialog';
import { LessonLevel } from '@/types/lesson';

// Компонент с использованием useSearchParams, обернутый в Suspense
function DialogsContent() {
  const searchParams = useSearchParams();
  const [dialogSets, setDialogSets] = useState<DialogSet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  
  // Отладочная информация
  console.log('Current dialogSets state:', dialogSets);
  
  // Группировка диалогов по уровням CEFR
  const dialogsByLevel: { [key in LessonLevel]?: DialogSet[] } = {};
  
  // Добавляем уровень "Неизвестно" для диалогов без указанного уровня
  const unknownLevel = 'A0' as LessonLevel;
  dialogsByLevel[unknownLevel] = [];
  
  dialogSets.forEach(dialogSet => {
    console.log('Processing dialogSet:', dialogSet);
    
    if (dialogSet) {
      // Если у диалога нет уровня, добавляем его в "Неизвестно"
      if (!dialogSet.level) {
        console.log(`DialogSet ${dialogSet.lessonId} has no level, assigning to ${unknownLevel}`);
        dialogSet.level = unknownLevel;
      }
      
      if (!dialogsByLevel[dialogSet.level]) {
        dialogsByLevel[dialogSet.level] = [];
      }
      
      dialogsByLevel[dialogSet.level]?.push(dialogSet);
    } else {
      console.warn('Found undefined or null dialogSet in array');
    }
  });
  
  console.log('Grouped dialogSets by level:', dialogsByLevel);
  
  // Функция для загрузки диалогов
  const fetchDialogSets = async () => {
    try {
      setLoading(true);
      console.log('Fetching dialogs from API...');
      
      // Добавляем случайный параметр для предотвращения кэширования
      const cacheBuster = `t=${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      console.log('Using cache buster:', cacheBuster);
      
      // Используем опцию cache: 'no-store' для предотвращения кэширования
      const response = await fetch(`/api/dialogs?${cacheBuster}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Не удалось загрузить диалоги: ${response.status} ${response.statusText}`);
      }
      
      const text = await response.text();
      console.log('Raw API response:', text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        throw new Error('Некорректный ответ от сервера');
      }
      
      console.log('Parsed API response:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Не удалось загрузить диалоги');
      }
      
      if (Array.isArray(data.dialogSets)) {
        console.log(`Received ${data.dialogSets.length} dialog sets from API with timestamp ${data.timestamp}`);
        console.log('Dialog set IDs:', data.dialogSets.map((ds: DialogSet) => ds.lessonId));
        setDialogSets(data.dialogSets);
      } else {
        console.error('API returned dialogSets in unexpected format:', data.dialogSets);
        setDialogSets([]);
      }
    } catch (err) {
      console.error('Error fetching dialog sets:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };
  
  // Функция для обновления списка диалогов
  const handleRefresh = () => {
    fetchDialogSets();
  };
  
  // Загружаем диалоги при монтировании компонента или при изменении параметра refresh
  useEffect(() => {
    fetchDialogSets();
  }, [searchParams]);
  
  const renderContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={4}>
          <Card sx={{ bgcolor: 'error.light', mb: 2, width: '100%', maxWidth: 600 }}>
            <CardContent>
              <Typography variant="h6" color="error.dark" gutterBottom>Ошибка</Typography>
              <Typography color="error.dark">{error}</Typography>
            </CardContent>
          </Card>
        </Box>
      );
    }
    
    if (dialogSets.length === 0) {
      return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={4}>
          <Card sx={{ bgcolor: 'warning.light', mb: 2, width: '100%', maxWidth: 600 }}>
            <CardContent>
              <Typography color="warning.dark">Диалоги не найдены</Typography>
            </CardContent>
          </Card>
          <Button 
            component={Link} 
            href="/settings" 
            variant="contained" 
            color="primary"
            startIcon={<SchoolIcon />}
          >
            Загрузить диалоги в настройках
          </Button>
        </Box>
      );
    }
    
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            Диалоги
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Обновить
          </Button>
        </Box>
        <Divider sx={{ mb: 3 }} />
        
        {Object.entries(dialogsByLevel).length > 0 ? (
          Object.entries(dialogsByLevel).map(([level, sets]) => (
            <Box key={level} mb={5}>
              <Typography variant="h5" component="h2" gutterBottom>
                Уровень {level}
              </Typography>
              <Grid container spacing={3}>
                {sets && sets.length > 0 ? (
                  sets.map((dialogSet, index) => (
                    <Grid item xs={12} sm={6} md={4} key={dialogSet.lessonId || `dialog-${level}-${index}`}>
                      <Card 
                        sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 6
                          }
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" gutterBottom>
                            Диалоги к уроку {dialogSet.lessonId}
                          </Typography>
                          <Chip 
                            label={`Уровень: ${dialogSet.level}`} 
                            color="primary" 
                            size="small" 
                            sx={{ mb: 2 }}
                          />
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Количество диалогов:
                          </Typography>
                          <Box pl={2}>
                            {dialogSet.dialogues && Array.isArray(dialogSet.dialogues) ? (
                              dialogSet.dialogues.map((difficultyGroup) => (
                                <Box key={difficultyGroup.level} display="flex" justifyContent="space-between" mb={0.5}>
                                  <Typography variant="body2">
                                    {difficultyGroup.level === 'easy' ? 'Легкие' : 
                                     difficultyGroup.level === 'medium' ? 'Средние' : 
                                     'Сложные'}:
                                  </Typography>
                                  <Chip 
                                    label={difficultyGroup.dialogues?.length || 0} 
                                    size="small" 
                                    color={difficultyGroup.level === 'easy' ? 'success' : 
                                           difficultyGroup.level === 'medium' ? 'warning' : 
                                           'error'}
                                    variant="outlined"
                                  />
                                </Box>
                              ))
                            ) : (
                              <Typography variant="body2" color="error">
                                Ошибка структуры диалогов
                              </Typography>
                            )}
                          </Box>
                        </CardContent>
                        <CardActions>
                          <Button 
                            component={Link} 
                            href={`/dialogs/${dialogSet.lessonId}`} 
                            startIcon={<ChatIcon />}
                            fullWidth
                            variant="contained"
                            color="primary"
                          >
                            Открыть диалоги
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Typography variant="body1" color="text.secondary">
                      Нет диалогов для уровня {level}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          ))
        ) : (
          <Box textAlign="center" mt={4}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Нет доступных диалогов
            </Typography>
            <Button 
              component={Link} 
              href="/settings" 
              variant="contained" 
              color="primary"
              startIcon={<SchoolIcon />}
              sx={{ mt: 2 }}
            >
              Загрузить диалоги в настройках
            </Button>
          </Box>
        )}
      </Box>
    );
  };
  
  return renderContent();
}

// Основной компонент страницы с Suspense
export default function DialogsPage() {
  return (
    <ClientLayout>
      <Suspense fallback={
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      }>
        <DialogsContent />
      </Suspense>
    </ClientLayout>
  );
}
