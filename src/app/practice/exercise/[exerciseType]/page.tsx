'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ClientLayout from '@/components/ClientLayout';
import ExerciseComponent from '@/components/ExerciseComponent';
import { getMostProblematicSentences, getActiveProfileId } from '@/utils/clientUtils';
import { Example, ExerciseMode, AnalyticsItem } from '@/types/lesson';
import { Box, CircularProgress, Typography } from '@mui/material';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PracticeExercisePageProps {
  params: {
    exerciseType: string;
  };
}

export default function PracticeExercisePage({ params }: PracticeExercisePageProps) {
  const { exerciseType } = params;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [examples, setExamples] = useState<Example[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Validate exercise type
        if (!['en-to-ru-typing', 'ru-to-en-typing', 'en-to-ru-blocks', 'ru-to-en-blocks'].includes(exerciseType)) {
          router.push('/practice');
          return;
        }
        
        // Получаем ID активного профиля из localStorage
        const activeProfileId = getActiveProfileId();
        console.log('Active profile ID:', activeProfileId);
        
        // Получаем предложения с ошибками
        const problematicSentences = await getMostProblematicSentences(10, activeProfileId || undefined);
        console.log('Problematic sentences for exercise:', problematicSentences);
        
        if (problematicSentences.length === 0) {
          router.push('/practice');
          return;
        }
        
        // Convert problematic sentences to examples format
        const examplesData: Example[] = problematicSentences.map((item: AnalyticsItem) => {
          return {
            english: item.sentence.english,
            russian: item.sentence.russian,
            source: ''
          };
        });
        
        setExamples(examplesData);
      } catch (error) {
        console.error('Error fetching practice data:', error);
        router.push('/practice');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [exerciseType, router]);

  if (loading) {
    return (
      <ClientLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">
            Загрузка упражнений...
          </Typography>
        </Box>
      </ClientLayout>
    );
  }

  if (examples.length === 0) {
    return (
      <ClientLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
          <Typography variant="h6">
            Нет предложений для повторения
          </Typography>
        </Box>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <ExerciseComponent 
        lessonId="practice"
        lessonTitle="Повторение сложных предложений"
        examples={examples}
        exerciseType={exerciseType as ExerciseMode}
      />
    </ClientLayout>
  );
}
