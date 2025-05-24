'use client';

import { useEffect, useState } from 'react';
import { Typography, Grid, Card, CardContent, CardActions, Button, Box, FormControlLabel, Switch, Chip, Tooltip, CircularProgress } from '@mui/material';
import ClientLayout from '@/components/ClientLayout';
import { fetchLessons, getAllLessonsWithRepetitionInfo, toggleLessonVisibility } from '@/utils/clientUtils';
import Link from 'next/link';
import { LessonStatus, SpacedRepetitionInfo } from '@/types/lesson';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Array<{ id: string, title: string, description: string }>>([]);
  const [repetitionInfo, setRepetitionInfo] = useState<SpacedRepetitionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [showDueForReview, setShowDueForReview] = useState(true);
  
  // Загрузка уроков и информации о повторении
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Загружаем список уроков
        const response = await fetchLessons();
        setLessons(response.lessons);
        
        // Загружаем информацию о повторении
        const repetitionData = await getAllLessonsWithRepetitionInfo();
        setRepetitionInfo(repetitionData);
      } catch (error) {
        console.error('Error loading lessons data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Функция для изменения видимости урока
  const handleToggleVisibility = async (lessonId: string, isHidden: boolean) => {
    try {
      console.log(`Изменение видимости урока ${lessonId} на ${isHidden ? 'скрытый' : 'видимый'}`);
      const success = await toggleLessonVisibility(lessonId, isHidden);
      if (success) {
        console.log('Успешно изменена видимость урока');
        // Обновляем локальное состояние
        setRepetitionInfo(prevInfo => 
          prevInfo.map(info => 
            info.lessonId === lessonId 
              ? { ...info, isHidden } 
              : info
          )
        );
        
        // Обновляем данные с сервера
        const repetitionData = await getAllLessonsWithRepetitionInfo();
        setRepetitionInfo(repetitionData);
      } else {
        console.error('Ошибка при изменении видимости урока');
      }
    } catch (error) {
      console.error('Error toggling lesson visibility:', error);
    }
  };
  
  // Получаем статус урока из информации о повторении
  const getLessonStatus = (lessonId: string) => {
    const info = repetitionInfo.find(info => info.lessonId === lessonId);
    return info?.status || LessonStatus.NotStarted;
  };
  
  // Проверяем, скрыт ли урок
  const isLessonHidden = (lessonId: string) => {
    const info = repetitionInfo.find(info => info.lessonId === lessonId);
    return info?.isHidden || false;
  };
  
  // Проверяем, нужно ли повторить урок
  const isLessonDueForReview = (lessonId: string) => {
    const info = repetitionInfo.find(info => info.lessonId === lessonId);
    return info?.status === LessonStatus.DueForReview;
  };
  
  // Получаем дату следующего повторения
  const getNextReviewDate = (lessonId: string) => {
    const info = repetitionInfo.find(info => info.lessonId === lessonId);
    return info?.nextReviewDate || 0;
  };
  
  /**
   * Фильтруем уроки в соответствии с настройками
   * Правила фильтрации:
   * 1. Если "Hide completed" включено, скрываем завершенные уроки, кроме тех, которые нужно повторить
   * 2. Если "Hide completed" выключено, показываем все уроки, включая скрытые
   */
  const filteredLessons = lessons.filter(lesson => {
    const status = getLessonStatus(lesson.id);
    const isHidden = isLessonHidden(lesson.id);
    const isDueForReview = isLessonDueForReview(lesson.id);
    
    // Если урок нужно повторить, всегда показываем его
    if (isDueForReview) {
      return true;
    }
    
    // Если "Hide completed" включено
    if (hideCompleted) {
      // Скрываем завершенные уроки
      if (status === LessonStatus.Completed) {
        return false;
      }
      
      // Скрываем скрытые уроки
      if (isHidden) {
        return false;
      }
    } else {
      // Если "Hide completed" выключено, показываем все уроки, включая скрытые
      return true;
    }
    
    return true;
  });
  
  return (
    <ClientLayout>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Уроки
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={hideCompleted}
                onChange={(e) => setHideCompleted(e.target.checked)}
                color="primary"
              />
            }
            label="Скрыть завершенные"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={showDueForReview}
                onChange={(e) => setShowDueForReview(e.target.checked)}
                color="primary"
              />
            }
            label="Показать для повторения"
          />
        </Box>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredLessons.map((lesson) => {
            const status = getLessonStatus(lesson.id);
            const isDueForReview = isLessonDueForReview(lesson.id);
            const nextReviewDate = getNextReviewDate(lesson.id);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={lesson.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
                    },
                    // Подсветка уроков для повторения
                    ...(isDueForReview && {
                      border: '2px solid #ff9800',
                      boxShadow: '0 0 8px rgba(255, 152, 0, 0.5)',
                    })
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {lesson.title}
                      </Typography>
                      
                      <Box>
                        {status === LessonStatus.Completed && (
                          <Tooltip title="Урок завершен">
                            <CheckCircleIcon color="success" />
                          </Tooltip>
                        )}
                        {isDueForReview && (
                          <Tooltip title="Пора повторить">
                            <RefreshIcon color="warning" sx={{ ml: 1 }} />
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary">
                      {lesson.description}
                    </Typography>
                    
                    {status === LessonStatus.Completed && nextReviewDate > 0 && !isDueForReview && (
                      <Box sx={{ mt: 2 }}>
                        <Chip 
                          icon={<AccessTimeIcon />} 
                          label={`Повторение: ${new Date(nextReviewDate).toLocaleDateString()}`} 
                          size="small" 
                          color="info" 
                          variant="outlined" 
                        />
                      </Box>
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Link href={`/lessons/${lesson.id}`} passHref style={{ flexGrow: 1 }}>
                      <Button variant="contained" color={isDueForReview ? "warning" : "primary"} fullWidth>
                        {isDueForReview ? "Повторить" : "Начать урок"}
                      </Button>
                    </Link>
                    
                    {status === LessonStatus.Completed && (
                      <Tooltip title={isLessonHidden(lesson.id) ? "Показать урок" : "Скрыть урок"}>
                        <Button 
                          variant="outlined" 
                          color="secondary" 
                          onClick={() => handleToggleVisibility(lesson.id, !isLessonHidden(lesson.id))}
                          sx={{ ml: 1 }}
                        >
                          {isLessonHidden(lesson.id) ? <VisibilityIcon /> : <VisibilityOffIcon />}
                        </Button>
                      </Tooltip>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
          
          {filteredLessons.length === 0 && (
            <Grid item xs={12}>
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  {hideCompleted ? "Все уроки завершены. Измените фильтры, чтобы увидеть завершенные уроки." : "Нет доступных уроков."}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}
    </ClientLayout>
  );
}
