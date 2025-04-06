import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.ASSEMBLYAI_API_KEY;
const BASE_URL = 'https://api.assemblyai.com/v2';

/**
 * Uploads an audio file to AssemblyAI
 * @param audioFilePathOrContent Path to the audio file, URL, or base64 content
 * @returns The upload URL
 */
async function uploadAudio(audioFilePathOrContent: string): Promise<string> {
  let audioData: Buffer | string;
  let isBase64 = false;

  // Check if input is a URL
  if (audioFilePathOrContent.startsWith('http')) {
    return audioFilePathOrContent; // AssemblyAI accepts direct URLs
  }

  // Check if it's a base64 string (starting with data: or very long without file path characters)
  if (audioFilePathOrContent.length > 1000 && !audioFilePathOrContent.includes('/')) {
    audioData = audioFilePathOrContent;
    isBase64 = true;
  } else {
    // Assume it's a file path
    const filePath = path.isAbsolute(audioFilePathOrContent) 
      ? audioFilePathOrContent
      : path.join(process.cwd(), audioFilePathOrContent);
      
    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file does not exist: ${filePath}`);
    }
    
    audioData = fs.readFileSync(filePath);
  }

  // Convert base64 to buffer if needed
  if (isBase64) {
    // Remove potential data URI prefix (e.g., "data:audio/wav;base64,")
    const base64Data = audioFilePathOrContent.split(',')[1] || audioFilePathOrContent;
    audioData = Buffer.from(base64Data, 'base64');
  }

  try {
    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'authorization': API_KEY,
        'content-type': 'application/octet-stream',
      },
      body: audioData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AssemblyAI upload failed: ${response.status} - ${errorText}`);
    }

    const { upload_url } = await response.json() as { upload_url: string };
    return upload_url;
  } catch (error) {
    console.error('Error uploading audio to AssemblyAI:', error);
    throw error;
  }
}

/**
 * Transcribes audio using AssemblyAI
 * @param audioFilePathOrUrl Path to the audio file, URL, or base64 content
 * @returns Transcript of the audio
 */
export async function transcribeAudio(audioFilePathOrUrl: string): Promise<string> {
  try {
    console.log('Starting AssemblyAI transcription process');
    
    // Get upload URL (if it's already a URL, this function will return it)
    const uploadUrl = await uploadAudio(audioFilePathOrUrl);
    console.log('Audio prepared for transcription:', uploadUrl.substring(0, 50) + '...');

    // Create transcription job
    const transcriptionResponse = await fetch(`${BASE_URL}/transcript`, {
      method: 'POST',
      headers: {
        'authorization': API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: uploadUrl,
        language_code: 'en',
      }),
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      throw new Error(`AssemblyAI transcription request failed: ${transcriptionResponse.status} - ${errorText}`);
    }

    const { id } = await transcriptionResponse.json() as { id: string };
    console.log('Transcription job created with ID:', id);

    // Poll for transcription completion
    let transcript = '';
    let isCompleted = false;
    
    while (!isCompleted) {
      // Wait a bit before polling
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pollingResponse = await fetch(`${BASE_URL}/transcript/${id}`, {
        method: 'GET',
        headers: {
          'authorization': API_KEY,
        },
      });

      if (!pollingResponse.ok) {
        const errorText = await pollingResponse.text();
        throw new Error(`AssemblyAI polling failed: ${pollingResponse.status} - ${errorText}`);
      }

      const result = await pollingResponse.json() as { 
        status: string;
        text?: string;
      };
      
      if (result.status === 'completed') {
        isCompleted = true;
        transcript = result.text || '';
        console.log('Transcription completed successfully');
      } else if (result.status === 'error') {
        throw new Error('AssemblyAI transcription failed');
      } else {
        console.log(`Transcription in progress... Status: ${result.status}`);
      }
    }

    return transcript;
  } catch (error) {
    console.error('Error in AssemblyAI transcription process:', error);
    throw error;
  }
}

/**
 * Alternative function to transcribe audio using callback for progress updates
 * @param audioFilePathOrUrl Path to the audio file or URL
 * @param progressCallback Optional callback for progress updates
 * @returns Transcript of the audio
 */
export async function transcribeAudioWithProgress(
  audioFilePathOrUrl: string, 
  progressCallback?: (progress: number, status: string) => void
): Promise<string> {
  try {
    if (progressCallback) progressCallback(0, 'Starting');
    
    const uploadUrl = await uploadAudio(audioFilePathOrUrl);
    if (progressCallback) progressCallback(20, 'Uploaded');

    const transcriptionResponse = await fetch(`${BASE_URL}/transcript`, {
      method: 'POST',
      headers: {
        'authorization': API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: uploadUrl,
        language_code: 'en',
      }),
    });

    if (!transcriptionResponse.ok) {
      throw new Error(`AssemblyAI transcription request failed: ${transcriptionResponse.status}`);
    }

    const { id } = await transcriptionResponse.json() as { id: string };
    if (progressCallback) progressCallback(30, 'Processing');

    let transcript = '';
    let isCompleted = false;
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes maximum wait with 2-second intervals
    
    while (!isCompleted && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
      
      const pollingResponse = await fetch(`${BASE_URL}/transcript/${id}`, {
        method: 'GET',
        headers: {
          'authorization': API_KEY,
        },
      });

      if (!pollingResponse.ok) {
        throw new Error(`AssemblyAI polling failed: ${pollingResponse.status}`);
      }

      const result = await pollingResponse.json() as { 
        status: string;
        text?: string;
        progress?: number;
      };
      
      if (result.status === 'completed') {
        isCompleted = true;
        transcript = result.text || '';
        if (progressCallback) progressCallback(100, 'Completed');
      } else if (result.status === 'error') {
        throw new Error('AssemblyAI transcription failed');
      } else {
        // Report progress
        const progress = Math.min(30 + Math.floor((result.progress || 0) * 0.7), 99);
        if (progressCallback) progressCallback(progress, result.status);
      }
    }

    if (!isCompleted) {
      throw new Error('Transcription timed out after 2 minutes');
    }

    return transcript;
  } catch (error) {
    console.error('Error in AssemblyAI transcription process:', error);
    throw error;
  }
}