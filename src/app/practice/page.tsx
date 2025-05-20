'use client';

import { useState, useEffect } from 'react';
import { Typography, Box, Card, CardContent, Button, Divider, CircularProgress } from '@mui/material';
import ClientLayout from '@/components/ClientLayout';
import { getMostProblematicSentences, fetchLesson, getActiveProfileId } from '@/utils/clientUtils';
import Link from 'next/link';
import { AnalyticsItem } from '@/types/lesson';

// Предотвращаем кэширование страницы
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function PracticePage() {
  const [problematicSentences, setProblematicSentences] = useState<AnalyticsItem[]>([]);
  const [lessonTitles, setLessonTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Получаем ID активного профиля из localStorage
        const activeProfileId = getActiveProfileId();
        console.log('Active profile ID:', activeProfileId);
        
        // Получаем предложения с ошибками
        const sentences = await getMostProblematicSentences(10, activeProfileId || undefined);
        console.log('Problematic sentences:', sentences);
        setProblematicSentences(sentences);
        
        // Получаем названия уроков
        const titles: Record<string, string> = {};
        for (const item of sentences) {
          try {
            if (!titles[item.lessonId]) {
              const response = await fetchLesson(item.lessonId);
              if (response.lesson) {
                titles[item.lessonId] = response.lesson.concept;
              } else {
                titles[item.lessonId] = `Урок ${item.lessonId}`;
              }
            }
          } catch (error) {
            console.error(`Error fetching lesson ${item.lessonId}:`, error);
            titles[item.lessonId] = `Урок ${item.lessonId}`;
          }
        }
        setLessonTitles(titles);
      } catch (error) {
        console.error('Error fetching practice data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  return (
    <ClientLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Повторение сложных предложений
        </Typography>
        <Typography variant="body1" paragraph>
          Здесь собраны предложения, в которых вы допустили больше всего ошибок. Регулярное повторение поможет вам лучше их запомнить.
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Загрузка предложений...
          </Typography>
        </Box>
      ) : problematicSentences.length === 0 ? (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Нет предложений для повторения
            </Typography>
            <Typography variant="body1" paragraph>
              Вы еще не выполнили ни одного упражнения или не допустили ни одной ошибки. Попробуйте пройти несколько уроков.
            </Typography>
            <Link href="/lessons" passHref>
              <Button variant="contained" color="primary">
                Перейти к урокам
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Выберите режим повторения:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Link href="/practice/exercise/en-to-ru-typing" passHref>
                <Button variant="contained" color="primary">
                  Английский → Русский (ввод)
                </Button>
              </Link>
              <Link href="/practice/exercise/ru-to-en-typing" passHref>
                <Button variant="contained" color="secondary">
                  Русский → Английский (ввод)
                </Button>
              </Link>
              <Link href="/practice/exercise/en-to-ru-blocks" passHref>
                <Button variant="contained" color="info">
                  Английский → Русский (блоки)
                </Button>
              </Link>
              <Link href="/practice/exercise/ru-to-en-blocks" passHref>
                <Button variant="contained" color="success">
                  Русский → Английский (блоки)
                </Button>
              </Link>
            </Box>
          </Box>
          
          <Divider sx={{ my: 4 }} />
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Предложения для повторения ({problematicSentences.length}):
            </Typography>
            
            {problematicSentences.map((item, index) => {
              const lessonTitle = lessonTitles[item.lessonId] || `Урок ${item.lessonId}`;
              
              return (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Урок: {lessonTitle}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary">Английский:</Typography>
                        <Typography variant="body1">{item.sentence.english}</Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary">Русский:</Typography>
                        <Typography variant="body1">{item.sentence.russian}</Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                      Количество ошибок: {item.errors}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </>
      )}
    </ClientLayout>
  );
}
