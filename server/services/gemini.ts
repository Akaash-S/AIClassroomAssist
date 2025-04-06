import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();
// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

// Gemini model name
const MODEL_NAME = 'gemini-pro';

/**
 * Generate a summary of a transcript using Google's Gemini API
 * @param transcript The transcript to summarize
 * @returns Summary of the transcript
 */
export async function generateSummary(transcript: string): Promise<string> {
  try {
    // Get the model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    // Prepare the prompt
    const prompt = `
      Please summarize the following lecture transcript concisely. Focus on key concepts, 
      main points, and important details. Your summary should be well-structured with clear sections.
      
      Transcript:
      ${transcript}
    `;
    
    // Generate the content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error("Error generating summary with Gemini:", error);
    throw new Error(`Failed to generate summary: ${(error as Error).message}`);
  }
}

/**
 * Create flashcards from a transcript
 * @param transcript The transcript to create flashcards from
 * @returns Array of flashcards with question and answer
 */
export async function createFlashcards(transcript: string): Promise<Array<{ question: string; answer: string }>> {
  try {
    // Get the model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    // Prepare the prompt
    const prompt = `
      Create a set of educational flashcards based on the following lecture transcript.
      Each flashcard should have a question on one side and the answer on the other.
      Focus on key concepts, definitions, and important facts from the lecture.
      
      Format your response as a JSON object with an array of flashcards, where each flashcard has
      'question' and 'answer' fields.
      
      Transcript:
      ${transcript}
    `;
    
    // Generate the content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      // Try to parse the response as JSON
      const parsedResponse = JSON.parse(text);
      if (Array.isArray(parsedResponse.flashcards)) {
        return parsedResponse.flashcards;
      } else if (Array.isArray(parsedResponse)) {
        return parsedResponse;
      }
      return [];
    } catch (parseError) {
      console.error("Error parsing flashcards JSON:", parseError);
      return [];
    }
  } catch (error) {
    console.error("Error creating flashcards with Gemini:", error);
    throw new Error(`Failed to create flashcards: ${(error as Error).message}`);
  }
}