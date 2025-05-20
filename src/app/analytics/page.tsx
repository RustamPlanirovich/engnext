'use client';

import { 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Grid, 
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  LinearProgress,
  Chip,
  CircularProgress
} from '@mui/material';
import { useState, useEffect } from 'react';
import ClientLayout from '@/components/ClientLayout';
import { fetchAnalytics, fetchLessons, fetchLesson } from '@/utils/clientUtils';
import { Analytics } from '@/types/lesson';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics>({
    errors: [],
    completedLessons: [],
    loadedLessons: [],
    totalExercisesCompleted: 0,
    lastPracticeDate: 0
  });
  const [lessons, setLessons] = useState<{id: string, title: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorsByLesson, setErrorsByLesson] = useState<Record<string, { count: number, title: string }>>({});
  const [lessonIds, setLessonIds] = useState<string[]>([]);
  const [completionRate, setCompletionRate] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [topProblematicSentences, setTopProblematicSentences] = useState<any[]>([]);
  const [sortedLessonErrors, setSortedLessonErrors] = useState<[string, { count: number, title: string }][]>([]);
  const [lastPracticeDate, setLastPracticeDate] = useState<string>('');
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Загрузка аналитики и уроков
        const analyticsData = await fetchAnalytics();
        const lessonsData = await fetchLessons();
        
        setAnalytics(analyticsData.analytics);
        setLessons(lessonsData.lessons);
        
        // Получение ID уроков
        const ids = lessonsData.lessons.map(lesson => lesson.id);
        
        // Добавление lesson1.json из корня, если он существует
        if (!ids.includes('lesson1')) {
          ids.unshift('lesson1');
        }
        
        setLessonIds(ids);
        
        // Расчет статистики
        const total = ids.length;
        const completed = analyticsData.analytics.completedLessons.length;
        const completion = total > 0 ? (completed / total) * 100 : 0;
        
        setTotalLessons(total);
        setCompletedLessons(completed);
        setCompletionRate(completion);
        
        // Предварительная загрузка заголовков уроков
        const titles: Record<string, string> = {};
        for (const lesson of lessonsData.lessons) {
          titles[lesson.id] = lesson.title;
        }
        
        // Обработка ошибок
        const errors: Record<string, { count: number, title: string }> = {};
        for (const error of analyticsData.analytics.errors) {
          if (!errors[error.lessonId]) {
            errors[error.lessonId] = {
              count: 0,
              title: titles[error.lessonId] || `Урок ${error.lessonId}`
            };
          }
          errors[error.lessonId].count += error.errors;
        }
        setErrorsByLesson(errors);
        
        // Сортировка уроков по количеству ошибок
        const sorted = Object.entries(errors)
          .sort(([, a], [, b]) => b.count - a.count);
        setSortedLessonErrors(sorted);
        
        // Получение самых проблемных предложений
        const topSentences = [...analyticsData.analytics.errors]
          .sort((a, b) => b.errors - a.errors)
          .slice(0, 5);
        setTopProblematicSentences(topSentences);
        
        // Форматирование даты
        const lastDate = analyticsData.analytics.lastPracticeDate;
        if (lastDate) {
          const date = new Date(lastDate);
          setLastPracticeDate(date.toLocaleDateString('ru-RU'));
        } else {
          setLastPracticeDate('Нет данных');
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  if (loading) {
    return (
      <ClientLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </ClientLayout>
    );
  }
  
  return (
    <ClientLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Аналитика
        </Typography>
        
        <Grid container spacing={3}>
          {/* Общая статистика */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Общая статистика
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper' }}>
                      <Typography variant="body2" color="text.secondary">
                        Пройдено уроков
                      </Typography>
                      <Typography variant="h4">
                        {completedLessons} / {totalLessons}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper' }}>
                      <Typography variant="body2" color="text.secondary">
                        Выполнено упражнений
                      </Typography>
                      <Typography variant="h4">
                        {analytics.totalExercisesCompleted}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper' }}>
                      <Typography variant="body2" color="text.secondary">
                        Последняя тренировка
                      </Typography>
                      <Typography variant="h4">
                        {lastPracticeDate}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Прогресс по урокам
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={completionRate} 
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {completionRate.toFixed(1)}% завершено
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Проблемные уроки */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Уроки с наибольшим количеством ошибок
                </Typography>
                
                {sortedLessonErrors.length > 0 ? (
                  <List>
                    {sortedLessonErrors.slice(0, 5).map(([lessonId, data]) => (
                      <ListItem key={lessonId} divider>
                        <ListItemText 
                          primary={data.title} 
                          secondary={`Ошибок: ${data.count}`}
                        />
                        <Chip 
                          label={`${data.count} ошибок`} 
                          color={data.count > 10 ? "error" : data.count > 5 ? "warning" : "success"} 
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body1" sx={{ textAlign: 'center', py: 2 }}>
                    Нет данных об ошибках
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Проблемные предложения */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Самые сложные предложения
                </Typography>
                
                {topProblematicSentences.length > 0 ? (
                  <List>
                    {topProblematicSentences.map((item, index) => (
                      <ListItem key={index} divider>
                        <ListItemText 
                          primary={item.english} 
                          secondary={
                            <>
                              <Typography variant="body2" component="span">
                                {item.russian}
                              </Typography>
                              <br />
                              <Typography variant="body2" component="span" color="text.secondary">
                                Урок: {item.lessonId}
                              </Typography>
                            </>
                          }
                        />
                        <Chip 
                          label={`${item.errors} ошибок`} 
                          color="error" 
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body1" sx={{ textAlign: 'center', py: 2 }}>
                    Нет данных о сложных предложениях
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Пройденные уроки */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Пройденные уроки
                </Typography>
                
                {analytics.completedLessons.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {analytics.completedLessons.map((lessonId) => (
                      <Chip 
                        key={lessonId}
                        label={lessonId} 
                        color="primary" 
                        variant="outlined"
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body1" sx={{ textAlign: 'center', py: 2 }}>
                    Нет пройденных уроков
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </ClientLayout>
  );
}
