'use client';

import { useState, useEffect } from 'react';
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
  Tabs
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Backup as BackupIcon,
  CloudUpload as UploadIcon,
  Save as SaveIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import ClientLayout from '@/components/ClientLayout';
import { fetchLessons, uploadLesson, deleteLesson, createAnalyticsBackup } from '@/utils/clientUtils';
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
  const [lessons, setLessons] = useState<{id: string, title: string}[]>([]);
  
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
  
  // Обработчик загрузки файла урока
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
  
  // Сохранение урока
  const handleSaveLesson = async () => {
    try {
      const result = await uploadLesson(fileName, fileContent);
      
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
    } catch (error) {
      console.error('Error saving lesson:', error);
      setSnackbar({
        open: true,
        message: 'Не удалось сохранить урок',
        severity: 'error'
      });
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
                        
                        <Button
                          variant="contained"
                          component="label"
                          startIcon={<UploadIcon />}
                          sx={{ mb: 2 }}
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
                          <Typography variant="body2" sx={{ mb: 2 }}>
                            Выбранный файл: {fileName}
                          </Typography>
                        )}
                        
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleSaveLesson}
                          disabled={!fileContent || !fileName}
                          sx={{ mt: 2 }}
                        >
                          Сохранить урок
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Список уроков
                        </Typography>
                        
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
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </TabPanel>
            )}
            
            {/* Вкладка аналитики (только для администратора) */}
            {isAdminUser && (
              <TabPanel value={tabValue} index={2}>
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
