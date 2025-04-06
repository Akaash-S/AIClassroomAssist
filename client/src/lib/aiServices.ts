import { apiRequest } from './queryClient';

/**
 * Service functions for interacting with the AI API endpoints
 */

/**
 * Transcribe a lecture audio
 * @param lectureId ID of the lecture
 * @returns Promise with transcription result
 */
export async function transcribeLecture(lectureId: number) {
  return apiRequest<any>({
    url: `/api/transcribe/${lectureId}`,
    method: 'POST'
  });
}

/**
 * Generate a summary of a lecture transcript
 * @param lectureId ID of the lecture
 * @param engine Engine to use for summarization (openai or gemini)
 * @returns Promise with summary result
 */
export async function summarizeLecture(lectureId: number, engine: 'openai' | 'gemini' = 'openai') {
  return apiRequest<any>({
    url: `/api/summarize/${lectureId}?engine=${engine}`,
    method: 'POST'
  });
}

/**
 * Extract tasks from a lecture transcript
 * @param lectureId ID of the lecture
 * @returns Promise with extracted tasks
 */
export async function extractLectureTasks(lectureId: number) {
  return apiRequest<any>({
    url: `/api/extract-tasks/${lectureId}`,
    method: 'POST'
  });
}

/**
 * Generate flashcards from a lecture transcript
 * @param lectureId ID of the lecture
 * @returns Promise with generated flashcards
 */
export async function generateFlashcards(lectureId: number) {
  return apiRequest<any>({
    url: `/api/create-flashcards/${lectureId}`,
    method: 'POST'
  });
}

/**
 * Get a list of tasks for a lecture
 * @param lectureId ID of the lecture
 * @returns Promise with lecture tasks
 */
export async function getLectureTasks(lectureId: number) {
  return apiRequest<any>({
    url: `/api/tasks/lecture/${lectureId}`,
    method: 'GET'
  });
}

/**
 * Get a list of tasks for a course
 * @param courseId ID of the course
 * @returns Promise with course tasks
 */
export async function getCourseTasks(courseId: number) {
  return apiRequest<any>({
    url: `/api/tasks/course/${courseId}`,
    method: 'GET'
  });
}

/**
 * Create a new task
 * @param taskData Task data
 * @returns Promise with created task
 */
export async function createTask(taskData: {
  lectureId: number;
  courseId: number;
  type: string;
  title: string;
  description?: string;
  dueDate?: Date | string;
}) {
  return apiRequest<any>({
    url: '/api/tasks',
    method: 'POST',
    data: taskData
  });
}

/**
 * Update an existing task
 * @param taskId ID of the task
 * @param taskData Updated task data
 * @returns Promise with updated task
 */
export async function updateTask(
  taskId: number,
  taskData: Partial<{
    type: string;
    title: string;
    description?: string;
    dueDate?: Date | string;
  }>
) {
  return apiRequest<any>({
    url: `/api/tasks/${taskId}`,
    method: 'PUT',
    data: taskData
  });
}