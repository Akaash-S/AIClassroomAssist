import OpenAI from 'openai';
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';
dotenv.config();
// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

import { createReadStream } from 'fs';
import { Readable } from 'stream';
import { FormData } from 'undici';

/**
 * Transcribe audio using OpenAI's Whisper API
 * @param audioFilePathOrUrl Path to the audio file or a URL
 * @returns Transcript of the audio
 */
export async function transcribeAudio(audioFilePathOrUrl: string): Promise<string> {
  try {
    // Check if the input is a URL (Firebase Storage URLs start with https://)
    const isUrl = audioFilePathOrUrl.startsWith('http');
    let tempFilePath: string | null = null;
    
    if (isUrl) {
      console.log(`Downloading audio from URL: ${audioFilePathOrUrl}`);
      // Download the file from the URL
      const response = await fetch(audioFilePathOrUrl);
      if (!response.ok) {
        throw new Error(`Failed to download audio file: ${response.statusText}`);
      }
      
      // Create a temporary file to store the downloaded content
      const fileExt = path.extname(new URL(audioFilePathOrUrl).pathname) || '.mp3';
      tempFilePath = path.join(os.tmpdir(), `audio_${Date.now()}${fileExt}`);
      
      // Convert response to buffer and write to a temporary file
      const audioBuffer = await response.buffer();
      fs.writeFileSync(tempFilePath, audioBuffer);
      console.log(`Audio downloaded to temporary file: ${tempFilePath}`);
      
      // Create a form with the file
      const formData = new FormData();
      const file = createReadStream(tempFilePath);
      formData.append('file', file);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      
      // Call OpenAI's transcription API directly with fetch for better stream handling
      const openaiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      });
      
      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        throw new Error(`OpenAI API error (${openaiResponse.status}): ${errorText}`);
      }
      
      const result = await openaiResponse.json();
      
      // Cleanup temporary file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
        console.log('Temporary file deleted');
      }
      
      return result.text;
    } else {
      // Use the provided local file path
      console.log(`Reading audio from local file: ${audioFilePathOrUrl}`);
      
      // Create a form with the file
      const formData = new FormData();
      const file = createReadStream(audioFilePathOrUrl);
      formData.append('file', file);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      
      // Call OpenAI's transcription API directly with fetch
      const openaiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      });
      
      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        throw new Error(`OpenAI API error (${openaiResponse.status}): ${errorText}`);
      }
      
      const result = await openaiResponse.json();
      return result.text;
    }
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error(`Failed to transcribe audio: ${(error as Error).message}`);
  }
}

/**
 * Generate a summary of a transcript using OpenAI
 * @param transcript The transcript to summarize
 * @returns Summary of the transcript
 */
export async function summarizeTranscript(transcript: string): Promise<string> {
  try {
    // Call OpenAI's chat completions API to generate a summary
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that summarizes academic lectures. Create a concise summary highlighting key concepts, main points, and important details. The summary should be well-structured with clear sections."
        },
        {
          role: "user",
          content: `Please summarize the following lecture transcript:\n\n${transcript}`
        }
      ],
      max_tokens: 1000,
    });
    
    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error summarizing transcript:", error);
    throw new Error(`Failed to summarize transcript: ${(error as Error).message}`);
  }
}

/**
 * Extract tasks and dates from a transcript
 * @param transcript The transcript to extract tasks from
 * @returns Array of tasks with their details
 */
export async function extractTasks(transcript: string, lectureId: number, courseId: number): Promise<Array<{
  title: string;
  description: string;
  dueDate: string | null;
  type: string;
  lectureId: number;
  courseId: number;
}>> {
  try {
    // Enhanced system prompt for better task extraction
    const systemPrompt = `
    You are an AI assistant specializing in extracting academic tasks from lecture transcripts. 
    
    Carefully analyze the transcript for these task types:
    - Assignments (written work, papers, essays)
    - Homework (problem sets, exercises)
    - Quizzes (in-class or online assessments)
    - Exams (midterms, finals)
    - Projects (individual or group)
    - Readings (textbook chapters, articles)
    - Presentations
    - Lab work
    
    For each task you find, extract:
    1. A clear, descriptive title
    2. A detailed description that explains what students need to do
    3. The specific due date in YYYY-MM-DD format (use today's context to infer dates when only days or relative timeframes are mentioned)
    4. The task type from the list above
    
    Pay special attention to:
    - Dates mentioned in context of submissions (including phrases like "due next week", "by Friday", "before the break")
    - Academic-related keywords: "submit", "turn in", "deadline", "complete", "prepare", "study for"
    - Grading-related language: "worth x points", "x% of final grade", "required for passing"
    `;
    
    // Call OpenAI's chat completions API to extract tasks
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Extract all academic tasks mentioned in this lecture transcript. For each task, provide a title, detailed description, type (assignment, quiz, homework, etc.), and due date (if mentioned).\n\nEven if due dates are mentioned vaguely (like "next week" or "by Friday"), try to convert them to actual dates based on the current date being ${new Date().toISOString().slice(0, 10)}.\n\nFormat your response as a JSON object with a "tasks" array where each item has: title, description, dueDate (in YYYY-MM-DD format or null if no date), and type fields.\n\nTranscript:\n${transcript}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2, // Lower temperature for more consistent output
      max_tokens: 2000, // Allow more tokens for detailed extraction
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      return [];
    }
    
    try {
      const extractedData = JSON.parse(content);
      
      // Process the tasks 
      const tasks = Array.isArray(extractedData) ? extractedData : 
                  (extractedData.tasks && Array.isArray(extractedData.tasks)) ? extractedData.tasks : [];
      
      console.log(`Extracted ${tasks.length} tasks from transcript`);
      
      // Add lectureId and courseId to each task and clean up data
      return tasks.map((task: any) => ({
        title: task.title || "Untitled Task",
        description: task.description || "",
        dueDate: task.dueDate && task.dueDate !== "null" ? task.dueDate : null,
        type: task.type || "assignment",
        lectureId,
        courseId,
      }));
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.log("Raw content received:", content);
      return [];
    }
  } catch (error) {
    console.error("Error extracting tasks:", error);
    throw new Error(`Failed to extract tasks: ${(error as Error).message}`);
  }
}