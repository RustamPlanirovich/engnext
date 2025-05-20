import { notFound } from 'next/navigation';
import ClientLayout from '@/components/ClientLayout';
import ExerciseComponent from '@/components/ExerciseComponent';
import { fetchLesson, extractExamples } from '@/utils/clientUtils';
import { ExerciseMode } from '@/types/lesson';

export const dynamic = 'force-dynamic';

interface ExercisePageProps {
  params: {
    lessonId: string;
    exerciseType: string;
  };
}

export default async function ExercisePage({ params }: ExercisePageProps) {
  const { lessonId, exerciseType } = params;
  
  // Validate exercise type
  if (!['en-to-ru-typing', 'ru-to-en-typing', 'en-to-ru-blocks', 'ru-to-en-blocks'].includes(exerciseType)) {
    notFound();
  }
  
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
  
  const examples = extractExamples(lesson);
  
  if (examples.length === 0) {
    notFound();
  }

  return (
    <ClientLayout>
      <ExerciseComponent 
        lessonId={lessonId}
        lessonTitle={lesson.concept}
        examples={examples}
        exerciseType={exerciseType as ExerciseMode}
      />
    </ClientLayout>
  );
}
