'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  TextField, 
  CircularProgress,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import ClientLayout from '@/components/ClientLayout';
import { getSentencesDueForReview, getLessonsDueForReview, completeReviewLesson } from '@/utils/clientUtils';
import { PrioritySentence } from '@/types/lesson';

/**
 * Страница для повторения предложений по кривой забывания Эббингауза
 */
export default function ReviewPage() {
  const [sentences, setSentences] = useState<PrioritySentence[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [lessonsDueCount, setLessonsDueCount] = useState(0);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [completingReview, setCompletingReview] = useState(false);
  const [reviewCompleted, setReviewCompleted] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');
  const router = useRouter();
  
  // Загрузка предложений для повторения
  useEffect(() => {
    const loadSentences = async () => {
      try {
        setLoading(true);
        console.log(`Страница повторения: Запрашиваем предложения для урока ${currentLessonId || 'все уроки'}`);
        
        // Получаем параметр lessonId из URL, если он есть
        const searchParams = new URLSearchParams(window.location.search);
        const lessonIdFromUrl = searchParams.get('lessonId');
        
        // Если есть lessonId в URL, используем его
        if (lessonIdFromUrl) {
          setCurrentLessonId(lessonIdFromUrl);
          
          // Получаем предложения только для этого урока
          const sentencesDueForReview = await getSentencesDueForReview(undefined, lessonIdFromUrl);
          console.log(`Получено ${sentencesDueForReview.length} предложений для повторения:`, sentencesDueForReview);
          
          // Сортируем по приоритету
          sentencesDueForReview.sort((a, b) => b.priority - a.priority);
          
          setSentences(sentencesDueForReview);
        } else {
          // Если нет lessonId в URL, получаем все уроки для повторения
          const dueForReviewLessons = await getLessonsDueForReview();
          setLessonsDueCount(dueForReviewLessons.length);
          
          if (dueForReviewLessons.length === 0) {
            // Нет уроков для повторения
            setSentences([]);
            setLoading(false);
            return;
          }
          
          // Берем первый урок для повторения
          const lessonToReview = dueForReviewLessons[0];
          setCurrentLessonId(lessonToReview.lessonId);
          
          // Получаем предложения только для этого урока
          const sentencesDueForReview = await getSentencesDueForReview(undefined, lessonToReview.lessonId);
          
          // Сортируем по приоритету
          sentencesDueForReview.sort((a, b) => b.priority - a.priority);
          
          setSentences(sentencesDueForReview);
        }
      } catch (error) {
        console.error('Error loading sentences for review:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSentences();
  }, []);
  
  // Текущее предложение
  const currentSentence = sentences[currentIndex];
  
  // Проверка ответа пользователя
  const checkAnswer = () => {
    if (!currentSentence) return;
    
    // Нормализация ответа и эталона для сравнения
    const normalizedInput = userInput.trim().toLowerCase().replace(/[.,!?;:]/g, '');
    const normalizedAnswer = currentSentence.english.trim().toLowerCase().replace(/[.,!?;:]/g, '');
    
    // Проверка ответа
    const correct = normalizedInput === normalizedAnswer;
    setIsCorrect(correct);
    setShowAnswer(true);
    
    // Увеличиваем счетчик ошибок, если ответ неверный
    if (!correct) {
      setErrorCount(prev => prev + 1);
    }
  };
  
  // Завершение повторения урока
  const completeReview = async () => {
    if (!currentLessonId) return;
    
    try {
      setCompletingReview(true);
      
      // Получаем ID активного профиля из localStorage
      const profileId = localStorage.getItem('activeProfileId');
      
      if (!profileId) {
        alert('Не найден активный профиль');
        setCompletingReview(false);
        return;
      }
      
      console.log(`Завершаем повторение урока ${currentLessonId} для профиля ${profileId}, ошибок: ${errorCount}`);
      
      // Вызываем API для завершения повторения урока
      const result = await completeReviewLesson(currentLessonId, errorCount, profileId);
      
      if (result.success) {
        console.log(`Успешно завершено повторение урока: ${result.message}`);
        setReviewCompleted(true);
        setCompletionMessage(result.message);
      } else {
        console.error(`Ошибка при завершении повторения:`, result);
        alert(`Ошибка: ${result.message}`);
      }
    } catch (error) {
      console.error('Error completing lesson review:', error);
      alert('Произошла ошибка при завершении повторения урока');
    } finally {
      setCompletingReview(false);
    }
  };
  
  // Переход к следующему предложению
  const nextSentence = () => {
    if (currentIndex < sentences.length - 1) {
      // Переход к следующему предложению
      setCurrentIndex(currentIndex + 1);
      setUserInput('');
      setShowAnswer(false);
      setIsCorrect(null);
    } else {
      // Все предложения пройдены
      // Показываем подтверждение завершения повторения
      if (confirm('Вы повторили все предложения. Завершить повторение урока?')) {
        // Завершаем повторение урока
        completeReview();
      } else {
        // Возвращаемся к началу
        setCurrentIndex(0);
        setUserInput('');
        setShowAnswer(false);
        setIsCorrect(null);
      }
    }
  };
  
  return (
    <ClientLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Интервальное повторение
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Повторение по кривой забывания Эббингауза помогает закрепить материал в долговременной памяти.
          Здесь собраны наиболее важные предложения из уроков, которые нужно повторить сегодня.
        </Typography>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : completingReview ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Завершение повторения урока...
          </Typography>
        </Box>
      ) : reviewCompleted ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            {completionMessage}
          </Alert>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => router.push('/lessons')}
            sx={{ mt: 2 }}
          >
            Вернуться к урокам
          </Button>
        </Box>
      ) : sentences.length === 0 ? (
        <Box sx={{ p: 4 }}>
          <Alert severity="info">
            На сегодня нет предложений для повторения. 
            {lessonsDueCount > 0 ? (
              <span> Но у вас есть {lessonsDueCount} {lessonsDueCount === 1 ? 'урок' : 
                lessonsDueCount < 5 ? 'урока' : 'уроков'} для повторения. Перейдите на страницу уроков.</span>
            ) : (
              <span> Возвращайтесь позже.</span>
            )}
          </Alert>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => router.push('/lessons')}
            sx={{ mt: 2 }}
          >
            Перейти к урокам
          </Button>
        </Box>
      ) : (
        <Box sx={{ mt: 4 }}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Предложение {currentIndex + 1} из {sentences.length}
                </Typography>
                <Chip 
                  label={`Приоритет: ${currentSentence.priority}`} 
                  color={currentSentence.priority > 5 ? "warning" : "primary"} 
                  size="small" 
                />
              </Box>
              
              <Typography variant="h6" gutterBottom>
                {currentSentence.russian}
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  label="Введите перевод на английский"
                  variant="outlined"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  disabled={showAnswer}
                  error={isCorrect === false}
                  helperText={isCorrect === false ? "Неверно, попробуйте еще раз" : ""}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !showAnswer) {
                      checkAnswer();
                    }
                  }}
                />
              </Box>
              
              {!showAnswer ? (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    onClick={() => setShowAnswer(true)}
                  >
                    Показать ответ
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={checkAnswer}
                  >
                    Проверить
                  </Button>
                </Box>
              ) : (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 'bold', 
                      color: isCorrect ? 'success.main' : 'error.main' 
                    }}
                  >
                    Правильный ответ: {currentSentence.english}
                  </Typography>
                  
                  {currentSentence.source && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Источник: {currentSentence.source}
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={nextSentence}
                    >
                      Следующее предложение
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
          
          <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              О методе интервального повторения
            </Typography>
            <Typography variant="body2" paragraph>
              Кривая забывания Эббингауза показывает, что без повторов уже в первые 20–60 минут после изучения 
              память теряет значительную часть информации. Интервальное повторение с нарастающими интервалами 
              укрепляет материал в долговременной памяти.
            </Typography>
            <Typography variant="body2">
              Система автоматически выбирает 20% наиболее важных предложений из каждого урока, 
              учитывая их частотность, ключевые конструкции и ваши ошибки при изучении.
            </Typography>
          </Box>
        </Box>
      )}
    </ClientLayout>
  );
}
