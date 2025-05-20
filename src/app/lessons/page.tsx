import { Typography, Grid, Card, CardContent, CardActions, Button, Box } from '@mui/material';
import ClientLayout from '@/components/ClientLayout';
import { fetchLessons } from '@/utils/clientUtils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function LessonsPage() {
  // Fetch lessons from the API
  const response = await fetchLessons();
  const lessons = response.lessons;

  return (
    <ClientLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Доступные уроки
        </Typography>
        <Typography variant="body1" gutterBottom>
          Выберите урок для изучения и практики
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {lessons.map((lesson) => (
          <Grid item xs={12} sm={6} md={4} key={lesson.id}>
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
                <Typography variant="h6" component="h2" gutterBottom>
                  {lesson.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {lesson.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Link href={`/lessons/${lesson.id}`} passHref style={{ width: '100%' }}>
                  <Button variant="contained" color="primary" fullWidth>
                    Начать урок
                  </Button>
                </Link>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </ClientLayout>
  );
}
