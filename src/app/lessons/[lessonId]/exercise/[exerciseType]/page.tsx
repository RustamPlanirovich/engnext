'use client';

import { notFound, useSearchParams } from 'next/navigation';
import ClientLayout from '@/components/ClientLayout';
import ExerciseComponent from '@/components/ExerciseComponent';
import { fetchLesson, extractExamples } from '@/utils/clientUtils';
import { ExerciseMode } from '@/types/lesson';
import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

interface ExercisePageProps {
  params: {
    lessonId: string;
    exerciseType: string;
  };
}

export default function ExercisePage({ params }: ExercisePageProps) {
  const { lessonId, exerciseType } = params;
  const searchParams = useSearchParams();
  const isRepetition = searchParams.get('isRepetition') === 'true';
  
  const [lesson, setLesson] = useState<any>(null);
  const [examples, setExamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Validate exercise type
  useEffect(() => {
    if (!['en-to-ru-typing', 'ru-to-en-typing', 'en-to-ru-blocks', 'ru-to-en-blocks'].includes(exerciseType)) {
      notFound();
    }
    
    const loadLesson = async () => {
      try {
        setLoading(true);
        const response = await fetchLesson(lessonId);
        
        if (!response.lesson) {
          setError('Урок не найден');
          return;
        }
        
        setLesson(response.lesson);
        const extractedExamples = extractExamples(response.lesson);
        
        if (extractedExamples.length === 0) {
          setError('В уроке нет примеров');
          return;
        }
        
        setExamples(extractedExamples);
      } catch (error) {
        console.error(`Error fetching lesson ${lessonId}:`, error);
        setError('Ошибка при загрузке урока');
      } finally {
        setLoading(false);
      }
    };
    
    loadLesson();
  }, [lessonId, exerciseType]);
  
  if (loading) {
    return (
      <ClientLayout>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <div>Загрузка упражнения...</div>
        </div>
      </ClientLayout>
    );
  }
  
  if (error) {
    return (
      <ClientLayout>
        <div style={{ padding: '2rem' }}>
          <h2>Ошибка</h2>
          <p>{error}</p>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      {lesson && examples.length > 0 && (
        <ExerciseComponent 
          lessonId={lessonId}
          lessonTitle={lesson.concept}
          examples={examples}
          exerciseType={exerciseType as ExerciseMode}
          isRepetition={isRepetition}
        />
      )}
    </ClientLayout>
  );
}
