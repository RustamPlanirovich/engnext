import { notFound } from 'next/navigation';
import { Typography, Box, Card, CardContent, CardActions, Button, Grid } from '@mui/material';
import ClientLayout from '@/components/ClientLayout';
import { fetchLesson } from '@/utils/clientUtils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface LessonPageProps {
  params: {
    lessonId: string;
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { lessonId } = params;
  let lesson;
  
  try {
    const response = await fetchLesson(lessonId);
    lesson = response.lesson;
    
    if (!lesson) {
      notFound();
    }
    
  } catch (error) {
    console.error(`Error fetching lesson ${lessonId}:`, error);
    notFound();
  }

  const exerciseTypes = [
    {
      id: 'en-to-ru-typing',
      title: 'Английский → Русский (ввод)',
      description: 'Предложение показывается на английском - нужно вручную ввести на русском',
      color: 'primary',
    },
    {
      id: 'ru-to-en-typing',
      title: 'Русский → Английский (ввод)',
      description: 'Предложение показывается на русском - нужно вручную ввести на английском',
      color: 'secondary',
    },
    {
      id: 'en-to-ru-blocks',
      title: 'Английский → Русский (блоки)',
      description: 'Предложение показывается на английском - нужно из блоков с русскими словами составить предложение',
      color: 'info',
    },
    {
      id: 'ru-to-en-blocks',
      title: 'Русский → Английский (блоки)',
      description: 'Предложение показывается на русском - нужно из блоков с английскими словами составить предложение',
      color: 'success',
    },
  ];

  return (
    <ClientLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {lesson.concept}
        </Typography>
        <Typography variant="body1" paragraph>
          {lesson.explanation}
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Выберите тип упражнения:
        </Typography>

        <Grid container spacing={3}>
          {exerciseTypes.map((type) => (
            <Grid item xs={12} sm={6} key={type.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {type.title}
                  </Typography>
                  <Typography variant="body2">
                    {type.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Link href={`/lessons/${lessonId}/exercise/${type.id}`} passHref style={{ width: '100%' }}>
                    <Button 
                      variant="contained" 
                      color={type.color as any} 
                      fullWidth
                    >
                      Начать упражнение
                    </Button>
                  </Link>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </ClientLayout>
  );
}
