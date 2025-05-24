'use client';

import { useState, useEffect } from 'react';
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
import { getSentencesDueForReview, getLessonsDueForReview } from '@/utils/clientUtils';
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
  
  // Загрузка предложений для повторения
  useEffect(() => {
    const loadSentences = async () => {
      try {
        setLoading(true);
        
        // Получаем уроки, которые нужно повторить
        const dueForReviewLessons = await getLessonsDueForReview();
        setLessonsDueCount(dueForReviewLessons.length);
        
        // Получаем предложения для повторения
        const sentencesDueForReview = await getSentencesDueForReview();
        
        // Сортируем по приоритету
        sentencesDueForReview.sort((a, b) => b.priority - a.priority);
        
        setSentences(sentencesDueForReview);
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
  };
  
  // Переход к следующему предложению
  const nextSentence = () => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserInput('');
      setShowAnswer(false);
      setIsCorrect(null);
    } else {
      // Все предложения пройдены
      setCurrentIndex(0);
      setUserInput('');
      setShowAnswer(false);
      setIsCorrect(null);
      alert('Вы повторили все предложения на сегодня!');
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
