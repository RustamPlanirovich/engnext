'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Grid, 
  CircularProgress,
  Chip,
  Divider,
  IconButton,
  FormControlLabel,
  Switch,
  Tooltip,
  Paper
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Translate as TranslateIcon
} from '@mui/icons-material';
import ClientLayout from '@/components/ClientLayout';
import { DialogSet, DialogDifficulty, Dialog } from '@/types/dialog';

export default function DialogDetailPage({ params }: { params: { lessonId: string } }) {
  const router = useRouter();
  const { lessonId } = params;
  
  const [dialogSet, setDialogSet] = useState<DialogSet | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DialogDifficulty>('easy' as DialogDifficulty);
  const [selectedDialogIndex, setSelectedDialogIndex] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<'A' | 'B' | null>(null);
  const [showTranslations, setShowTranslations] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Find the selected difficulty group
  const selectedDifficultyGroup = dialogSet?.dialogues?.find(group => group.level === selectedDifficulty);
  // Get the selected dialog array
  const selectedDialogArray = selectedDialogIndex !== null && selectedDifficultyGroup ? 
    selectedDifficultyGroup.dialogues[selectedDialogIndex] : null;
  
  useEffect(() => {
    const fetchDialogSet = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/dialogs/${lessonId}`);
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить диалоги');
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Не удалось загрузить диалоги');
        }
        
        setDialogSet(data.dialogSet);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDialogSet();
  }, [lessonId]);
  
  const handleDifficultySelect = (difficulty: DialogDifficulty) => {
    setSelectedDifficulty(difficulty);
    setSelectedDialogIndex(null);
    setSelectedRole(null);
  };
  
  const handleDialogSelect = (dialogIndex: number) => {
    setSelectedDialogIndex(dialogIndex);
    setSelectedRole(null);
  };
  
  const handleRoleSelect = (role: 'A' | 'B') => {
    setSelectedRole(role);
  };
  
  const handleBack = () => {
    if (selectedRole) {
      setSelectedRole(null);
    } else if (selectedDialogIndex !== null) {
      setSelectedDialogIndex(null);
    } else if (selectedDifficulty) {
      router.push('/dialogs');
    }
  };
  
  const toggleTranslations = () => {
    setShowTranslations(!showTranslations);
  };
  
  const renderContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={4}>
          <Card sx={{ bgcolor: 'error.light', mb: 2, width: '100%', maxWidth: 600 }}>
            <CardContent>
              <Typography variant="h6" color="error.dark" gutterBottom>Ошибка</Typography>
              <Typography color="error.dark">{error}</Typography>
            </CardContent>
          </Card>
          <Button 
            onClick={() => router.push('/dialogs')}
            variant="contained" 
            color="primary"
            startIcon={<ArrowBackIcon />}
          >
            Вернуться к списку диалогов
          </Button>
        </Box>
      );
    }
    
    if (!dialogSet) {
      return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={4}>
          <Card sx={{ bgcolor: 'warning.light', mb: 2, width: '100%', maxWidth: 600 }}>
            <CardContent>
              <Typography color="warning.dark">Диалоги для урока {lessonId} не найдены</Typography>
            </CardContent>
          </Card>
          <Button 
            onClick={() => router.push('/dialogs')}
            variant="contained" 
            color="primary"
            startIcon={<ArrowBackIcon />}
          >
            Вернуться к списку диалогов
          </Button>
        </Box>
      );
    }
    
    return (
      <Box>
        <Box display="flex" alignItems="center" mb={2}>
          <Button 
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            sx={{ mr: 2 }}
          >
            Назад
          </Button>
          <Typography variant="h4" component="h1">
            Диалоги к уроку {lessonId}
          </Typography>
          <Chip 
            label={`Уровень ${dialogSet.level}`} 
            color="primary" 
            size="small" 
            sx={{ ml: 2 }}
          />
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Шаг 1: Выбор сложности диалога */}
        {selectedDialogIndex === null && (
          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              Выберите сложность диалога
            </Typography>
            
            <Grid container spacing={3}>
              {dialogSet.dialogues?.map((difficultyGroup) => (
                <Grid item xs={12} sm={6} md={4} key={difficultyGroup.level}>
                  <Card 
                    onClick={() => handleDifficultySelect(difficultyGroup.level as DialogDifficulty)}
                    sx={{ 
                      p: 2, 
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      bgcolor: selectedDifficulty === difficultyGroup.level ? 'primary.light' : 'background.paper',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6
                      }
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      {difficultyGroup.level === 'easy' ? 'Легкие диалоги' : 
                       difficultyGroup.level === 'medium' ? 'Средние диалоги' : 
                       'Сложные диалоги'}
                    </Typography>
                    <Typography color="text.secondary">
                      {difficultyGroup.dialogues?.length || 0} диалогов
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {/* Шаг 2: Выбор конкретного диалога */}
            {selectedDifficultyGroup && (
              <Box mt={4}>
                <Typography variant="h5" component="h2" gutterBottom>
                  {selectedDifficulty === 'easy' ? 'Легкие диалоги' :
                   selectedDifficulty === 'medium' ? 'Средние диалоги' :
                   'Сложные диалоги'}
                </Typography>
                
                <Grid container spacing={2}>
                  {selectedDifficultyGroup.dialogues.map((dialog, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={`dialog-${selectedDifficulty}-${index}`}>
                      <Card 
                        onClick={() => handleDialogSelect(index)}
                        sx={{ 
                          p: 2, 
                          cursor: 'pointer',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 6
                          }
                        }}
                      >
                        <Typography variant="h6">Диалог {index + 1}</Typography>
                        <Typography color="text.secondary">
                          {dialog.length} реплик
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
        )}
        
        {/* Шаг 3: Выбор роли */}
        {selectedDialogIndex !== null && !selectedRole && (
          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              Диалог {selectedDialogIndex + 1} - Выберите роль
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Card 
                  onClick={() => handleRoleSelect('A')}
                  sx={{ 
                    p: 3, 
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    }
                  }}
                >
                  <Typography variant="h6" gutterBottom>Роль A</Typography>
                  <Typography color="text.secondary">
                    Вы будете говорить за первого собеседника
                  </Typography>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Card 
                  onClick={() => handleRoleSelect('B')}
                  sx={{ 
                    p: 3, 
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    }
                  }}
                >
                  <Typography variant="h6" gutterBottom>Роль B</Typography>
                  <Typography color="text.secondary">
                    Вы будете говорить за второго собеседника
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {/* Шаг 4: Отображение диалога с выбранной ролью */}
        {selectedDialogIndex !== null && selectedRole && selectedDialogArray && (
          <Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h5" component="h2">
                Диалог {selectedDialogIndex + 1} - Роль {selectedRole}
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={showTranslations} 
                    onChange={toggleTranslations}
                    color="primary"
                  />
                }
                label={
                  <Box display="flex" alignItems="center">
                    <TranslateIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">Показать переводы</Typography>
                  </Box>
                }
              />
            </Box>
            
            <Paper sx={{ p: 3, mb: 3 }}>
              {selectedDialogArray.map((line, index) => (
                <Box 
                  key={index} 
                  mb={3}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: line.name === selectedRole ? 'primary.light' : 'background.paper',
                    border: '1px solid',
                    borderColor: line.name === selectedRole ? 'primary.main' : 'divider'
                  }}
                >
                  <Box display="flex" alignItems="center" mb={1}>
                    <Typography 
                      variant="subtitle1" 
                      fontWeight={line.name === selectedRole ? 'bold' : 'normal'}
                      color={line.name === selectedRole ? 'primary.dark' : 'text.secondary'}
                      mr={1}
                    >
                      {line.name}:
                    </Typography>
                    <Typography variant="body1">
                      {line.russian}
                    </Typography>
                  </Box>
                  
                  {(showTranslations || line.name !== selectedRole) && (
                    <Box 
                      ml={4} 
                      p={1} 
                      borderLeft={2} 
                      borderColor="divider"
                    >
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontStyle: 'italic' }}
                      >
                        {line.english}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </Paper>
            
            <Box display="flex" justifyContent="center" mt={4}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setSelectedRole(null)}
                sx={{ mr: 2 }}
              >
                Выбрать другую роль
              </Button>
              <Button
                variant="outlined"
                onClick={() => setSelectedDialogIndex(null)}
              >
                Выбрать другой диалог
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    );
  };
  
  return (
    <ClientLayout>
      {renderContent()}
    </ClientLayout>
  );
}
