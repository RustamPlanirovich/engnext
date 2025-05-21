'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  LinearProgress, 
  Chip,
  Stack,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Pagination
} from '@mui/material';
import { 
  Check as CheckIcon, 
  Close as CloseIcon,
  SkipNext as SkipIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { Example, ExerciseMode, AnalyticsItem } from '@/types/lesson';
import { 
  addError, 
  removeError,
  markLessonCompleted, 
  getActiveProfileId, 
  saveLessonProgress, 
  getLessonProgress,
  getMostProblematicSentences,
  getBaseUrl 
} from '@/utils/clientUtils';
import { fetchProfileSettings } from '@/utils/clientProfileUtils';

interface ExerciseComponentProps {
  lessonId: string;
  lessonTitle: string;
  examples: Example[];
  exerciseType: ExerciseMode;
}

export default function ExerciseComponent({ 
  lessonId, 
  lessonTitle, 
  examples: initialExamples, 
  exerciseType 
}: ExerciseComponentProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [blockWords, setBlockWords] = useState<string[]>([]);
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progressRestored, setProgressRestored] = useState(false);
  const [exercisesPerSession, setExercisesPerSession] = useState(10); // Количество упражнений в сессии
  const [currentPage, setCurrentPage] = useState(1); // Текущая страница (часть урока)
  const [totalPages, setTotalPages] = useState(1); // Общее количество страниц (частей урока)
  const [examples, setExamples] = useState<(Example & { errorId?: string })[]>([]);
  const [currentSessionExamples, setCurrentSessionExamples] = useState<(Example & { errorId?: string })[]>([]);
  const [currentExample, setCurrentExample] = useState<(Example & { errorId?: string }) | null>(null);
  const [currentErrorId, setCurrentErrorId] = useState<string | undefined>(undefined);

  // Реф для текстового поля
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Обновляем текущий пример при изменении индекса
  useEffect(() => {
    if (currentSessionExamples.length > 0 && currentIndex < currentSessionExamples.length) {
      const example = currentSessionExamples[currentIndex];
      setCurrentExample(example);
      // Если у примера есть ID ошибки (для режима практики), сохраняем его
      if ('errorId' in example && example.errorId) {
        console.log(`Setting current error ID: ${example.errorId} for sentence: "${example.english}"`);
        setCurrentErrorId(example.errorId as string);
      } else {
        console.log(`No error ID found for sentence: "${example.english}"`);
        setCurrentErrorId(undefined);
      }
    }
  }, [currentSessionExamples, currentIndex]);

  // Получаем текущий пример из текущей сессии
  const totalExamples = currentSessionExamples.length;
  const progress = totalExamples > 0 ? (currentIndex / totalExamples) * 100 : 0;
  
  // Общий прогресс по всему уроку
  const overallProgress = examples.length > 0 ? ((currentPage - 1) * exercisesPerSession + currentIndex) / examples.length * 100 : 0;
  
  const isTypingExercise = exerciseType === 'en-to-ru-typing' || exerciseType === 'ru-to-en-typing';
  const isBlocksExercise = exerciseType === 'en-to-ru-blocks' || exerciseType === 'ru-to-en-blocks';
  const isEnglishPrompt = exerciseType === 'en-to-ru-typing' || exerciseType === 'en-to-ru-blocks';
  
  // Get prompt and expected answer based on exercise type - с проверкой на существование currentExample
  const prompt = currentExample ? (isEnglishPrompt ? currentExample.english : currentExample.russian) : '';
  const expectedAnswer = currentExample ? (isEnglishPrompt ? currentExample.russian : currentExample.english) : '';
  
  // Инициализация упражнения при загрузке компонента
  useEffect(() => {
    // Инициализируем примеры из пропсов
    setExamples(initialExamples);
  }, [initialExamples]);
  
  // Загрузка ID ошибок для режима практики
  useEffect(() => {
    // Этот эффект запускается только когда изменяются initialExamples или lessonId
    const loadErrorIds = async () => {
      if (lessonId === 'practice' && examples.length > 0) {
        try {
          const activeProfileId = getActiveProfileId();
          const analyticsItems = await getMostProblematicSentences(100, activeProfileId || undefined); // Запрашиваем больше предложений
          console.log(`Found ${analyticsItems.length} problematic sentences for profile ${activeProfileId}`);
          
          // Преобразуем примеры, добавляя к ним ID ошибок
          const updatedExamples = examples.map(example => {
            const matchingError = analyticsItems.find((item: AnalyticsItem) => 
              item.sentence.russian === example.russian && 
              item.sentence.english === example.english
            );
            if (matchingError && matchingError.id) {
              // Добавляем ID ошибки как нестандартное свойство
              console.log(`Found error ID for sentence "${example.english}": ${matchingError.id}`);
              return { ...example, errorId: matchingError.id };
            }
            return example;
          });
          setExamples(updatedExamples);
          
          // Обновляем также текущую сессию примеров
          if (currentSessionExamples.length > 0) {
            const updatedSessionExamples = currentSessionExamples.map(example => {
              const matchingError = analyticsItems.find((item: AnalyticsItem) => 
                item.sentence.russian === example.russian && 
                item.sentence.english === example.english
              );
              if (matchingError && matchingError.id) {
                return { ...example, errorId: matchingError.id };
              }
              return example;
            });
            setCurrentSessionExamples(updatedSessionExamples);
          }
          
          // Адаптируем количество упражнений в сессии к фактическому количеству предложений
          if (updatedExamples.length > 0 && updatedExamples.length < exercisesPerSession) {
            // Если предложений меньше, чем стандартное количество в сессии, адаптируем
            setExercisesPerSession(updatedExamples.length);
            console.log(`Adapted exercises per session to ${updatedExamples.length} for practice mode`);
          }
        } catch (error) {
          console.error('Error fetching error IDs:', error);
        }
      }
    };
    
    loadErrorIds();
  }, [lessonId, initialExamples, exercisesPerSession]);  // Удалили currentSessionExamples.length из зависимостей, чтобы избежать циклических обновлений
  
  // Разделение урока на части и загрузка прогресса
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setIsLoading(true);
        
        // Получаем активный профиль
        const activeProfileId = getActiveProfileId();
        
        // Проверяем, что examples не пустой массив
        if (!examples || examples.length === 0) {
          console.log('No examples available yet, waiting for data');
          setIsLoading(false);
          return;
        }
        
        // Получаем прогресс урока с списком пройденных предложений
        const progress = await getLessonProgress(lessonId, activeProfileId || undefined);
        console.log(`Lesson progress for ${lessonId}:`, progress);
        
        // Фильтруем примеры, исключая уже пройденные предложения
        let filteredExamples = [...examples];
        
        // Если это не режим практики и есть пройденные предложения, фильтруем их
        if (lessonId !== 'practice' && progress.completedSentences && Array.isArray(progress.completedSentences) && progress.completedSentences.length > 0) {
          filteredExamples = examples.filter(example => {
            // Если у примера есть id и он есть в списке пройденных, исключаем его
            return !('id' in example && example.id && progress.completedSentences.includes(example.id as string));
          });
          console.log(`Filtered out ${examples.length - filteredExamples.length} completed sentences`);
        }
        
        // Если все предложения уже пройдены, используем все примеры
        if (filteredExamples.length === 0) {
          filteredExamples = [...examples];
          console.log('All sentences completed, starting a new cycle');
        }
        
        // Адаптируем количество упражнений в сессии к фактическому количеству предложений
        let sessionsPerPage = exercisesPerSession;
        
        // Если это не режим практики и предложений меньше, чем стандартное количество в сессии
        if (lessonId !== 'practice' && filteredExamples.length > 0 && filteredExamples.length < exercisesPerSession) {
          sessionsPerPage = filteredExamples.length;
          setExercisesPerSession(sessionsPerPage);
          console.log(`Adapted exercises per session to ${sessionsPerPage} for lesson ${lessonId}`);
        }
        
        // Вычисляем общее количество страниц (частей урока)
        const calculatedTotalPages = Math.ceil(filteredExamples.length / sessionsPerPage);
        setTotalPages(calculatedTotalPages);
        
        let startIndex = 0;
        let initialPage = 1;
        
        if (progress.lastExerciseEnglish) {
          // Находим индекс упражнения по английскому тексту
          const exerciseIndex = filteredExamples.findIndex(ex => ex.english === progress.lastExerciseEnglish);
          
          if (exerciseIndex !== -1 && exerciseIndex < filteredExamples.length - 1) {
            // Вычисляем страницу и индекс внутри страницы
            initialPage = Math.floor(exerciseIndex / exercisesPerSession) + 1;
            startIndex = (exerciseIndex + 1) % exercisesPerSession; // +1 чтобы начать со следующего упражнения
            setProgressRestored(false); // Пока поставил false, чтобы не показывать чип
          }
        }
        
        // Устанавливаем текущую страницу
        setCurrentPage(initialPage);
        
        // Получаем примеры для текущей страницы
        const startExampleIndex = (initialPage - 1) * exercisesPerSession;
        const endExampleIndex = Math.min(startExampleIndex + exercisesPerSession, filteredExamples.length);
        const sessionExamples = filteredExamples.slice(startExampleIndex, endExampleIndex);
        setCurrentSessionExamples(sessionExamples);
        
        // Устанавливаем индекс текущего упражнения внутри сессии
        setCurrentIndex(startIndex);
      } catch (error) {
        console.error('Error initializing session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeSession();
  }, [lessonId, exercisesPerSession, examples]);

  // Функция для генерации случайных блоков на том же языке, что и ответ
  const generateRandomBlocks = (answer: string, count: number = 3): string[] => {
    // Определяем язык ответа (русский или английский)
    const isRussian = /[а-яА-ЯёЁ]/.test(answer);
    
    // Массив случайных слов для соответствующего языка
    const russianWords = ['время', 'человек', 'жизнь', 'день', 'рука', 'работа', 'слово', 'место', 'друг', 'дом', 'вопрос', 'сторона', 'страна', 'мир', 'случай'];
    const englishWords = ['time', 'person', 'year', 'way', 'day', 'thing', 'man', 'world', 'life', 'hand', 'part', 'child', 'eye', 'woman', 'place'];
    
    // Выбираем соответствующий массив слов
    const wordPool = isRussian ? russianWords : englishWords;
    
    // Генерируем уникальные случайные слова
    const randomWords: string[] = [];
    const answerWords = answer.split(' ');
    
    while (randomWords.length < count) {
      const randomWord = wordPool[Math.floor(Math.random() * wordPool.length)];
      // Проверяем, что слово не входит в ответ и еще не добавлено
      if (!answerWords.includes(randomWord) && !randomWords.includes(randomWord)) {
        randomWords.push(randomWord);
      }
    }
    
    return randomWords;
  };

  // Initialize blocks for block exercises
  useEffect(() => {
    if (!isLoading && isBlocksExercise && expectedAnswer) {
      const words = expectedAnswer.split(' ');
      
      // Генерируем случайные блоки для усложнения
      const randomBlocks = generateRandomBlocks(expectedAnswer);
      
      // Объединяем правильные слова и случайные блоки
      const allBlocks = [...words, ...randomBlocks];
      
      // Перемешиваем все блоки
      const shuffled = [...allBlocks].sort(() => Math.random() - 0.5);
      
      setBlockWords(shuffled);
      setSelectedBlocks([]);
    }
  }, [currentIndex, isBlocksExercise, expectedAnswer, isLoading]);
  
  // Загрузка настроек таймера из профиля
  const [timerDuration, setTimerDuration] = useState(30); // Значение по умолчанию
  
  // Загрузка настроек профиля (таймер и количество упражнений в сессии)
  useEffect(() => {
    const loadProfileSettings = async () => {
      try {
        const activeProfileId = getActiveProfileId();
        if (activeProfileId) {
          // Загружаем настройки профиля
          const { settings } = await fetchProfileSettings(activeProfileId);
          if (settings) {
            // Устанавливаем длительность таймера из настроек профиля
            if (settings.timerDuration) {
              setTimerDuration(settings.timerDuration);
            }
            
            // Устанавливаем состояние таймера из настроек профиля
            if (settings.timerEnabled !== undefined) {
              setTimerEnabled(settings.timerEnabled);
              
              // Если таймер включен, устанавливаем начальное значение
              if (settings.timerEnabled) {
                setTimeLeft(settings.timerDuration || 30);
              }
            }
            
            // Устанавливаем количество упражнений в сессии из настроек профиля
            if (settings.exercisesPerSession) {
              setExercisesPerSession(settings.exercisesPerSession);
            }
          }
        }
      } catch (error) {
        console.error('Error loading profile settings:', error);
      }
    };
    
    loadProfileSettings();
  }, []);
  
  // Timer logic - сбрасываем таймер при переходе к новому предложению
  useEffect(() => {
    if (timerEnabled) {
      // Устанавливаем начальное значение таймера при переходе к новому предложению
      setTimeLeft(timerDuration); // Используем значение из настроек профиля
    }
  }, [currentIndex, timerEnabled, timerDuration]);
  
  // Обратный отсчет таймера
  useEffect(() => {
    if (!timerEnabled || timeLeft === null) return;
    
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      // Time's up для текущего предложения
      handleSkip();
    }
  }, [timeLeft, timerEnabled]);
  
  // Обработчик смены страницы (части урока)
  const handlePageChange = async (event: React.ChangeEvent<unknown> | React.MouseEvent<unknown>, page: number) => {
    // Сохраняем только текущую позицию для возобновления позже, без добавления в completedSentences
    if (currentExample && lessonId !== 'practice') {
      try {
        // Используем функцию saveLessonProgress вместо прямого fetch для согласованности
        await saveLessonProgress(lessonId, currentExample.english);
      } catch (error) {
        console.error('Error saving current position:', error);
      }
    }
    
    // Вычисляем новые примеры для выбранной страницы
    const startExampleIndex = (page - 1) * exercisesPerSession;
    const endExampleIndex = Math.min(startExampleIndex + exercisesPerSession, examples.length);
    const sessionExamples = examples.slice(startExampleIndex, endExampleIndex);
    
    setCurrentSessionExamples(sessionExamples);
    setCurrentPage(page);
    setCurrentIndex(0); // Начинаем с первого упражнения на новой странице
    setUserAnswer('');
    setIsCorrect(null);
  };

  // Handle next example
  const handleNext = async () => {
    // Save only the current position for resuming later, without adding to completedSentences
    if (lessonId !== 'practice' && currentExample) {
      try {
        // Используем функцию saveLessonProgress вместо прямого fetch для согласованности
        await saveLessonProgress(lessonId, currentExample.english);
      } catch (error) {
        console.error('Error saving current position:', error);
      }
    }
    
    // Reset state for next example
    setUserAnswer('');
    setIsCorrect(null);
    setSelectedBlocks([]);
    
    if (currentIndex < currentSessionExamples.length - 1) {
      // Move to next example in current session
      setCurrentIndex(currentIndex + 1);
    } else {
      // End of session
      if (currentPage < totalPages) {
        // Move to next page/session
        // Create a proper event object instead of using an empty object
        const dummyEvent = { type: 'change' } as React.MouseEvent<unknown>;
        handlePageChange(dummyEvent, currentPage + 1);
      } else {
        // End of lesson
        if (lessonId !== 'practice') {
          markLessonCompleted(lessonId);
        } else {
          // Если это режим практики, обновляем список проблемных предложений
          // чтобы удалить те, которые были правильно отвечены
          const loadErrorIds = async () => {
            try {
              const activeProfileId = getActiveProfileId();
              const analyticsItems = await getMostProblematicSentences(100, activeProfileId || undefined);
              console.log(`Refreshed problematic sentences: ${analyticsItems.length} items`);
            } catch (error) {
              console.error('Error refreshing problematic sentences:', error);
            }
          };
          loadErrorIds();
        }
        setShowCompletionDialog(true);
      }
    }
    
    // Focus on input field for typing exercises
    if (isTypingExercise && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };
  
  // Check answer for typing exercises
  const checkTypingAnswer = () => {
    // Проверяем, что currentExample существует
    if (!currentExample) return;
    
    // Получаем активный профиль
    const activeProfileId = getActiveProfileId() || undefined;
  
    // Check answer for typing exercises - ignore all punctuation
    const normalizedUserAnswer = userAnswer.trim().toLowerCase().replace(/[.,!?;:()\[\]{}"'\-_<>=*&^%$#@~`|\/\\]/g, '').replace(/\s+/g, ' ');
    const normalizedExpectedAnswer = expectedAnswer.trim().toLowerCase().replace(/[.,!?;:()\[\]{}"'\-_<>=*&^%$#@~`|\/\\]/g, '').replace(/\s+/g, ' ');
    
    const correct = normalizedUserAnswer === normalizedExpectedAnswer;
    setIsCorrect(correct);
    
    if (!correct) {
      setErrorCount(errorCount + 1);
      // Record error in analytics
      addError(lessonId, {
        russian: currentExample.russian,
        english: currentExample.english
      }, currentErrorId);
    } else {
      // Если ответ правильный
      if (lessonId === 'practice') {
        // Если это режим практики, удаляем ошибку из аналитики
        removeError(lessonId, {
          russian: currentExample.russian,
          english: currentExample.english
        }, currentErrorId);
      } else if ('id' in currentExample && currentExample.id) {
        // Если это не режим практики и у примера есть ID, добавляем его в список пройденных
        console.log(`Marking sentence as completed: ${String(currentExample.id)}`);
        saveLessonProgress(lessonId, currentExample.english, currentExample.id);
      }
    }
    
    // Move to next example after a delay
    setTimeout(() => {
      handleNext();
    }, 1500);
  };
  
  // Check answer for blocks exercises
  const checkBlocksAnswer = () => {
    // Проверяем, что currentExample существует
    if (!currentExample) return;
    
    // Получаем активный профиль
    const activeProfileId = getActiveProfileId() || undefined;
    
    const userBlockAnswer = selectedBlocks.join(' ');
    const correct = userBlockAnswer.toLowerCase() === expectedAnswer.toLowerCase();
    setIsCorrect(correct);
    
    if (!correct) {
      setErrorCount(errorCount + 1);
      // Record error in analytics
      addError(lessonId, {
        russian: currentExample.russian,
        english: currentExample.english
      }, currentErrorId);
    } else {
      // Если ответ правильный
      if (lessonId === 'practice') {
        // Если это режим практики, удаляем ошибку из аналитики
        removeError(lessonId, {
          russian: currentExample.russian,
          english: currentExample.english
        }, currentErrorId);
      } else if ('id' in currentExample && currentExample.id) {
        // Если это не режим практики и у примера есть ID, добавляем его в список пройденных
        console.log(`Marking sentence as completed: ${String(currentExample.id)}`);
        saveLessonProgress(lessonId, currentExample.english, currentExample.id);
      }
    }
    
    // Move to next example after a delay
    setTimeout(() => {
      handleNext();
    }, 1500);
  };
  
  // Handle block selection
  const handleBlockClick = (word: string, index: number) => {
    setSelectedBlocks([...selectedBlocks, word]);
    
    // Remove the selected word from available blocks
    const newBlocks = [...blockWords];
    newBlocks.splice(index, 1);
    setBlockWords(newBlocks);
  };
  
  // Handle selected block removal
  const handleSelectedBlockClick = (index: number) => {
    const word = selectedBlocks[index];
    
    // Remove from selected and add back to available
    const newSelected = [...selectedBlocks];
    newSelected.splice(index, 1);
    setSelectedBlocks(newSelected);
    
    setBlockWords([...blockWords, word]);
  };
  
  // Handle skip
  const handleSkip = async () => {
    // Проверяем, что currentExample существует
    if (!currentExample) return;
    
    setIsCorrect(false);
    setErrorCount(errorCount + 1);
    
    // Record error in analytics
    addError(lessonId, {
      russian: currentExample.russian,
      english: currentExample.english
    }, currentErrorId);  // Добавили currentErrorId для корректной работы с режимом практики
    
    // Move to next example after a delay
    setTimeout(() => {
      handleNext();
    }, 1500);
  };
  
  // Handle completion
  const handleCompletion = () => {
    setShowCompletionDialog(false);
    
    if (currentPage < totalPages) {
      // Если есть еще страницы, переходим к следующей странице
      // Create a proper event object instead of using an empty object
      const dummyEvent = { type: 'change' } as React.MouseEvent<unknown>;
      handlePageChange(dummyEvent, currentPage + 1);
    } else {
      // Если урок полностью завершен, возвращаемся к списку уроков
      router.push('/lessons');
    }
  };
  
  // Handle timer toggle
  const handleTimerToggle = () => {
    if (timerEnabled) {
      setTimerEnabled(false);
      setTimeLeft(null);
    } else {
      setTimerEnabled(true);
      setTimeLeft(30); // Default timer duration
    }
  };
  
  // Handle user input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(e.target.value);
  };
  
  // Handle key press for typing exercises
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userAnswer.trim() !== '' && isCorrect === null) {
      checkTypingAnswer();
    }
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Загрузка упражнения...
        </Typography>
      </Box>
    );
  }
  
  // Показываем загрузку, если нет текущего примера и не в состоянии загрузки
  if (!currentExample && !isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="h6">
          Загрузка упражнений...
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Если загрузка не происходит, попробуйте обновить страницу
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 1, maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ mb: 1 }}>
        <Typography variant="h6" gutterBottom>
          {lessonTitle}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ flexGrow: 1, mr: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
          <Typography variant="body2">
            {currentIndex + 1} / {totalExamples}
          </Typography>
          
          <IconButton 
            color={timerEnabled ? "primary" : "default"} 
            onClick={handleTimerToggle}
            sx={{ ml: 2 }}
          >
            <TimerIcon />
          </IconButton>
          
          {timerEnabled && timeLeft !== null && (
            <Typography variant="body2" sx={{ ml: 1 }}>
              {timeLeft}s
            </Typography>
          )}
        </Box>
        
        {progressRestored && (
          <Box sx={{ mb: 2 }}>
            <Chip 
              label="Прогресс восстановлен" 
              color="success" 
              variant="outlined" 
            />
          </Box>
        )}
      </Box>
      
      <Box sx={{ mb: 1 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {isEnglishPrompt ? 'Английский' : 'Русский'}
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.2rem', mb: 1 }}>
              {prompt}
            </Typography>
            
            <Typography variant="h6" gutterBottom>
              {isEnglishPrompt ? 'Русский' : 'Английский'}
            </Typography>
            
            {isTypingExercise && (
              <TextField
                fullWidth
                variant="outlined"
                value={userAnswer}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Введите перевод..."
                disabled={isCorrect !== null}
                autoFocus
                inputRef={inputRef}
                sx={{ mb: 1 }}
              />
            )}
            
            {isBlocksExercise && (
              <Box>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    mb: 1, 
                    minHeight: 60, 
                    bgcolor: 'background.paper',
                    border: '1px dashed',
                    borderColor: 'divider',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                  }}
                >
                  {selectedBlocks.map((word, index) => (
                    <Chip
                      key={index}
                      label={word}
                      onClick={() => handleSelectedBlockClick(index)}
                      color="primary"
                      sx={{ m: 0.5 }}
                      disabled={isCorrect !== null}
                    />
                  ))}
                </Paper>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap',  }}>
                  {blockWords.map((word, index) => (
                    <Chip
                      key={index}
                      label={word}
                      onClick={() => handleBlockClick(word, index)}
                      variant="outlined"
                      sx={{ m: 0.5 }}
                      disabled={isCorrect !== null}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<SkipIcon />}
            onClick={handleSkip}
            disabled={isCorrect !== null}
          >
            Не знаю
          </Button>
          
          <Button 
            variant="contained" 
            color="primary"
            onClick={isTypingExercise ? checkTypingAnswer : checkBlocksAnswer}
            disabled={
              isCorrect !== null || 
              (isTypingExercise && userAnswer.trim() === '') ||
              (isBlocksExercise && selectedBlocks.length === 0)
            }
          >
            Проверить
          </Button>
        </Box>
      </Box>
      
      {isCorrect !== null && (
        <Box 
          sx={{ 
            p: 2, 
            borderRadius: 2, 
            mb: 2,
            bgcolor: isCorrect ? 'success.dark' : 'error.dark',
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {isCorrect ? (
              <CheckIcon sx={{ mr: 1 }} />
            ) : (
              <CloseIcon sx={{ mr: 1 }} />
            )}
            <Typography variant="h6">
              {isCorrect ? 'Правильно!' : 'Неверно!'}
            </Typography>
          </Box>
          
          {!isCorrect && (
            <Typography variant="body1">
              Правильный ответ: <strong>{expectedAnswer}</strong>
            </Typography>
          )}
        </Box>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Часть {currentPage} из {totalPages}
          </Typography>
          <Pagination 
            count={totalPages} 
            page={currentPage} 
            onChange={handlePageChange} 
            color="primary" 
            size="small"
          />
        </Box>
      )}
      
      {/* Completion Dialog */}
      <Dialog
        open={showCompletionDialog}
        onClose={handleCompletion}
      >
        <DialogTitle>
          {currentPage < totalPages ? 'Часть урока завершена!' : 'Урок завершен!'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {currentPage < totalPages ? (
              `Вы успешно завершили часть ${currentPage} из ${totalPages} урока "${lessonTitle}".`
            ) : (
              `Вы успешно завершили урок "${lessonTitle}".`
            )}
            {errorCount > 0 ? (
              ` Вы допустили ${errorCount} ошибок. Эти предложения будут добавлены в список для повторения.`
            ) : (
              ' Отличная работа! Вы не допустили ни одной ошибки.'
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          {currentPage < totalPages ? (
            <Button onClick={handleCompletion} color="primary" autoFocus>
              Перейти к следующей части
            </Button>
          ) : (
            <Button onClick={handleCompletion} color="primary" autoFocus>
              Вернуться к урокам
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
