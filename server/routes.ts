import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { insertLectureSchema, insertCourseSchema, insertEnrollmentSchema, insertStudentProgressSchema, insertUserSchema, insertTaskSchema, lectures } from "@shared/schema";
import express from "express";
import fs from "fs";
import path from "path";
import os from "os";
import { z } from "zod";
import { summarizeTranscript, extractTasks } from "./services/openai";
import { transcribeAudio } from "./services/assemblyai";
import { generateSummary, createFlashcards } from "./services/gemini";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, getCalendarEvents } from "./services/googleCalendar";

// Helper function to validate request body
function validateBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown
): z.infer<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new Error(`Invalid request body: ${result.error.message}`);
  }
  return result.data;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Audio upload directory
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  console.log(`Uploads directory: ${uploadsDir}`);
  if (!fs.existsSync(uploadsDir)) {
    console.log(`Creating uploads directory at: ${uploadsDir}`);
    fs.mkdirSync(uploadsDir, { recursive: true });
  } else {
    console.log(`Uploads directory already exists`);
  }

  // Serve uploaded files
  app.use("/uploads", express.static(uploadsDir));

  // API Routes
  // User routes
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const newUser = validateBody(insertUserSchema, req.body);
      const user = await storage.createUser(newUser);
      return res.status(201).json(user);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  });
  
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await storage.getUser(parseInt(id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(user);
  });

  app.get("/api/users/uid/:uid", async (req: Request, res: Response) => {
    const { uid } = req.params;
    const user = await storage.getUserByUid(uid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(user);
  });

  // Lecture routes
  app.get("/api/lectures", async (req: Request, res: Response) => {
    const { teacherId, courseId } = req.query;
    
    let lectures = [];
    if (teacherId) {
      lectures = await storage.getLecturesByTeacher(parseInt(teacherId as string));
    } else if (courseId) {
      lectures = await storage.getLecturesByCourse(parseInt(courseId as string));
    } else {
      return res.status(400).json({ message: "Missing required query parameter: teacherId or courseId" });
    }
    
    return res.json(lectures);
  });

  app.get("/api/lectures/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const lecture = await storage.getLecture(parseInt(id));
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }
    return res.json(lecture);
  });

  app.post("/api/lectures", express.json({ limit: '100mb' }), async (req: Request, res: Response) => {
    try {
      // Extract audio data if available
      let { audioUrl, audioContent, audioType, ...lectureData } = req.body;
      
      // Validate the core lecture data
      const newLecture = validateBody(insertLectureSchema, lectureData);
      
      // First create the lecture
      const lecture = await storage.createLecture(newLecture);
      
      // If audio data is provided, update the lecture with it
      if (audioUrl || audioContent) {
        console.log(`Updating lecture ${lecture.id} with audio data`);
        await storage.updateLecture(lecture.id, {
          audioUrl: audioUrl || null,
          audioContent: audioContent || null,
          audioType: audioType || 'audio/mp3',
          status: "draft",
          processingStatus: "pending"
        });
        console.log(`Lecture ${lecture.id} updated with audio data`);
      }
      
      // Get the updated lecture with audio data
      const updatedLecture = await storage.getLecture(lecture.id);
      return res.status(201).json(updatedLecture);
    } catch (error) {
      console.error("Error creating lecture:", error);
      return res.status(400).json({ message: (error as Error).message });
    }
  });

  app.put("/api/lectures/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const updatedLecture = await storage.updateLecture(parseInt(id), req.body);
      if (!updatedLecture) {
        return res.status(404).json({ message: "Lecture not found" });
      }
      return res.json(updatedLecture);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  });

  // Course routes
  app.get("/api/courses", async (req: Request, res: Response) => {
    const { teacherId } = req.query;
    
    if (!teacherId) {
      return res.status(400).json({ message: "Missing required query parameter: teacherId" });
    }
    
    const courses = await storage.getCoursesByTeacher(parseInt(teacherId as string));
    return res.json(courses);
  });

  app.get("/api/courses/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const course = await storage.getCourse(parseInt(id));
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    return res.json(course);
  });

  app.post("/api/courses", async (req: Request, res: Response) => {
    try {
      const newCourse = validateBody(insertCourseSchema, req.body);
      const course = await storage.createCourse(newCourse);
      return res.status(201).json(course);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  });

  // Enrollment routes
  app.get("/api/enrollments", async (req: Request, res: Response) => {
    const { studentId, courseId } = req.query;
    
    let enrollments = [];
    if (studentId) {
      enrollments = await storage.getEnrollmentsByStudent(parseInt(studentId as string));
    } else if (courseId) {
      enrollments = await storage.getEnrollmentsByCourse(parseInt(courseId as string));
    } else {
      return res.status(400).json({ message: "Missing required query parameter: studentId or courseId" });
    }
    
    return res.json(enrollments);
  });

  app.post("/api/enrollments", async (req: Request, res: Response) => {
    try {
      const newEnrollment = validateBody(insertEnrollmentSchema, req.body);
      const enrollment = await storage.createEnrollment(newEnrollment);
      return res.status(201).json(enrollment);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  });

  // Student progress routes
  app.get("/api/progress", async (req: Request, res: Response) => {
    const { studentId, lectureId } = req.query;
    
    if (studentId && lectureId) {
      const progress = await storage.getProgressByStudentAndLecture(
        parseInt(studentId as string),
        parseInt(lectureId as string)
      );
      return res.json(progress || null);
    } else if (studentId) {
      const progress = await storage.getProgressByStudent(parseInt(studentId as string));
      return res.json(progress);
    } else {
      return res.status(400).json({ message: "Missing required query parameter: studentId" });
    }
  });

  app.post("/api/progress", async (req: Request, res: Response) => {
    try {
      const newProgress = validateBody(insertStudentProgressSchema, req.body);
      const progress = await storage.createStudentProgress(newProgress);
      return res.status(201).json(progress);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  });

  app.put("/api/progress/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const updatedProgress = await storage.updateStudentProgress(parseInt(id), req.body);
      if (!updatedProgress) {
        return res.status(404).json({ message: "Progress record not found" });
      }
      return res.json(updatedProgress);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  });

  // Audio metadata route - for handling database audio storage
  app.post("/api/upload-audio", express.json({ limit: '100mb' }), async (req, res) => {
    try {
      console.log('Audio metadata upload request received');
      console.log(`Request body: ${JSON.stringify(req.body, null, 2)}`);
      
      // Validate request
      if (!req.body || !req.body.audioUrl) {
        console.error('Missing audio data in request');
        return res.status(400).json({ 
          message: "Missing required audio data",
          error: "Request is missing audioUrl field"
        });
      }
      
      const { audioUrl, audioContent, audioType, lectureId } = req.body;
      
      console.log(`Audio URL: ${audioUrl}`);
      console.log(`Audio content length: ${audioContent?.length || 0} characters`);
      console.log(`Audio type: ${audioType || 'audio/mp3'}`);
      console.log(`Lecture ID: ${lectureId || 'Not provided'}`);
      
      // If lecture ID is available, update the lecture with audio content in the database
      if (lectureId) {
        try {
          console.log(`Looking up lecture with ID: ${lectureId}`);
          const lecture = await storage.getLecture(parseInt(lectureId));
          
          if (lecture) {
            console.log(`Found lecture: ${lecture.title}, updating with audio data in database`);
            
            // Update directly using db.update to ensure correct column names (snake_case)
            const [updatedLecture] = await db.update(lectures)
              .set({
                audio_url: audioUrl,
                audio_content: audioContent,
                audio_type: audioType || 'audio/mp3',
                status: "draft",
                processing_status: "pending"
              })
              .where(eq(lectures.id, parseInt(lectureId)))
              .returning();
            
            console.log(`Lecture updated directly. ID: ${updatedLecture.id}`);
            
            // Verify the update was successful by checking content length
            console.log(`Verifying audio content - Length: ${updatedLecture.audio_content?.length || 0} characters`);
            
            if (!updatedLecture.audio_content && audioContent) {
              console.log('Audio content may not have been stored properly. Trying again with a second approach...');
              
              // Log all column details for debugging
              console.log(`DEBUG - Updated lecture details: 
                ID: ${updatedLecture.id}
                Title: ${updatedLecture.title}
                Has audio_content: ${Boolean(updatedLecture.audio_content)}
                Has audio_url: ${Boolean(updatedLecture.audio_url)}
              `);
              
              // Try one more time with a different approach
              await db.execute(`
                UPDATE lectures 
                SET audio_content = $1, audio_url = $2, audio_type = $3 
                WHERE id = $4
              `, [audioContent, audioUrl, audioType || 'audio/mp3', parseInt(lectureId)]);
              
              console.log('Secondary update attempt completed.');
            }
            
            // Print final status
            const checkLecture = await storage.getLecture(parseInt(lectureId));
            console.log(`Final check - Audio content length: ${checkLecture.audioContent?.length || 0}`);
          } else {
            console.log(`Lecture with ID ${lectureId} not found`);
          }
        } catch (dbErr) {
          console.error("Error updating lecture with audio content:", dbErr);
          return res.status(500).json({ 
            message: "Failed to update lecture with audio data", 
            error: dbErr.message
          });
        }
      }
      
      const response = { 
        audioUrl,
        audioContentStored: audioContent ? true : false,
        message: "Audio metadata processed successfully"
      };
      
      console.log('Upload response:', response);
      return res.status(201).json(response);
    } catch (error) {
      console.error("Error processing audio metadata:", error);
      return res.status(500).json({ 
        message: "Failed to process audio metadata", 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
  
  // Endpoint to serve audio content from the database or virtual URL
  app.get("/api/audio/:identifier", async (req: Request, res: Response) => {
    try {
      const { identifier } = req.params;
      console.log(`Audio request received for identifier: ${identifier}`);
      
      // Try to find a lecture with this identifier in the URL
      // First, check if it's a lecture ID
      let lecture = null;
      
      if (identifier.match(/^\d+$/)) {
        // If the identifier is just a number, treat it as a lecture ID
        lecture = await storage.getLecture(parseInt(identifier));
      } else {
        // Otherwise, search for lectures with this identifier in the audioUrl
        // Get all lectures and filter by audioUrl
        const allLectures = await db.select().from(lectures);
        console.log(`Found ${allLectures.length} lectures in the database to search through`);
        
        // First look for exact matches in the audio_url column 
        lecture = allLectures.find(l => l.audio_url && l.audio_url.includes(identifier));
        
        if (lecture) {
          console.log(`Found matching lecture by URL: ID=${lecture.id}, Title=${lecture.title}`);
        }
        
        // If we still don't have a lecture, try checking if the lecture was just created
        // This could be the current lecture we're looking for with audio_url set but content not yet stored
        if (!lecture || !lecture.audio_content) {
          console.log('No direct match found or no audio content. Checking for recently created lectures...');
          
          // Get all lectures again in case the first query missed updates
          const refreshedLectures = await db.select().from(lectures).orderBy(lectures.id, 'desc').limit(10);
          console.log(`Checking ${refreshedLectures.length} most recently created lectures`);
          
          // Check if any of the recently created lectures has our identifier in the URL
          for (const recentLecture of refreshedLectures) {
            if (recentLecture.audio_url && recentLecture.audio_url.includes(identifier) && recentLecture.audio_content) {
              console.log(`Found matching lecture in recent lectures: ID=${recentLecture.id}, Title=${recentLecture.title}`);
              lecture = recentLecture;
              break;
            }
          }
        }
        
        // If we still don't have a lecture, try to search by title (for dynamically generated identifiers)
        if (!lecture || !lecture.audio_content) {
          console.log('No match found with content. Trying to match by title parts...');
          
          // Parse the identifier for potential metadata
          // Format often is like: "lecture_title_timestamp"
          const parts = identifier.split('_');
          if (parts.length >= 2) {
            const titlePart = parts[1]; // The part after 'lecture_'
            console.log(`Looking for lectures with title containing: ${titlePart}`);
            
            // Look for lectures with a similar title
            const matchByTitle = allLectures.find(l => 
              l.title && 
              l.title.toLowerCase().includes(titlePart.toLowerCase()) && 
              l.audio_content
            );
            
            if (matchByTitle) {
              console.log(`Found matching lecture by title part: ${matchByTitle.title}`);
              lecture = matchByTitle;
            }
          }
        }
      }
      
      if (!lecture || !lecture.audio_content) {
        console.log(`No lecture found with audio identifier: ${identifier}`);
        return res.status(404).json({ message: "Audio not found" });
      }
      
      console.log(`Found lecture with audio: ${lecture.title || 'Untitled'}`);
      
      // Convert base64 content back to binary
      const audioBinary = Buffer.from(lecture.audio_content, 'base64');
      
      // Set the appropriate content type
      res.setHeader('Content-Type', lecture.audio_type || 'audio/mp3');
      res.setHeader('Content-Length', audioBinary.length);
      
      // Send the audio data
      console.log(`Sending audio binary data (${audioBinary.length} bytes)`);
      return res.send(audioBinary);
    } catch (error) {
      console.error("Error serving audio:", error);
      return res.status(500).json({ 
        message: "Failed to retrieve audio data", 
        error: error.message
      });
    }
  });
  
  // Task endpoints
  app.get("/api/tasks/lecture/:lectureId", async (req: Request, res: Response) => {
    const { lectureId } = req.params;
    try {
      const tasks = await storage.getTasksByLecture(parseInt(lectureId));
      return res.json(tasks);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  });
  
  app.get("/api/tasks/course/:courseId", async (req: Request, res: Response) => {
    const { courseId } = req.params;
    try {
      const tasks = await storage.getTasksByCourse(parseInt(courseId));
      return res.json(tasks);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  });
  
  app.post("/api/tasks", async (req: Request, res: Response) => {
    try {
      const newTask = validateBody(insertTaskSchema, req.body);
      const task = await storage.createTask(newTask);
      return res.status(201).json(task);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  });
  
  app.put("/api/tasks/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const updatedTask = await storage.updateTask(parseInt(id), req.body);
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      return res.json(updatedTask);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  });

  // Transcription endpoints
  app.post("/api/transcribe/:lectureId", async (req: Request, res: Response) => {
    const { lectureId } = req.params;
    try {
      const lecture = await storage.getLecture(parseInt(lectureId));
      if (!lecture) {
        return res.status(404).json({ message: "Lecture not found" });
      }
      
      // Check if manual transcript is provided in request
      const { manualTranscript } = req.body;
      
      let transcript = '';
      
      // If manual transcript is provided, use it directly
      if (manualTranscript) {
        console.log('Using manually provided transcript');
        transcript = manualTranscript;
      }
      // Otherwise, try to generate transcript from audio
      else {
        // Check if we have either audio URL or audio content
        if (!lecture.audioUrl && !lecture.audioContent) {
          return res.status(400).json({ message: "Lecture does not have an audio file" });
        }

        // Update lecture processing status
        await storage.updateLecture(parseInt(lectureId), { processingStatus: "transcribing" });
        
        // Check if we have an API key for AssemblyAI
        if (!process.env.ASSEMBLYAI_API_KEY) {
          return res.status(400).json({ 
            message: "Missing AssemblyAI API key in environment variables",
            hint: "Please provide ASSEMBLYAI_API_KEY or use manual transcript"
          });
        }
        
        // If we have an audio URL (starts with http) - legacy support
        if (lecture.audioUrl && lecture.audioUrl.startsWith('http')) {
          console.log(`Transcribing from external URL: ${lecture.audioUrl}`);
          // Use the URL directly with our transcribeAudio function that now supports URLs
          transcript = await transcribeAudio(lecture.audioUrl);
        }
        // If we have audio content stored in the database, use that as a fallback
        else if ((lecture.audioContent || lecture.audio_content) && (lecture.audioType || lecture.audio_type)) {
          console.log('Transcribing from base64 audio content in database using AssemblyAI');
          // Get audio content from either camelCase or snake_case field
          const audioContent = lecture.audioContent || lecture.audio_content;
          
          try {
            // Pass base64 content directly to AssemblyAI service which supports base64 input
            console.log('Sending audio content directly to AssemblyAI');
            transcript = await transcribeAudio(audioContent);
            console.log('Successfully transcribed audio using AssemblyAI');
          } catch (err) {
            console.error("Error transcribing with AssemblyAI:", err);
            throw err; // Re-throw the error
          }
        } 
        // For virtual URLs that represent database-stored audio (not starting with http)
        else if (lecture.audioUrl) {
          console.log(`Handling virtual audio URL: ${lecture.audioUrl}`);
          
          // Check if we actually have audioContent in the database for this lecture
          if (lecture.audioContent && lecture.audioType) {
            console.log('Found audio content in database, using that for transcription with AssemblyAI');
            
            try {
              // Pass base64 content directly to AssemblyAI service
              console.log('Sending audio content directly to AssemblyAI API');
              transcript = await transcribeAudio(lecture.audioContent);
              console.log('Successfully transcribed audio using AssemblyAI');
            } catch (err) {
              console.error("Error transcribing with AssemblyAI:", err);
              throw err; // Re-throw the error
            }
          } else {
            // If we don't have audioContent directly in the lecture object,
            // let's try to find it by parsing the audioUrl to get the identifier
            console.log('No direct audio content found. Trying to parse identifier from URL...');
            
            // Extract identifier from URL like "/api/audio/lecture_title_12345678"
            const urlParts = lecture.audioUrl.split('/');
            const identifier = urlParts[urlParts.length - 1];
            
            if (identifier) {
              console.log(`Extracted identifier from URL: ${identifier}`);
              
              // Look for lectures with this identifier in their audioUrl
              // Use a direct database query for more reliability
              const allLectures = await db.select().from(lectures);
              console.log(`Found ${allLectures.length} lectures in the database to search through`);
              
              const matchingLecture = allLectures.find(l => {
                // Check if this lecture has audio content and its URL contains the identifier
                // Support both camelCase and snake_case field names
                const hasMatch = (l.audioContent || l.audio_content) && 
                                (l.audioUrl || l.audio_url) && 
                                (l.audioUrl || l.audio_url).includes(identifier);
                
                if (hasMatch) {
                  console.log(`Found matching lecture: ID=${l.id}, Title=${l.title}, URL=${l.audioUrl || l.audio_url}`);
                }
                
                return hasMatch;
              });
              
              if (matchingLecture && (matchingLecture.audioContent || matchingLecture.audio_content)) {
                console.log(`Found matching lecture with audio content: ${matchingLecture.id}`);
                
                // Get audio content from either camelCase or snake_case field
                const audioContent = matchingLecture.audioContent || matchingLecture.audio_content;
                
                try {
                  // Send audio content directly to AssemblyAI
                  console.log('Sending matched audio content directly to AssemblyAI');
                  transcript = await transcribeAudio(audioContent);
                  console.log('Successfully transcribed matched audio using AssemblyAI');
                } catch (err) {
                  console.error("Error transcribing with AssemblyAI:", err);
                  throw err;
                }
              } else {
                throw new Error(`Audio referenced by URL (${identifier}) but no content found in the database`);
              }
            } else {
              throw new Error("Audio referenced by URL but no identifier could be extracted");
            }
          }
        }
      }
      
      // Update the lecture with the transcript
      const updatedLecture = await storage.updateLecture(parseInt(lectureId), {
        transcriptContent: transcript,
        processingStatus: "transcribed"
      });
      
      return res.json({
        message: "Transcription completed successfully",
        lecture: updatedLecture
      });
    } catch (error) {
      console.error("Error transcribing audio:", error);
      // Update lecture processing status
      await storage.updateLecture(parseInt(lectureId), { processingStatus: "failed" });
      return res.status(500).json({ message: `Failed to transcribe audio: ${(error as Error).message}` });
    }
  });

  app.post("/api/summarize/:lectureId", async (req: Request, res: Response) => {
    const { lectureId } = req.params;
    const { engine = "openai" } = req.query; // "openai" or "gemini"
    
    try {
      const lecture = await storage.getLecture(parseInt(lectureId));
      if (!lecture) {
        return res.status(404).json({ message: "Lecture not found" });
      }

      if (!lecture.transcriptContent) {
        return res.status(400).json({ message: "Lecture does not have a transcript" });
      }
      
      // Update lecture processing status
      await storage.updateLecture(parseInt(lectureId), { processingStatus: "summarizing" });
      
      // Generate summary using the specified engine
      let summary = "";
      if (engine === "gemini") {
        summary = await generateSummary(lecture.transcriptContent);
      } else {
        summary = await summarizeTranscript(lecture.transcriptContent);
      }
      
      // Update the lecture with the summary
      const updatedLecture = await storage.updateLecture(parseInt(lectureId), {
        summary,
        processingStatus: "completed"
      });
      
      return res.json({
        message: "Summary generated successfully",
        lecture: updatedLecture
      });
    } catch (error) {
      console.error("Error generating summary:", error);
      // Update lecture processing status
      await storage.updateLecture(parseInt(lectureId), { processingStatus: "failed" });
      return res.status(500).json({ message: `Failed to generate summary: ${(error as Error).message}` });
    }
  });

  app.post("/api/extract-tasks/:lectureId", async (req: Request, res: Response) => {
    const { lectureId } = req.params;
    const { fallback } = req.query; // Add a fallback option query parameter
    
    try {
      const lecture = await storage.getLecture(parseInt(lectureId));
      if (!lecture) {
        return res.status(404).json({ message: "Lecture not found" });
      }

      if (!lecture.transcriptContent) {
        return res.status(400).json({ message: "Lecture does not have a transcript" });
      }
      
      let extractedTasks = [];
      
      // Use fallback extraction if requested or if OpenAI extraction fails
      if (fallback === 'true') {
        console.log("Using fallback extraction method");
        extractedTasks = extractTasksLocally(lecture.transcriptContent, parseInt(lectureId), lecture.courseId);
      } else {
        try {
          // Try to extract tasks using OpenAI
          extractedTasks = await extractTasks(lecture.transcriptContent, parseInt(lectureId), lecture.courseId);
        } catch (aiError) {
          console.error("OpenAI extraction failed, using fallback:", aiError);
          // If OpenAI fails, use the fallback method
          extractedTasks = extractTasksLocally(lecture.transcriptContent, parseInt(lectureId), lecture.courseId);
        }
      }
      
      // Store the tasks in the database
      const tasks = [];
      for (const taskData of extractedTasks) {
        const task = await storage.createTask({
          lectureId: parseInt(lectureId),
          courseId: lecture.courseId,
          title: taskData.title,
          description: taskData.description,
          type: taskData.type,
          dueDate: taskData.dueDate || null
        });
        tasks.push(task);
      }
      
      return res.json({
        message: `Successfully extracted ${tasks.length} tasks`,
        tasks
      });
    } catch (error) {
      console.error("Error extracting tasks:", error);
      return res.status(500).json({ message: `Failed to extract tasks: ${(error as Error).message}` });
    }
  });
  
  // Fallback function to extract tasks without using AI API
  function extractTasksLocally(transcript: string, lectureId: number, courseId: number): Array<{
    title: string;
    description: string;
    dueDate: string | null;
    type: string;
    lectureId: number;
    courseId: number;
    priority?: number;
  }> {
    const tasks = [];
    const lines = transcript.split('\n');
    
    // Enhanced keywords for better recognition
    const assignmentKeywords = ['assignment', 'homework', 'exercise', 'project', 'paper', 'essay', 'submission', 'task', 'work', 'write', 'prepare', 'create', 'develop', 'complete'];
    const quizKeywords = ['quiz', 'test', 'exam', 'midterm', 'final', 'assessment', 'evaluation', 'examination'];
    const readingKeywords = ['read', 'reading', 'textbook', 'chapter', 'article', 'material', 'literature', 'book', 'pages', 'publication'];
    const presentationKeywords = ['presentation', 'present', 'slides', 'speech', 'talk', 'demonstrate', 'demo'];
    const labKeywords = ['lab', 'laboratory', 'experiment', 'practical'];
    const dueKeywords = ['due', 'deadline', 'submit by', 'turn in by', 'by the', 'no later than', 'before the', 'not after'];
    const priorityKeywords = {
      high: ['important', 'critical', 'crucial', 'essential', 'significant', 'major', 'key'],
      medium: ['moderately important', 'should', 'recommended'],
      low: ['optional', 'if time permits', 'extra credit', 'bonus']
    };
    const dateRegex = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(st|nd|rd|th)?\b|\b\d{1,2}(st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\b|\b\d{2}\/\d{2}\/\d{2,4}\b/gi;
    
    // Look for specific dates or relative dates
    const relativeDates = {
      'next monday': 'Monday',
      'next tuesday': 'Tuesday',
      'next wednesday': 'Wednesday',
      'next thursday': 'Thursday',
      'next friday': 'Friday',
      'next saturday': 'Saturday',
      'next sunday': 'Sunday',
      'next week': '7 days from now',
      'in two weeks': '14 days from now',
      'in 2 weeks': '14 days from now',
      'end of month': 'end of current month',
      'end of the month': 'end of current month',
      'end of semester': 'December 15',
      'end of the semester': 'December 15'
    };
    
    // Process each line for task information
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      // Detect if line contains any task-related keywords
      const hasAssignmentKeyword = assignmentKeywords.some(keyword => line.includes(keyword));
      const hasQuizKeyword = quizKeywords.some(keyword => line.includes(keyword));
      const hasReadingKeyword = readingKeywords.some(keyword => line.includes(keyword));
      const hasPresentationKeyword = presentationKeywords.some(keyword => line.includes(keyword));
      const hasLabKeyword = labKeywords.some(keyword => line.includes(keyword));
      
      if (hasAssignmentKeyword || hasQuizKeyword || hasReadingKeyword || hasPresentationKeyword || hasLabKeyword) {
        // This line potentially contains a task
        
        // Determine task type
        let type = 'assignment';
        if (hasQuizKeyword) type = 'quiz';
        if (hasReadingKeyword) type = 'reading';
        if (hasPresentationKeyword) type = 'presentation';
        if (hasLabKeyword) type = 'lab';
        
        // Extract title (use the line or clean it up)
        const title = lines[i].trim().replace(/^\W+|\W+$/g, '');
        
        // Combine with next line for description if available
        let description = '';
        if (i + 1 < lines.length) {
          description = lines[i + 1].trim();
        }
        
        // Determine priority based on keywords
        let priority = 2; // Default to medium priority
        
        const checkLine = line + ' ' + (i + 1 < lines.length ? lines[i + 1].toLowerCase() : '');
        
        if (priorityKeywords.high.some(keyword => checkLine.includes(keyword))) {
          priority = 3; // High priority
        } else if (priorityKeywords.low.some(keyword => checkLine.includes(keyword))) {
          priority = 1; // Low priority
        }
        
        // Look for due date
        let dueDate = null;
        
        // Check for date in current line or next few lines
        for (let j = i; j < Math.min(i + 3, lines.length); j++) {
          const checkLine = lines[j].toLowerCase();
          
          // Check for relative date references
          Object.keys(relativeDates).forEach(relDate => {
            if (checkLine.includes(relDate)) {
              dueDate = relativeDates[relDate];
            }
          });
          
          // Check for due keywords and extract date
          if (dueKeywords.some(keyword => checkLine.includes(keyword))) {
            // Extract date if present
            const dateMatch = checkLine.match(dateRegex);
            if (dateMatch) {
              dueDate = dateMatch[0];
            }
          }
        }
        
        // Convert relative date to actual date string if possible
        if (dueDate) {
          // For simplicity, just use some common date conversions
          const today = new Date();
          
          if (dueDate === 'Monday' || dueDate === 'Tuesday' || dueDate === 'Wednesday' 
              || dueDate === 'Thursday' || dueDate === 'Friday') {
            // Calculate next occurrence of that day
            const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
              .indexOf(dueDate.toLowerCase());
            
            if (dayIndex > 0) {
              const nextDay = new Date(today);
              const currentDay = today.getDay();
              const daysUntilNext = (dayIndex - currentDay + 7) % 7;
              nextDay.setDate(today.getDate() + daysUntilNext);
              dueDate = nextDay.toISOString().split('T')[0]; // YYYY-MM-DD format
            }
          } else if (dueDate === '7 days from now') {
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            dueDate = nextWeek.toISOString().split('T')[0];
          } else if (dueDate === '14 days from now') {
            const twoWeeks = new Date(today);
            twoWeeks.setDate(today.getDate() + 14);
            dueDate = twoWeeks.toISOString().split('T')[0];
          } else if (dueDate === 'end of current month') {
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            dueDate = endOfMonth.toISOString().split('T')[0];
          } else if (dueDate === 'December 15') {
            dueDate = `${today.getFullYear()}-12-15`;
          } else {
            // Try to parse various date formats
            try {
              // Remove st, nd, rd, th from dates
              const cleanDate = dueDate.replace(/(st|nd|rd|th)/gi, '');
              const parsedDate = new Date(cleanDate);
              
              if (!isNaN(parsedDate.getTime())) {
                dueDate = parsedDate.toISOString().split('T')[0];
              } else {
                // If we can't parse the date properly, set to null
                dueDate = null;
              }
            } catch (e) {
              console.log(`Failed to parse date "${dueDate}", setting to null`);
              dueDate = null;
            }
          }
        }
        
        // Add task to list
        tasks.push({
          title,
          description,
          dueDate,
          type,
          priority,
          lectureId,
          courseId
        });
      }
    }
    
    return tasks;
  }

  app.post("/api/create-flashcards/:lectureId", async (req: Request, res: Response) => {
    const { lectureId } = req.params;
    
    try {
      const lecture = await storage.getLecture(parseInt(lectureId));
      if (!lecture) {
        return res.status(404).json({ message: "Lecture not found" });
      }

      if (!lecture.transcriptContent) {
        return res.status(400).json({ message: "Lecture does not have a transcript" });
      }
      
      // Create flashcards from the transcript
      const flashcards = await createFlashcards(lecture.transcriptContent);
      
      return res.json({
        message: `Successfully created ${flashcards.length} flashcards`,
        flashcards
      });
    } catch (error) {
      console.error("Error creating flashcards:", error);
      return res.status(500).json({ message: `Failed to create flashcards: ${(error as Error).message}` });
    }
  });

  // Calendar API Integration
  app.post("/api/calendar/events", async (req: Request, res: Response) => {
    try {
      const { taskId, userEmail } = req.body;
      
      if (!taskId || !userEmail) {
        return res.status(400).json({ message: "Missing required fields: taskId and userEmail" });
      }
      
      const task = await storage.getTask(parseInt(taskId));
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const event = await createCalendarEvent(task, userEmail);
      
      // Update the task with the calendar event ID
      const updatedTask = await storage.updateTask(task.id, {
        calendarEventId: event.id
      });
      
      return res.json({
        message: "Event created successfully",
        task: updatedTask,
        event
      });
    } catch (error) {
      console.error("Error creating calendar event:", error);
      return res.status(500).json({ message: `Failed to create calendar event: ${(error as Error).message}` });
    }
  });
  
  app.put("/api/calendar/events/:taskId", async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const { userEmail } = req.body;
      
      if (!userEmail) {
        return res.status(400).json({ message: "Missing required field: userEmail" });
      }
      
      const task = await storage.getTask(parseInt(taskId));
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (!task.calendarEventId) {
        return res.status(400).json({ message: "Task doesn't have an associated calendar event" });
      }
      
      const event = await updateCalendarEvent(task, task.calendarEventId, userEmail);
      
      return res.json({
        message: "Event updated successfully",
        event
      });
    } catch (error) {
      console.error("Error updating calendar event:", error);
      return res.status(500).json({ message: `Failed to update calendar event: ${(error as Error).message}` });
    }
  });
  
  app.delete("/api/calendar/events/:taskId", async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      
      const task = await storage.getTask(parseInt(taskId));
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (!task.calendarEventId) {
        return res.status(400).json({ message: "Task doesn't have an associated calendar event" });
      }
      
      await deleteCalendarEvent(task.calendarEventId);
      
      // Remove the calendar event ID from the task
      await storage.updateTask(task.id, {
        calendarEventId: null
      });
      
      return res.json({
        message: "Event deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      return res.status(500).json({ message: `Failed to delete calendar event: ${(error as Error).message}` });
    }
  });
  
  app.get("/api/calendar/events", async (req: Request, res: Response) => {
    try {
      const { userEmail } = req.query;
      
      if (!userEmail) {
        return res.status(400).json({ message: "Missing required query parameter: userEmail" });
      }
      
      const events = await getCalendarEvents(userEmail as string);
      
      return res.json(events);
    } catch (error) {
      console.error("Error getting calendar events:", error);
      return res.status(500).json({ message: `Failed to get calendar events: ${(error as Error).message}` });
    }
  });

  // Student stats API
  app.get("/api/stats/student/:studentId", async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      
      // Get all tasks for courses the student is enrolled in
      const enrollments = await storage.getEnrollmentsByStudent(parseInt(studentId));
      const courseIds = enrollments.map(enrollment => enrollment.courseId);
      
      let allTasks = [];
      for (const courseId of courseIds) {
        const courseTasks = await storage.getTasksByCourse(courseId);
        allTasks = [...allTasks, ...courseTasks];
      }
      
      // Get student progress records
      const progressRecords = await storage.getProgressByStudent(parseInt(studentId));
      
      // Count completed vs. pending tasks
      const completedTasks = allTasks.filter(task => task.completed).length;
      const pendingTasks = allTasks.length - completedTasks;
      
      // Count lectures with summaries available
      const lectureIds = progressRecords.map(record => record.lectureId);
      let completedLectures = 0;
      let lecturesWithSummaries = 0;
      
      for (const lectureId of lectureIds) {
        const lecture = await storage.getLecture(lectureId);
        if (lecture) {
          if (lecture.status === "published") {
            completedLectures++;
          }
          if (lecture.summary) {
            lecturesWithSummaries++;
          }
        }
      }
      
      // Tasks due this week
      const today = new Date();
      const endOfWeek = new Date();
      endOfWeek.setDate(today.getDate() + 7);
      
      const tasksDueThisWeek = allTasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= today && dueDate <= endOfWeek;
      });
      
      // Recent lectures (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      const recentProgressRecords = progressRecords.filter(record => {
        const accessDate = new Date(record.lastAccessedAt);
        return accessDate >= thirtyDaysAgo;
      });
      
      return res.json({
        totalTasks: allTasks.length,
        completedTasks,
        pendingTasks,
        completedLectures,
        lecturesWithSummaries,
        totalLectures: lectureIds.length,
        tasksDueThisWeek: tasksDueThisWeek.length,
        recentLectures: recentProgressRecords.length
      });
    } catch (error) {
      console.error("Error getting student stats:", error);
      return res.status(500).json({ message: `Failed to retrieve student statistics: ${(error as Error).message}` });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
