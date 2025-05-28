'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { Typography, Box, Card, CardContent, CardActions, Button, Grid, CircularProgress, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Tooltip, Paper } from '@mui/material';
import ClientLayout from '@/components/ClientLayout';
import { fetchLesson, getLessonSpacedRepetitionInfo, markLessonCompleted, toggleLessonVisibility, completeReviewLesson, getAllLessonsWithRepetitionInfo, fetchLessons } from '@/utils/clientUtils';
import Link from 'next/link';
import { Lesson, LessonStatus, SpacedRepetitionInfo, LessonLevel } from '@/types/lesson';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import LockIcon from '@mui/icons-material/Lock';

interface LessonPageProps {
  params: {
    lessonId: string;
  };
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repetitionInfo, setRepetitionInfo] = useState<SpacedRepetitionInfo | null>(null);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'info' | 'warning'}>({ open: false, message: '', severity: 'info' });
  const [completeDialog, setCompleteDialog] = useState(false);
  const [isLevelLocked, setIsLevelLocked] = useState(false);
  const [completedLevels, setCompletedLevels] = useState<Set<string>>(new Set(['A0']));
  
  // Список всех уровней CEFR
  const levels = ['all', 'A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  
  // Функция для проверки, доступен ли уровень
  const isLevelAvailable = (level: string): boolean => {
    if (level === 'all' || level === 'A0') return true;
    
    // Получаем предыдущий уровень
    const levelIndex = levels.indexOf(level);
    if (levelIndex <= 1) return true; // A0 всегда доступен
    
    const previousLevel = levels[levelIndex - 1];
    return completedLevels.has(previousLevel);
  };
  
  // Функция для получения предыдущего уровня
  const getPreviousLevel = (level: string): string => {
    const levelIndex = levels.indexOf(level);
    if (levelIndex <= 1) return 'A0'; // Если это A0 или 'all', возвращаем A0
    return levels[levelIndex - 1];
  };
  
  // Загрузка урока и информации о повторении
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Загружаем урок
        const response = await fetchLesson(lessonId);
        if (!response.lesson) {
          setError('Урок не найден');
          return;
        }
        setLesson(response.lesson);
        
        // Загружаем информацию о повторении
        const info = await getLessonSpacedRepetitionInfo(lessonId);
        setRepetitionInfo(info);
        
        // Загружаем все уроки и информацию о повторении для проверки доступности уровня
        const lessonsResponse = await fetchLessons();
        const repetitionData = await getAllLessonsWithRepetitionInfo();
        
        // Вычисляем завершенные уровни на основе завершенных уроков
        const completedLessonsMap = new Map<string, number>();
        const totalLessonsMap = new Map<string, number>();
        
        // Считаем количество уроков на каждом уровне
        lessonsResponse.lessons.forEach((lesson: any) => {
          const level = lesson.level || 'A0';
          totalLessonsMap.set(level, (totalLessonsMap.get(level) || 0) + 1);
        });
        
        // Считаем завершенные уроки на каждом уровне
        repetitionData.forEach(info => {
          const lesson = lessonsResponse.lessons.find((l: any) => l.id === info.lessonId);
          if (lesson && (info.status === LessonStatus.Completed || info.status === LessonStatus.CompletedAllCycles)) {
            const level = lesson.level || 'A0';
            completedLessonsMap.set(level, (completedLessonsMap.get(level) || 0) + 1);
          }
        });
        
        // Определяем, какие уровни завершены (если все уроки уровня завершены)
        const newCompletedLevels = new Set<string>(['A0']); // A0 всегда доступен
        
        for (const level of levels) {
          if (level === 'all' || level === 'A0') continue;
          
          const totalLessons = totalLessonsMap.get(level) || 0;
          const completedLessons = completedLessonsMap.get(level) || 0;
          
          // Если все уроки уровня завершены и есть хотя бы один урок на этом уровне
          if (totalLessons > 0 && completedLessons === totalLessons) {
            newCompletedLevels.add(level);
          }
        }
        
        setCompletedLevels(newCompletedLevels);
        
        // Проверяем, доступен ли уровень текущего урока
        const currentLesson = lessonsResponse.lessons.find((l: any) => l.id === lessonId);
        if (currentLesson) {
          const lessonLevel = currentLesson.level || 'A0';
          const isAvailable = isLevelAvailable(lessonLevel);
          setIsLevelLocked(!isAvailable);
          
          if (!isAvailable) {
            setError(`Урок недоступен. Сначала необходимо завершить все уроки уровня ${getPreviousLevel(lessonLevel)}.`);
          }
        }
      } catch (error) {
        console.error(`Error fetching lesson ${lessonId}:`, error);
        setError('Ошибка при загрузке урока');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [lessonId]);
  
  // Обработка ошибок загрузки
  if (error) {
    return (
      <ClientLayout>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            textAlign: 'center', 
            maxWidth: 600, 
            mx: 'auto', 
            mt: 4,
            borderRadius: 2,
            ...(isLevelLocked && {
              borderLeft: '5px solid #f44336'
            })
          }}
        >
          {isLevelLocked ? (
            <>
              <LockIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h5" color="error" gutterBottom>
                Уровень заблокирован
              </Typography>
              <Typography variant="body1" paragraph>
                {error}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Для прогресса в изучении языка важно осваивать материал последовательно.
              </Typography>
            </>
          ) : (
            <Typography variant="h6" color="error">
              {error}
            </Typography>
          )}
          <Button 
            variant="contained" 
            color="primary" 
            component={Link} 
            href="/lessons"
            sx={{ mt: 2 }}
          >
            Вернуться к списку уроков
          </Button>
        </Paper>
      </ClientLayout>
    );
  }
  
  // Отметка урока как завершенного
  const handleMarkAsCompleted = async () => {
    try {
      await markLessonCompleted(lessonId);
      
      // Обновляем информацию о повторении
      const info = await getLessonSpacedRepetitionInfo(lessonId);
      setRepetitionInfo(info);
      
      setSnackbar({
        open: true,
        message: 'Урок отмечен как завершенный',
        severity: 'success'
      });
      
      // Показываем диалог с предложением скрыть урок
      setCompleteDialog(true);
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при отметке урока как завершенного',
        severity: 'error'
      });
    }
  };
  
  // Изменение видимости урока
  const handleToggleVisibility = async (isHidden: boolean) => {
    try {
      const success = await toggleLessonVisibility(lessonId, isHidden);
      if (success) {
        // Обновляем информацию о повторении
        const info = await getLessonSpacedRepetitionInfo(lessonId);
        setRepetitionInfo(info);
        
        setSnackbar({
          open: true,
          message: isHidden ? 'Урок скрыт из списка' : 'Урок снова отображается в списке',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error toggling lesson visibility:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при изменении видимости урока',
        severity: 'error'
      });
    }
  };
  
  // Завершение повторения урока
  const handleCompleteReview = async () => {
    try {
      // Вызываем API для завершения повторения урока
      const result = await completeReviewLesson(lessonId);
      
      if (result.success) {
        // Обновляем информацию о повторении
        const info = await getLessonSpacedRepetitionInfo(lessonId);
        setRepetitionInfo(info);
        
        setSnackbar({
          open: true,
          message: result.message || 'Повторение урока успешно завершено',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'Ошибка при завершении повторения урока',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error completing lesson review:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при завершении повторения урока',
        severity: 'error'
      });
    }
  };
  
  // Закрытие snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Закрытие диалога
  const handleCloseDialog = () => {
    setCompleteDialog(false);
  };
  
  // Скрытие урока и закрытие диалога
  const handleHideLesson = () => {
    handleToggleVisibility(true);
    setCompleteDialog(false);
  };
  
  if (loading || !lesson) {
    return (
      <ClientLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </ClientLayout>
    );
  }

  // Получаем статус урока из информации о повторении
  const lessonStatus = repetitionInfo?.status || LessonStatus.NotStarted;
  const isCompleted = lessonStatus === LessonStatus.Completed || lessonStatus === LessonStatus.DueForReview;
  const isDueForReview = lessonStatus === LessonStatus.DueForReview;
  const isHidden = repetitionInfo?.isHidden || false;

  const exerciseTypes = [
    {
      id: 'en-to-ru-typing',
      title: 'Английский → Русский (ввод)',
      description: 'Предложение показывается на английском - нужно вручную ввести на русском',
      color: 'primary',
    },
    {
      id: 'ru-to-en-typing',
      title: 'Русский → Английский (ввод)',
      description: 'Предложение показывается на русском - нужно вручную ввести на английском',
      color: 'secondary',
    },
    {
      id: 'en-to-ru-blocks',
      title: 'Английский → Русский (блоки)',
      description: 'Предложение показывается на английском - нужно из блоков с русскими словами составить предложение',
      color: 'info',
    },
    {
      id: 'ru-to-en-blocks',
      title: 'Русский → Английский (блоки)',
      description: 'Предложение показывается на русском - нужно из блоков с английскими словами составить предложение',
      color: 'success',
    },
  ];

  return (
    <ClientLayout>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="h1" gutterBottom>
          {lesson.concept}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isCompleted ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} aria-label="Урок завершен" />
              
              <Button 
                variant="outlined" 
                color="secondary"
                onClick={() => handleToggleVisibility(!isHidden)}
                startIcon={isHidden ? <VisibilityIcon /> : <VisibilityOffIcon />}
                aria-label={isHidden ? "Показать урок в списке" : "Скрыть урок из списка"}
              >
                {isHidden ? "Показать в списке" : "Скрыть из списка"}
              </Button>
            </Box>
          ) : (
            <Button 
              variant="contained" 
              color="success"
              onClick={handleMarkAsCompleted}
              startIcon={<CheckCircleIcon />}
            >
              Отметить как завершенный
            </Button>
          )}
        </Box>
      </Box>

      {isDueForReview && (
        <Box sx={{ mb: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <RefreshIcon color="warning" sx={{ mr: 1 }} />
            <Typography variant="body1">
              Пора повторить этот урок для лучшего запоминания материала!
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            color="warning"
            onClick={handleCompleteReview}
            fullWidth
          >
            Завершить повторение урока
          </Button>
        </Box>
      )}

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={3}>
          {exerciseTypes.map((type) => (
            <Grid item xs={12} sm={6} key={type.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {type.title}
                  </Typography>
                  <Typography variant="body2">
                    {type.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Link href={`/lessons/${lessonId}/exercise/${type.id}${isDueForReview ? '?isRepetition=true' : ''}`} passHref style={{ width: '100%' }}>
                    <Button 
                      variant="contained" 
                      color={type.color as any} 
                      fullWidth
                    >
                      {isDueForReview ? "Повторить упражнение" : "Начать упражнение"}
                    </Button>
                  </Link>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      
      {/* Уведомление */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* Вместо диалога используем обычный компонент для решения проблемы с доступностью */}
      {completeDialog && (
        <Box 
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
          }}
        >
          <Box 
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 1,
              boxShadow: 24,
              p: 4,
              maxWidth: 500,
              width: '100%',
            }}
          >
            <Typography variant="h6" component="h2" gutterBottom>
              Урок завершен!
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              Поздравляем с завершением урока! Хотите скрыть его из основного списка уроков?
              Вы всегда сможете найти его в разделе завершенных уроков или вернуть в основной список позже.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 1 }}>
              <Button onClick={handleCloseDialog} color="primary">
                Оставить в списке
              </Button>
              <Button onClick={handleHideLesson} color="secondary" variant="contained">
                Скрыть урок
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </ClientLayout>
  );
}
