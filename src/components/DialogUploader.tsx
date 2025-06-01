'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Button, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { LessonLevel } from '@/types/lesson';
import { DialogFile, UploadDialogResult } from '@/types/dialog';

interface DialogUploaderProps {
  onUploadSuccess: () => void;
}

export default function DialogUploader({ onUploadSuccess }: DialogUploaderProps) {
  const router = useRouter();
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<LessonLevel>(LessonLevel.A0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadDialogResult | null>(null);
  
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
  
  const handleSaveDialog = async () => {
    if (!fileContent || !fileName || !lessonId) {
      setResult({
        fileName,
        success: false,
        message: 'Необходимо выбрать файл и указать ID урока'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const dialogFile: DialogFile = {
        fileName,
        dialogData: fileContent,
        lessonId,
        level: selectedLevel
      };
      
      const response = await fetch('/api/dialogs/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dialogFile),
      });
      
      const data = await response.json();
      
      setResult({
        fileName,
        success: data.success,
        message: data.message || (data.error || 'Не удалось загрузить диалоги')
      });
      
      if (data.success) {
        console.log('Dialog upload successful. Uploaded dialog for lesson:', lessonId);
        
        // Сбрасываем поля
        setFileName('');
        setFileContent('');
        setLessonId('');
        setSelectedLevel(LessonLevel.A0);
        
        // Уведомляем родительский компонент об успешной загрузке
        onUploadSuccess();
        
        // Добавляем небольшую задержку перед перенаправлением
        setTimeout(() => {
          // Создаем уникальный параметр для предотвращения кэширования
          const cacheBuster = `refresh=${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
          console.log('Redirecting to dialogs page with cache buster:', cacheBuster);
          
          // Перенаправляем на страницу диалогов с параметром для предотвращения кэширования
          // Используем router.replace вместо router.push для полного обновления страницы
          router.replace(`/dialogs?${cacheBuster}`);
          
          // Дополнительно обновляем страницу через window.location для продакшен-режима
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.location.href = `/dialogs?${cacheBuster}&force=true`;
            }
          }, 500);
        }, 1000);
      }
    } catch (error) {
      setResult({
        fileName,
        success: false,
        message: 'Произошла ошибка при загрузке диалогов'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" gutterBottom>
        Загрузить диалоги
      </Typography>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        Файл диалогов должен быть в формате JSON и содержать объект <code>dialogs</code> с разделами <code>easy</code>, <code>medium</code> и <code>hard</code>. Смотрите пример в <code>src/examples/dialog_example.json</code>.
      </Alert>
      
      {result && (
        <Alert 
          severity={result.success ? 'success' : 'error'}
          sx={{ mb: 2 }}
        >
          {result.message}
        </Alert>
      )}
      
      <Button
        variant="contained"
        component="label"
        startIcon={<CloudUploadIcon />}
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
      
      <TextField
        label="ID урока"
        value={lessonId}
        onChange={(e) => setLessonId(e.target.value)}
        fullWidth
        margin="normal"
        required
        error={lessonId.trim() === ''}
        helperText="Укажите ID урока, к которому относятся диалоги (например, lesson1). Файл будет сохранен как [ID]_dialogs.json"
      />
      
      <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
        <InputLabel id="dialog-level-select-label">Уровень CEFR</InputLabel>
        <Select
          labelId="dialog-level-select-label"
          value={selectedLevel}
          label="Уровень CEFR"
          onChange={(e) => setSelectedLevel(e.target.value as LessonLevel)}
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
        <FormHelperText>Выберите уровень сложности диалогов по шкале CEFR</FormHelperText>
      </FormControl>
      
      <Button
        variant="contained"
        color="primary"
        onClick={handleSaveDialog}
        disabled={!fileContent || !fileName || !lessonId || loading}
        sx={{ mt: 1 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Сохранить диалоги'}
      </Button>
    </Box>
  );
}
