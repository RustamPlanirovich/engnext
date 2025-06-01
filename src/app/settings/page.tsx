'use client';

import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { LessonLevel } from '@/types/lesson';
import { 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Button, 
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Switch,
  FormControlLabel,
  Slider,
  Grid,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
  Paper,
  FormHelperText
} from '@mui/material';
import DialogUploader from '@/components/DialogUploader';
import { 
  Delete as DeleteIcon, 
  Backup as BackupIcon,
  CloudUpload as UploadIcon,
  Save as SaveIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import ClientLayout from '@/components/ClientLayout';
import { 
  fetchLessons, 
  uploadLesson, 
  deleteLesson, 
  uploadMultipleLessons, 
  createAnalyticsBackup, 
  fetchLessonForEditing, 
  updateLesson 
} from '@/utils/clientUtils';
import { fetchProfileSettings, updateProfileSettings, isAdmin } from '@/utils/clientProfileUtils';
import { getActiveProfileId } from '@/utils/clientUtils';
import { UserSettings, ExerciseMode } from '@/types/lesson';

// Интерфейс для TabPanel
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Компонент TabPanel
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function SettingsPage() {
  // Состояние для вкладок
  const [tabValue, setTabValue] = useState(0);
  
  // Состояние для настроек профиля
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState(30);
  const [darkMode, setDarkMode] = useState(false);
  const [exerciseMode, setExerciseMode] = useState<ExerciseMode>('ru-to-en-typing');
  const [exercisesPerSession, setExercisesPerSession] = useState(10);
  
  // Состояние для администрирования уроков
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('A0');
  const [lessons, setLessons] = useState<{id: string, title: string}[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<{fileName: string, lessonData: string}[]>([]);
  const [uploadResults, setUploadResults] = useState<{fileName: string, success: boolean, message: string}[]>([]);
  const [showUploadResults, setShowUploadResults] = useState(false);
  
  // Состояние для редактора JSON
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [jsonContent, setJsonContent] = useState<string>('');
  const [jsonError, setJsonError] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [useHighlighter, setUseHighlighter] = useState<boolean>(true); // Флаг для переключения между подсветкой и обычным редактором
  
  // Состояние для UI
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({ open: false, lessonId: '' });
  
  // Обработчик изменения вкладок
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Загрузка настроек профиля и проверка прав администратора
  useEffect(() => {
    const loadProfileSettings = async () => {
      try {
        setLoading(true);
        const activeProfileId = getActiveProfileId();
        setProfileId(activeProfileId);
        
        if (activeProfileId) {
          // Проверяем, является ли пользователь администратором
          const adminStatus = await isAdmin(activeProfileId);
          setIsAdminUser(adminStatus);
          
          // Загружаем настройки профиля
          const { settings } = await fetchProfileSettings(activeProfileId);
          if (settings) {
            setTimerEnabled(settings.timerEnabled || false);
            setTimerDuration(settings.timerDuration || 30);
            setDarkMode(settings.darkMode || false);
            setExerciseMode(settings.exerciseMode || 'ru-to-en-typing');
            setExercisesPerSession(settings.exercisesPerSession || 10);
          }
        }
      } catch (error) {
        console.error('Error loading profile settings:', error);
        setSnackbar({
          open: true,
          message: 'Не удалось загрузить настройки профиля',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadProfileSettings();
  }, []);
  
  // Загрузка списка уроков для администратора
  useEffect(() => {
    const getLessons = async () => {
      try {
        const data = await fetchLessons();
        setLessons(data.lessons);
      } catch (error) {
        console.error('Error fetching lessons:', error);
        setSnackbar({
          open: true,
          message: 'Не удалось загрузить список уроков',
          severity: 'error'
        });
      }
    };
    
    if (isAdminUser) {
      getLessons();
    }
  }, [isAdminUser]);
  
  // Обработчик загрузки файла урока (один файл)
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
    };
    reader.readAsText(file);
  };
  
  // Обработчик загрузки нескольких файлов уроков
  const handleMultipleFilesUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Сбрасываем предыдущие результаты
    setSelectedFiles([]);
    setUploadResults([]);
    setShowUploadResults(false);
    
    // Обрабатываем каждый файл
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setSelectedFiles(prev => [...prev, { 
          fileName: file.name, 
          lessonData: content,
          level: selectedLevel // Используем текущий выбранный уровень
        }]);
      };
      reader.readAsText(file);
    });
  };
  
  // Сохранение одного урока
  const handleSaveLesson = async () => {
    try {
      const result = await uploadLesson(fileName, fileContent, selectedLevel);
      
      setSnackbar({
        open: true,
        message: result.message,
        severity: 'success'
      });
      
      // Обновляем список уроков
      const data = await fetchLessons();
      setLessons(data.lessons);
      
      // Сбрасываем поля
      setFileName('');
      setFileContent('');
      setSelectedLevel('A0'); // Сбрасываем уровень на значение по умолчанию
    } catch (error) {
      console.error('Error saving lesson:', error);
      setSnackbar({
        open: true,
        message: 'Не удалось сохранить урок',
        severity: 'error'
      });
    }
  };
  
  // Сохранение нескольких уроков
  const handleSaveMultipleLessons = async () => {
    if (selectedFiles.length === 0) {
      setSnackbar({
        open: true,
        message: 'Нет файлов для загрузки',
        severity: 'error' // Изменено с 'warning' на 'error', так как тип принимает только 'success' | 'error'
      });
      return;
    }
    
    try {
      setLoading(true);
      const result = await uploadMultipleLessons(selectedFiles);
      
      // Показываем результаты загрузки
      setUploadResults(result.results);
      setShowUploadResults(true);
      
      setSnackbar({
        open: true,
        message: result.message,
        severity: result.success ? 'success' : 'error' // Изменено с 'warning' на 'error', так как тип принимает только 'success' | 'error'
      });
      
      // Обновляем список уроков
      const data = await fetchLessons();
      setLessons(data.lessons);
      
      // Сбрасываем поля
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error saving multiple lessons:', error);
      setSnackbar({
        open: true,
        message: 'Не удалось сохранить уроки',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Открытие диалога подтверждения удаления урока
  const handleDeleteClick = (lessonId: string) => {
    setDeleteConfirmDialog({
      open: true,
      lessonId
    });
  };
  
  // Закрытие диалога подтверждения удаления урока
  const handleCloseDeleteDialog = () => {
    setDeleteConfirmDialog({
      open: false,
      lessonId: ''
    });
  };
  
  // Удаление урока
  const handleConfirmDelete = async () => {
    try {
      const result = await deleteLesson(deleteConfirmDialog.lessonId);
      
      setSnackbar({
        open: true,
        message: result.message,
        severity: 'success'
      });
      
      // Обновляем список уроков
      const data = await fetchLessons();
      setLessons(data.lessons);
    } catch (error) {
      console.error('Error deleting lesson:', error);
      setSnackbar({
        open: true,
        message: 'Не удалось удалить урок',
        severity: 'error'
      });
    } finally {
      handleCloseDeleteDialog();
    }
  };
  
  // Создание резервной копии аналитики
  const handleCreateBackup = async () => {
    try {
      const result = await createAnalyticsBackup();
      setSnackbar({
        open: true,
        message: result.message,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error creating analytics backup:', error);
      setSnackbar({
        open: true,
        message: 'Не удалось создать резервную копию аналитики',
        severity: 'error'
      });
    }
  };
  
  // Сохранение настроек профиля
  const handleSaveProfileSettings = async () => {
    if (!profileId) {
      setSnackbar({
        open: true,
        message: 'Нет активного профиля',
        severity: 'error'
      });
      return;
    }
    
    try {
      const settings: UserSettings = {
        timerEnabled,
        timerDuration,
        darkMode,
        exerciseMode,
        exercisesPerSession
      };
      
      await updateProfileSettings(settings, profileId);
      
      setSnackbar({
        open: true,
        message: 'Настройки профиля успешно сохранены',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving profile settings:', error);
      setSnackbar({
        open: true,
        message: 'Не удалось сохранить настройки профиля',
        severity: 'error'
      });
    }
  };
  
  // Закрытие snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  return (
    <ClientLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Настройки
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
                <Tab label="Настройки профиля" />
                {isAdminUser && <Tab label="Управление уроками" />}
                {isAdminUser && <Tab label="Редактор уроков" />}
                {isAdminUser && <Tab label="Управление диалогами" />}
                {isAdminUser && <Tab label="Аналитика" />}
              </Tabs>
            </Box>
            
            {/* Вкладка настроек профиля */}
            <TabPanel value={tabValue} index={0}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Настройки профиля
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={timerEnabled}
                        onChange={(e) => setTimerEnabled(e.target.checked)}
                        name="timerEnabled"
                        color="primary"
                      />
                    }
                    label="Включить таймер"
                  />
                  
                  <Box sx={{ width: '100%', px: 2, mb: 3 }}>
                    <Typography id="timer-slider" gutterBottom>
                      Время на ответ: {timerDuration} секунд
                    </Typography>
                    <Slider
                      value={timerDuration}
                      onChange={(e, newValue) => setTimerDuration(newValue as number)}
                      aria-labelledby="timer-slider"
                      valueLabelDisplay="auto"
                      step={5}
                      marks
                      min={5}
                      max={60}
                      disabled={!timerEnabled}
                    />
                  </Box>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={darkMode}
                        onChange={(e) => setDarkMode(e.target.checked)}
                        name="darkMode"
                        color="primary"
                      />
                    }
                    label="Темная тема"
                  />
                  
                  <Box sx={{ width: '100%', px: 2, my: 3 }}>
                    <Typography gutterBottom>
                      Режим упражнений:
                    </Typography>
                    <FormControl fullWidth>
                      <Select
                        value={exerciseMode}
                        onChange={(e) => setExerciseMode(e.target.value as ExerciseMode)}
                      >
                        <MenuItem value="ru-to-en-typing">С русского на английский (ввод текста)</MenuItem>
                        <MenuItem value="en-to-ru-typing">С английского на русский (ввод текста)</MenuItem>
                        <MenuItem value="ru-to-en-blocks">С русского на английский (блоки)</MenuItem>
                        <MenuItem value="en-to-ru-blocks">С английского на русский (блоки)</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  
                  <Box sx={{ width: '100%', px: 2, mb: 3 }}>
                    <Typography id="exercises-slider" gutterBottom>
                      Количество упражнений в сессии: {exercisesPerSession}
                    </Typography>
                    <Slider
                      value={exercisesPerSession}
                      onChange={(e, newValue) => setExercisesPerSession(newValue as number)}
                      aria-labelledby="exercises-slider"
                      valueLabelDisplay="auto"
                      step={5}
                      marks
                      min={5}
                      max={30}
                    />
                  </Box>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveProfileSettings}
                    startIcon={<SaveIcon />}
                    sx={{ mt: 2 }}
                  >
                    Сохранить настройки профиля
                  </Button>
                </CardContent>
              </Card>
            </TabPanel>
            
            {/* Вкладка управления уроками (только для администратора) */}
            {isAdminUser && (
              <TabPanel value={tabValue} index={1}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Добавить урок
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {/* Загрузка одного файла */}
                          <Box>
                            <Button
                              variant="contained"
                              component="label"
                              startIcon={<UploadIcon />}
                              sx={{ mb: 1 }}
                            >
                              Выбрать файл
                              <input
                                type="file"
                                hidden
                                accept=".json"
                                onChange={handleFileUpload}
                              />
                            </Button>
                            
                            {fileName && (
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                Выбранный файл: {fileName}
                              </Typography>
                            )}
                            
                            <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                              <InputLabel id="level-select-label">Уровень CEFR</InputLabel>
                              <Select
                                labelId="level-select-label"
                                value={selectedLevel}
                                label="Уровень CEFR"
                                onChange={(e) => setSelectedLevel(e.target.value)}
                              >
                                {Object.values(LessonLevel).map((level) => (
                                  <MenuItem key={level} value={level}>
                                    {level} {level === 'A0' ? '(Начальный)' : 
                                           level === 'A1' ? '(Элементарный)' : 
                                           level === 'A2' ? '(Предсредний)' : 
                                           level === 'B1' ? '(Средний)' : 
                                           level === 'B2' ? '(Выше среднего)' : 
                                           level === 'C1' ? '(Продвинутый)' : 
                                           level === 'C2' ? '(Свободное владение)' : ''}
                                  </MenuItem>
                                ))}
                              </Select>
                              <FormHelperText>Выберите уровень сложности урока по шкале CEFR</FormHelperText>
                            </FormControl>
                            
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={handleSaveLesson}
                              disabled={!fileContent || !fileName}
                              sx={{ mt: 1 }}
                            >
                              Сохранить урок
                            </Button>
                          </Box>
                          
                          <Divider sx={{ my: 2 }}>ИЛИ</Divider>
                          
                          {/* Загрузка нескольких файлов */}
                          <Box>
                            <Button
                              variant="contained"
                              component="label"
                              startIcon={<UploadIcon />}
                              sx={{ mb: 1 }}
                              color="secondary"
                            >
                              Выбрать несколько файлов
                              <input
                                type="file"
                                hidden
                                accept=".json"
                                multiple
                                onChange={handleMultipleFilesUpload}
                              />
                            </Button>
                            
                            <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                              <InputLabel id="multiple-level-select-label">Уровень CEFR для всех файлов</InputLabel>
                              <Select
                                labelId="multiple-level-select-label"
                                value={selectedLevel}
                                label="Уровень CEFR для всех файлов"
                                onChange={(e) => setSelectedLevel(e.target.value)}
                              >
                                {Object.values(LessonLevel).map((level) => (
                                  <MenuItem key={`multiple-${level}`} value={level}>
                                    {level} {level === 'A0' ? '(Начальный)' : 
                                           level === 'A1' ? '(Элементарный)' : 
                                           level === 'A2' ? '(Предсредний)' : 
                                           level === 'B1' ? '(Средний)' : 
                                           level === 'B2' ? '(Выше среднего)' : 
                                           level === 'C1' ? '(Продвинутый)' : 
                                           level === 'C2' ? '(Свободное владение)' : ''}
                                  </MenuItem>
                                ))}
                              </Select>
                              <FormHelperText>Выберите общий уровень сложности для всех загружаемых уроков</FormHelperText>
                            </FormControl>
                            
                            {selectedFiles.length > 0 && (
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                Выбрано файлов: {selectedFiles.length}
                              </Typography>
                            )}
                            
                            <Button
                              variant="contained"
                              color="secondary"
                              onClick={handleSaveMultipleLessons}
                              disabled={selectedFiles.length === 0}
                              sx={{ mt: 1 }}
                            >
                              Загрузить все файлы
                            </Button>
                          </Box>
                          
                          {/* Результаты загрузки */}
                          {showUploadResults && uploadResults.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Результаты загрузки:
                              </Typography>
                              <Box sx={{ maxHeight: 150, overflow: 'auto', border: '1px solid #eee', borderRadius: 1, p: 1 }}>
                                <List dense>
                                  {uploadResults.map((result, index) => (
                                    <ListItem key={index}>
                                      <ListItemText 
                                        primary={result.fileName}
                                        secondary={result.message}
                                        primaryTypographyProps={{ 
                                          color: result.success ? 'primary' : 'error',
                                          variant: 'body2'
                                        }}
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Список уроков
                        </Typography>
                        
                        <Box sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
                          <List>
                            {lessons.map((lesson) => (
                              <ListItem
                                key={lesson.id}
                                secondaryAction={
                                  <IconButton
                                    edge="end"
                                    aria-label="delete"
                                    onClick={() => handleDeleteClick(lesson.id)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                }
                              >
                                <ListItemText
                                  primary={lesson.title}
                                  secondary={`ID: ${lesson.id}`}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </TabPanel>
            )}
            
            {/* Вкладка редактора уроков (только для администратора) */}
            {isAdminUser && (
              <TabPanel value={tabValue} index={2}>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Редактор JSON файлов уроков
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Выберите урок из списка для редактирования. Вы можете изменить содержимое JSON файла и сохранить изменения.
                    </Typography>
                    
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel id="lesson-select-label">Выберите урок</InputLabel>
                      <Select
                        labelId="lesson-select-label"
                        value={selectedLesson}
                        onChange={(e) => {
                          setSelectedLesson(e.target.value as string);
                          setJsonContent('');
                          setJsonError('');
                          setIsEditing(false);
                        }}
                        label="Выберите урок"
                      >
                        <MenuItem value="">Выберите урок</MenuItem>
                        {lessons.map((lesson) => (
                          <MenuItem key={lesson.id} value={lesson.id}>
                            {lesson.title} (ID: {lesson.id})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    {selectedLesson && !isEditing && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={async () => {
                          try {
                            setLoading(true);
                            const result = await fetchLessonForEditing(selectedLesson);
                            if (result.success) {
                              try {
                                // Форматируем JSON для лучшей читаемости
                                const formattedJson = JSON.stringify(JSON.parse(result.lessonContent), null, 2);
                                setJsonContent(formattedJson);
                                setJsonError('');
                                setIsEditing(true);
                              } catch (e) {
                                setJsonContent(result.lessonContent);
                                setJsonError('Предупреждение: Невалидный JSON формат');
                                setIsEditing(true);
                              }
                            }
                          } catch (error) {
                            console.error('Error fetching lesson:', error);
                            setSnackbar({
                              open: true,
                              message: 'Не удалось загрузить урок для редактирования',
                              severity: 'error'
                            });
                          } finally {
                            setLoading(false);
                          }
                        }}
                        startIcon={<EditIcon />}
                      >
                        Редактировать урок
                      </Button>
                    )}
                  </CardContent>
                </Card>
                
                {isEditing && (
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Редактирование урока: {lessons.find(l => l.id === selectedLesson)?.title}
                      </Typography>
                      
                      {jsonError && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          {jsonError}
                        </Alert>
                      )}
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={useHighlighter}
                            onChange={(e) => setUseHighlighter(e.target.checked)}
                            name="useHighlighter"
                            color="primary"
                          />
                        }
                        label="Использовать подсветку синтаксиса"
                        sx={{ mb: 2 }}
                      />
                      
                      {useHighlighter ? (
                        <Box 
                          sx={{ 
                            border: (theme) => `1px solid ${jsonError ? theme.palette.error.main : theme.palette.divider}`,
                            borderRadius: 1,
                            mb: 2,
                            overflow: 'auto',
                            maxHeight: '500px',
                            '&:hover': {
                              border: (theme) => `1px solid ${jsonError ? theme.palette.error.main : theme.palette.primary.main}`,
                            },
                            position: 'relative'
                          }}
                        >
                          <Box sx={{ position: 'absolute', top: 0, right: 0, zIndex: 1 }}>
                            <Button 
                              size="small" 
                              onClick={() => setUseHighlighter(false)}
                              sx={{ m: 1 }}
                            >
                              Перейти в режим редактирования
                            </Button>
                          </Box>
                          <SyntaxHighlighter
                            language="json"
                            style={materialDark}
                            customStyle={{ margin: 0, minHeight: '500px' }}
                            wrapLongLines={true}
                            showLineNumbers={true}
                          >
                            {jsonContent}
                          </SyntaxHighlighter>
                          <TextField
                            fullWidth
                            multiline
                            rows={20}
                            variant="outlined"
                            value={jsonContent}
                            onChange={(e) => {
                              setJsonContent(e.target.value);
                              // Проверяем валидность JSON при каждом изменении
                              try {
                                JSON.parse(e.target.value);
                                setJsonError('');
                              } catch (e) {
                                setJsonError('Невалидный JSON формат');
                              }
                            }}
                            sx={{ 
                              position: 'absolute', 
                              top: 0, 
                              left: 0, 
                              width: '100%', 
                              height: '100%', 
                              opacity: 0,
                              zIndex: 0
                            }}
                          />
                          {jsonError && (
                            <FormHelperText error sx={{ mx: 2, mb: 1 }}>
                              {jsonError}
                            </FormHelperText>
                          )}
                        </Box>
                      ) : (
                        <TextField
                          fullWidth
                          multiline
                          rows={20}
                          variant="outlined"
                          value={jsonContent}
                          onChange={(e) => {
                            setJsonContent(e.target.value);
                            // Проверяем валидность JSON при каждом изменении
                            try {
                              JSON.parse(e.target.value);
                              setJsonError('');
                            } catch (e) {
                              setJsonError('Невалидный JSON формат');
                            }
                          }}
                          error={!!jsonError}
                          helperText={jsonError}
                          sx={{ fontFamily: 'monospace', mb: 2 }}
                        />
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setIsEditing(false);
                            setJsonContent('');
                            setJsonError('');
                          }}
                        >
                          Отмена
                        </Button>
                        
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={async () => {
                            try {
                              // Проверяем валидность JSON перед сохранением
                              try {
                                JSON.parse(jsonContent);
                              } catch (e) {
                                setSnackbar({
                                  open: true,
                                  message: 'Невалидный JSON формат. Исправьте ошибки перед сохранением.',
                                  severity: 'error'
                                });
                                return;
                              }
                              
                              setLoading(true);
                              const result = await updateLesson(selectedLesson, jsonContent);
                              
                              if (result.success) {
                                setSnackbar({
                                  open: true,
                                  message: result.message || 'Урок успешно обновлен',
                                  severity: 'success'
                                });
                                
                                // Сбрасываем состояние редактора
                                setIsEditing(false);
                                setJsonContent('');
                                setSelectedLesson('');
                              }
                            } catch (error) {
                              console.error('Error updating lesson:', error);
                              setSnackbar({
                                open: true,
                                message: 'Не удалось обновить урок',
                                severity: 'error'
                              });
                            } finally {
                              setLoading(false);
                            }
                          }}
                          disabled={!!jsonError}
                          startIcon={<SaveIcon />}
                        >
                          Сохранить изменения
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </TabPanel>
            )}
            
            {/* Вкладка управления диалогами (только для администратора) */}
            {isAdminUser && (
              <TabPanel value={tabValue} index={3}>
                <Card>
                  <CardContent>
                    <DialogUploader onUploadSuccess={() => {
                      setSnackbar({
                        open: true,
                        message: 'Диалоги успешно загружены',
                        severity: 'success'
                      });
                    }} />
                  </CardContent>
                </Card>
              </TabPanel>
            )}
            
            {/* Вкладка аналитики (только для администратора) */}
            {isAdminUser && (
              <TabPanel value={tabValue} index={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Управление аналитикой
                    </Typography>
                    
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleCreateBackup}
                      startIcon={<BackupIcon />}
                      sx={{ mt: 2 }}
                    >
                      Создать резервную копию аналитики
                    </Button>
                  </CardContent>
                </Card>
              </TabPanel>
            )}
          </Box>
        )}
        
        {/* Диалог подтверждения удаления урока */}
        <Dialog
          open={deleteConfirmDialog.open}
          onClose={handleCloseDeleteDialog}
        >
          <DialogTitle>Подтверждение удаления</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Вы уверены, что хотите удалить этот урок? Это действие нельзя отменить.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog} color="primary">
              Отмена
            </Button>
            <Button onClick={handleConfirmDelete} color="error" autoFocus>
              Удалить
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Уведомление */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ClientLayout>
  );
}
