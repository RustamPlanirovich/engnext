import { NextRequest, NextResponse } from 'next/server';
import { getLesson } from '@/utils/serverUtils';
import { isAdmin } from '@/utils/profileUtils';
import fs from 'fs';
import path from 'path';

// GET /api/admin/lessons/[id] - Get a specific lesson for editing (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    
    // Проверяем, что запрашивающий пользователь является администратором
    if (!profileId || !isAdmin(profileId)) {
      return NextResponse.json(
        { error: 'Доступ запрещен. Требуются права администратора.' },
        { status: 403 }
      );
    }
    
    let lessonId = params.id;
    
    if (!lessonId) {
      return NextResponse.json(
        { error: 'Отсутствует ID урока' },
        { status: 400 }
      );
    }
    
    // Пути к файлам уроков (в проекте есть две директории с уроками)
    const LESSONS_DIR = path.join(process.cwd(), 'lessons'); // Для уроков 36-50
    const DATA_LESSONS_DIR = path.join(process.cwd(), 'data', 'lessons'); // Для уроков 1-9
    
    // Обработка разных форматов ID урока (lesson1, lesson1.json, 1)
    let lessonPath = null;
    
    // Формируем возможные пути к файлу
    const possiblePaths = [];
    
    // Если ID уже содержит 'lesson' префикс
    if (lessonId.startsWith('lesson')) {
      // Формат 'lesson1'
      possiblePaths.push(path.join(LESSONS_DIR, `${lessonId}.json`));
      possiblePaths.push(path.join(DATA_LESSONS_DIR, `${lessonId}.json`));
      
      // Если ID уже содержит .json
      if (lessonId.endsWith('.json')) {
        possiblePaths.push(path.join(LESSONS_DIR, lessonId));
        possiblePaths.push(path.join(DATA_LESSONS_DIR, lessonId));
      }
    } else {
      // Если ID в числовом формате (например, '1')
      possiblePaths.push(path.join(LESSONS_DIR, `lesson${lessonId}.json`));
      possiblePaths.push(path.join(DATA_LESSONS_DIR, `lesson${lessonId}.json`));
    }
    
    // Проверяем все возможные пути
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        lessonPath = possiblePath;
        break;
      }
    }
    
    // Если файл не найден ни в одном из мест
    if (!lessonPath) {
      return NextResponse.json(
        { error: `Урок не найден: ${lessonId}. Проверены пути: ${possiblePaths.join(', ')}` },
        { status: 404 }
      );
    }
    
    // Сохраняем правильный ID для использования в других частях кода
    lessonId = path.basename(lessonPath, '.json');
    
    // Читаем содержимое файла
    const lessonContent = fs.readFileSync(lessonPath, 'utf8');
    
    return NextResponse.json({ 
      success: true,
      lessonContent
    });
  } catch (error) {
    console.error('Error fetching lesson for editing:', error);
    return NextResponse.json(
      { error: 'Не удалось получить урок для редактирования' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/lessons/[id] - Update a specific lesson (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    
    // Проверяем, что запрашивающий пользователь является администратором
    if (!profileId || !isAdmin(profileId)) {
      return NextResponse.json(
        { error: 'Доступ запрещен. Требуются права администратора.' },
        { status: 403 }
      );
    }
    
    let lessonId = params.id;
    
    if (!lessonId) {
      return NextResponse.json(
        { error: 'Отсутствует ID урока' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    if (!data.lessonContent) {
      return NextResponse.json(
        { error: 'Отсутствует содержимое урока' },
        { status: 400 }
      );
    }
    
    // Проверяем валидность JSON
    try {
      JSON.parse(data.lessonContent);
    } catch (e) {
      return NextResponse.json(
        { error: 'Невалидный JSON формат' },
        { status: 400 }
      );
    }
    
    // Пути к файлам уроков (в проекте есть две директории с уроками)
    const LESSONS_DIR = path.join(process.cwd(), 'lessons'); // Для уроков 36-50
    const DATA_LESSONS_DIR = path.join(process.cwd(), 'data', 'lessons'); // Для уроков 1-9
    
    // Обработка разных форматов ID урока (lesson1, lesson1.json, 1)
    let lessonPath = null;
    
    // Формируем возможные пути к файлу
    const possiblePaths = [];
    
    // Если ID уже содержит 'lesson' префикс
    if (lessonId.startsWith('lesson')) {
      // Формат 'lesson1'
      possiblePaths.push(path.join(LESSONS_DIR, `${lessonId}.json`));
      possiblePaths.push(path.join(DATA_LESSONS_DIR, `${lessonId}.json`));
      
      // Если ID уже содержит .json
      if (lessonId.endsWith('.json')) {
        possiblePaths.push(path.join(LESSONS_DIR, lessonId));
        possiblePaths.push(path.join(DATA_LESSONS_DIR, lessonId));
      }
    } else {
      // Если ID в числовом формате (например, '1')
      possiblePaths.push(path.join(LESSONS_DIR, `lesson${lessonId}.json`));
      possiblePaths.push(path.join(DATA_LESSONS_DIR, `lesson${lessonId}.json`));
    }
    
    // Проверяем все возможные пути
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        lessonPath = possiblePath;
        break;
      }
    }
    
    // Если файл не найден ни в одном из мест
    if (!lessonPath) {
      return NextResponse.json(
        { error: `Урок не найден: ${lessonId}. Проверены пути: ${possiblePaths.join(', ')}` },
        { status: 404 }
      );
    }
    
    // Сохраняем правильный ID для использования в других частях кода
    lessonId = path.basename(lessonPath, '.json');
    
    // Сохраняем обновленное содержимое файла
    fs.writeFileSync(lessonPath, data.lessonContent);
    
    return NextResponse.json({ 
      success: true,
      message: 'Урок успешно обновлен'
    });
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json(
      { error: 'Не удалось обновить урок' },
      { status: 500 }
    );
  }
}
