'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardActions, 
  Grid, 
  CircularProgress, 
  Chip,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  AccessTime as AccessTimeIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import Link from 'next/link';
import ClientLayout from '@/components/ClientLayout';
import { LessonStatus, SpacedRepetitionInfo } from '@/types/lesson';
import { 
  fetchLessons, 
  getAllLessonsWithRepetitionInfo, 
  toggleLessonVisibility, 
  getActiveProfileId, 
  getBaseUrl 
} from '@/utils/clientUtils';
import { fetchProfileSettings } from '@/utils/clientProfileUtils';

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Array<{ id: string, title: string, description: string }>>([]);
  const [repetitionInfo, setRepetitionInfo] = useState<SpacedRepetitionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [showDueForReview, setShowDueForReview] = useState(true);
  
  // Загрузка уроков, информации о повторении и настроек профиля
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
        
        // Загружаем настройки профиля
        const activeProfileId = getActiveProfileId();
        if (activeProfileId) {
          const profileData = await fetchProfileSettings(activeProfileId);
          if (profileData && profileData.settings) {
            // Загружаем сохраненные состояния чекбоксов, если они есть
            if (profileData.settings.hideCompleted !== undefined) {
              setHideCompleted(profileData.settings.hideCompleted);
            }
            if (profileData.settings.showDueForReview !== undefined) {
              setShowDueForReview(profileData.settings.showDueForReview);
            }
          }
        }
      } catch (error) {
        console.error('Error loading lessons data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Сохранение состояния чекбоксов в профиль
  const saveCheckboxStates = async (hideCompletedValue: boolean, showDueForReviewValue: boolean) => {
    try {
      const activeProfileId = getActiveProfileId();
      if (activeProfileId) {
        const profileData = await fetchProfileSettings(activeProfileId);
        if (profileData && profileData.settings) {
          // Обновляем настройки профиля
          const updatedSettings = {
            ...profileData.settings,
            hideCompleted: hideCompletedValue,
            showDueForReview: showDueForReviewValue
          };
          
          // Сохраняем обновленные настройки
          await fetch(`${getBaseUrl()}/api/profiles/${activeProfileId}/settings`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedSettings)
          });
        }
      }
    } catch (error) {
      console.error('Error saving checkbox states:', error);
    }
  };
  
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
  
  // Проверяем, завершены ли все циклы повторения
  const isAllCyclesCompleted = (lessonId: string) => {
    const info = repetitionInfo.find(info => info.lessonId === lessonId);
    return info?.status === LessonStatus.CompletedAllCycles;
  };
  
  // Получаем дату следующего повторения
  const getNextReviewDate = (lessonId: string) => {
    const info = repetitionInfo.find(info => info.lessonId === lessonId);
    return info?.nextReviewDate || 0;
  };
  
  /**
   * Фильтруем уроки в соответствии с настройками
   * Правила фильтрации:
   * 1. Если "Show for repetition" включено, показываем только уроки, которые нужно повторить
   * 2. Если "Hide completed" включено, скрываем завершенные уроки, кроме тех, которые нужно повторить
   */
  const filteredLessons = lessons.filter(lesson => {
    const status = getLessonStatus(lesson.id);
    const isHidden = isLessonHidden(lesson.id);
    const isDueForReview = isLessonDueForReview(lesson.id);
    
    // Если "Show for repetition" включено, показываем только уроки для повторения
    if (showDueForReview) {
      // Если урок нужно повторить, показываем его
      if (isDueForReview) {
        return true;
      } else {
        // Если урок не нужно повторять и включен режим "Show for repetition", скрываем его
        return false;
      }
    }
    
    // Если "Hide completed" включено
    if (hideCompleted) {
      // Проверяем, завершены ли все циклы повторения
      const isCompleted = isAllCyclesCompleted(lesson.id);
      
      // Если все циклы завершены, всегда показываем урок
      
      if(status===LessonStatus.CompletedAllCycles){
        return false;
      }
      
      // Скрываем обычные завершенные уроки
      if (status === LessonStatus.Completed) {
        return true;
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
                onChange={(e) => {
                  const newValue = e.target.checked;
                  setHideCompleted(newValue);
                  saveCheckboxStates(newValue, showDueForReview);
                }}
                color="primary"
              />
            }
            label="Скрыть завершенные"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={showDueForReview}
                onChange={(e) => {
                  const newValue = e.target.checked;
                  setShowDueForReview(newValue);
                  saveCheckboxStates(hideCompleted, newValue);
                }}
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
            const isCompleted = isAllCyclesCompleted(lesson.id);
            const nextReviewDate = getNextReviewDate(lesson.id);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={lesson.id} >
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
                     // Анимированный градиентный фон для уроков, завершивших все циклы повторения
                     ...(isCompleted && {
                      background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
                    })
                  }}
                >
                  <CardContent sx={{ flexGrow: 1}}>
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
                    
                    <Typography variant="body2" color={isCompleted ? 'white' : 'text.secondary'}>
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
                    
                    {isCompleted && (
                      <Box sx={{ mt: 2 }}>
                        <Chip 
                          icon={<CheckCircleIcon />} 
                          label="Цикл повторений завершен" 
                          size="small" 
                          color="success" 
                          sx={{
                            background: 'rgba(181, 8, 229, 0.9)',
                            color: '#4CAF50',
                            fontWeight: 'bold',
                            
                          }}
                        />
                      </Box>
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    {isDueForReview ? (
                      <Link href={`/lessons/${lesson.id}`} passHref style={{ flexGrow: 1 }}>
                        <Button variant="contained" color="warning" fullWidth>
                          Повторить
                        </Button>
                      </Link>
                    ) : isCompleted ? (
                      <Link href={`/lessons/${lesson.id}`} passHref style={{ flexGrow: 1 }}>
                        <Button 
                          variant="contained" 
                          sx={{ 
                            bgcolor: 'rgba(255, 255, 255, 0.9)', 
                            color: '#4CAF50',
                            '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 0.7)'
                            },
                            
                          }} 
                          fullWidth
                        >
                          Повторить еще раз
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/lessons/${lesson.id}`} passHref style={{ flexGrow: 1 }}>
                        <Button variant="contained" color="primary" fullWidth>
                          Начать урок
                        </Button>
                      </Link>
                    )}
                    
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
