'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  ListItemAvatar,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  CircularProgress,
  Paper,
  Container
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { fetchProfiles, createProfile, deleteProfile, setActiveProfile } from '@/utils/clientProfileUtils';
import { setActiveProfileIdLocal } from '@/utils/clientUtils';
import { Profile } from '@/types/lesson';
import ThemeRegistry from '@/components/ThemeRegistry';

export default function ProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [newProfileName, setNewProfileName] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Загрузка профилей при монтировании компонента
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        setLoading(true);
        const data = await fetchProfiles();
        setProfiles(data.profiles || []);
        setActiveProfileId(data.activeProfileId);
        setLoading(false);
      } catch (error) {
        console.error('Error loading profiles:', error);
        setError('Не удалось загрузить профили');
        setLoading(false);
      }
    };
    
    loadProfiles();
  }, []);
  
  // Обработчик создания нового профиля
  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      setError('Имя профиля не может быть пустым');
      return;
    }
    
    try {
      setLoading(true);
      const { profile } = await createProfile(newProfileName);
      setProfiles([...profiles, profile]);
      setNewProfileName('');
      setCreateDialogOpen(false);
      setLoading(false);
    } catch (error) {
      console.error('Error creating profile:', error);
      setError('Не удалось создать профиль');
      setLoading(false);
    }
  };
  
  // Обработчик удаления профиля
  const handleDeleteProfile = async () => {
    if (!profileToDelete) return;
    
    try {
      setLoading(true);
      await deleteProfile(profileToDelete);
      setProfiles(profiles.filter(p => p.id !== profileToDelete));
      setProfileToDelete(null);
      setDeleteDialogOpen(false);
      setLoading(false);
    } catch (error) {
      console.error('Error deleting profile:', error);
      setError('Не удалось удалить профиль');
      setLoading(false);
    }
  };
  
  // Обработчик выбора профиля
  const handleSelectProfile = async (profileId: string) => {
    try {
      setLoading(true);
      await setActiveProfile(profileId);
      setActiveProfileId(profileId);
      setActiveProfileIdLocal(profileId);
      setLoading(false);
      
      // Перенаправление на главную страницу
      router.push('/');
    } catch (error) {
      console.error('Error selecting profile:', error);
      setError('Не удалось выбрать профиль');
      setLoading(false);
    }
  };
  
  return (
    <ThemeRegistry>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 3 }}>
            Выберите профиль
          </Typography>
          
          {error && (
            <Box sx={{ mb: 2 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {profiles.length === 0 ? (
                <Box sx={{ textAlign: 'center', my: 4 }}>
                  <Typography variant="body1" gutterBottom>
                    У вас пока нет профилей. Создайте новый профиль, чтобы начать.
                  </Typography>
                </Box>
              ) : (
                <List sx={{ mb: 3 }}>
                  {profiles.map((profile) => (
                    <Card key={profile.id} sx={{ mb: 2, borderRadius: 2 }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ListItemAvatar>
                            <Avatar>
                              <PersonIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary={profile.name} 
                            secondary={`Последняя активность: ${new Date(profile.lastActiveAt).toLocaleDateString()}`}
                            sx={{ flex: 1 }}
                          />
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button 
                              variant="contained" 
                              color="primary"
                              onClick={() => handleSelectProfile(profile.id)}
                              disabled={loading}
                            >
                              Выбрать
                            </Button>
                            <IconButton 
                              edge="end" 
                              color="error"
                              onClick={() => {
                                setProfileToDelete(profile.id);
                                setDeleteDialogOpen(true);
                              }}
                              disabled={loading}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </List>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateDialogOpen(true)}
                  disabled={loading}
                >
                  Создать новый профиль
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Container>
      
      {/* Диалог создания профиля */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Создать новый профиль</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Введите имя для нового профиля.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Имя профиля"
            fullWidth
            variant="outlined"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} color="inherit">
            Отмена
          </Button>
          <Button onClick={handleCreateProfile} color="primary" variant="contained">
            Создать
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог удаления профиля */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Удалить профиль</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите удалить этот профиль? Все данные профиля, включая прогресс и статистику, будут безвозвратно удалены.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Отмена
          </Button>
          <Button onClick={handleDeleteProfile} color="error" variant="contained">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeRegistry>
  );
}
