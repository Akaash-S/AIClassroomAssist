import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Save,
  Trash,
  Upload,
  FileAudio,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import AudioVerificationDialog from '@/components/AudioVerificationDialog';

// Form schema
const lectureFormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  courseId: z.string().min(1, {
    message: "Please select a course.",
  }),
});

type LectureFormValues = z.infer<typeof lectureFormSchema>;

interface Course {
  id: number;
  name: string;
}

enum RecordingState {
  Inactive,
  Recording,
  Paused,
  Completed
}

export default function RecordLecturePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.Inactive);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [recordingInterval, setRecordingInterval] = useState<number | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedFileId, setUploadedFileId] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Set up form with default values
  const form = useForm<LectureFormValues>({
    resolver: zodResolver(lectureFormSchema),
    defaultValues: {
      title: "",
      description: "",
      courseId: "",
    }
  });

  // Fetch courses when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      const response = await fetch(`/api/courses/teacher/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive'
      });
    }
  };

  // For demo/preview purposes - will be replaced with real API data
  useEffect(() => {
    if (courses.length === 0) {
      // Sample data for UI development
      setCourses([
        { id: 1, name: "Introduction to Psychology" },
        { id: 2, name: "Advanced Mathematics" },
        { id: 3, name: "Economics 101" }
      ]);
    }
  }, [courses]);

  // Create a ref to store the MediaRecorder instance
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<BlobPart[]>([]);
  
  // Initialize/cleanup audio recording functionality
  useEffect(() => {
    const setupRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        
        recorder.ondataavailable = (event) => {
          console.log("Data available from recorder:", event.data.size);
          audioChunksRef.current.push(event.data);
        };
        
        recorder.onstop = () => {
          console.log("MediaRecorder stopped, processing chunks:", audioChunksRef.current.length);
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log("Created audio blob of type:", audioBlob.type, "size:", audioBlob.size);
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioBlob(audioBlob);
          setAudioURL(audioUrl);
          audioChunksRef.current = [];
        };
        
        // Start recording
        recorder.start(1000); // Collect data every second
        console.log("MediaRecorder started:", recorder.state);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        toast({
          title: 'Microphone Error',
          description: 'Unable to access microphone. Please check your permissions.',
          variant: 'destructive'
        });
      }
    };
    
    // Handle different recording states
    if (recordingState === RecordingState.Recording) {
      // If we have an existing MediaRecorder in paused state, resume it
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        console.log("Resuming existing MediaRecorder");
        mediaRecorderRef.current.resume();
      } else if (!mediaRecorderRef.current) {
        // Otherwise set up a new recording
        console.log("Setting up new MediaRecorder");
        setupRecording();
      }
    } else if (recordingState === RecordingState.Paused) {
      // If we're pausing, pause the MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        console.log("Pausing MediaRecorder");
        mediaRecorderRef.current.pause();
      }
    } else if (recordingState === RecordingState.Completed) {
      // If we're stopping, stop the MediaRecorder
      if (mediaRecorderRef.current && 
          (mediaRecorderRef.current.state === 'recording' || 
           mediaRecorderRef.current.state === 'paused')) {
        console.log("Stopping MediaRecorder");
        mediaRecorderRef.current.stop();
        
        // Clean up tracks
        const tracks = mediaRecorderRef.current.stream?.getTracks();
        tracks?.forEach(track => track.stop());
        mediaRecorderRef.current = null;
      }
    }
    
    // Cleanup function
    return () => {
      if (recordingState === RecordingState.Inactive) {
        // Clear everything on reset
        if (mediaRecorderRef.current) {
          console.log("Cleaning up MediaRecorder:", mediaRecorderRef.current.state);
          if (mediaRecorderRef.current.state === 'recording' || 
              mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.stop();
          }
          const tracks = mediaRecorderRef.current.stream?.getTracks();
          tracks?.forEach(track => track.stop());
          mediaRecorderRef.current = null;
        }
        
        if (audioURL) {
          URL.revokeObjectURL(audioURL);
        }
        
        if (recordingInterval) {
          clearInterval(recordingInterval);
        }
      }
    };
  }, [recordingState]);

  // Start recording
  const startRecording = () => {
    setRecordingState(RecordingState.Recording);
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioURL(null);
    
    const interval = window.setInterval(() => {
      setRecordingTime(prevTime => prevTime + 1);
    }, 1000);
    
    setRecordingInterval(interval);
  };

  // Pause recording
  const pauseRecording = () => {
    setRecordingState(RecordingState.Paused);
    
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }
  };

  // Resume recording
  const resumeRecording = () => {
    setRecordingState(RecordingState.Recording);
    
    const interval = window.setInterval(() => {
      setRecordingTime(prevTime => prevTime + 1);
    }, 1000);
    
    setRecordingInterval(interval);
  };

  // Stop recording
  const stopRecording = () => {
    setRecordingState(RecordingState.Completed);
    
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }
  };

  // Reset recording
  const resetRecording = () => {
    setRecordingState(RecordingState.Inactive);
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioURL(null);
    setUploadProgress(0);
    setIsUploading(false);
    setUploadedFileId(null);
    setUploadError(null);
  };

  // Format recording time as MM:SS
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle form submission
  // State for verification dialog
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  
  // Handler for uploading to the database after verification
  const handleUploadToDatabase = async (data: LectureFormValues) => {
    if (!audioBlob) {
      toast({
        title: 'Recording Required',
        description: 'Please record a lecture before submitting.',
        variant: 'destructive'
      });
      return;
    }
    
    // First show the verification dialog
    setShowVerificationDialog(true);
  };
  
  // Handler for confirmed upload after verification
  const handleConfirmedUpload = async () => {
    // Close the verification dialog
    setShowVerificationDialog(false);
    
    // Get the form data
    const data = form.getValues();
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      // Show upload progress
      setUploadProgress(10);
      toast({
        title: 'Database Upload',
        description: 'Starting upload to Neon database...',
      });
      
      // Simulate upload progress for a better user experience
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 200);
      
      // Import the uploadAudio function from audioRecorder.ts
      const { uploadAudio, convertToMP3 } = await import('@/lib/audioRecorder');
      
      // First convert the audio to MP3 format for smaller file size
      toast({
        title: 'Processing Audio',
        description: 'Converting recording to MP3 format...',
      });
      
      const mp3Blob = await convertToMP3(audioBlob);
      
      // Prepare metadata for the upload
      const metadata = {
        title: data.title,
        description: data.description || '',
        courseId: parseInt(data.courseId),
        teacherId: user?.id,
        duration: recordingTime,
        includeBase64: true // Always include base64 audio for database storage
      };
      
      // Upload to Neon database using our helper function
      const downloadURL = await uploadAudio(mp3Blob, metadata);
      
      clearInterval(progressInterval);
      setUploadProgress(95);
      
      // Create lecture data to send to the server
      const lectureData = {
        title: data.title,
        description: data.description || '',
        courseId: parseInt(data.courseId),
        teacherId: user?.id,
        audioUrl: downloadURL,
        date: new Date().toISOString(),
        duration: recordingTime,
      };
      
      // Send metadata to the server API
      const response = await fetch('/api/lectures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lectureData),
      });
      
      if (response.ok) {
        const result = await response.json();
        setUploadProgress(100);
        setUploadedFileId(result.id);
        
        toast({
          title: 'Upload Successful',
          description: 'Audio saved to Neon database along with lecture metadata.',
          variant: 'success',
        });
        
        // Simulate processing delay for transcription and summarization
        setIsProcessing(true);
        
        // Show a processing message
        toast({
          title: 'Processing',
          description: 'Your lecture is being transcribed using OpenAI Whisper API...',
        });
        
        // Start the transcription process
        try {
          const transcribeResponse = await fetch(`/api/transcribe/${result.id}`, {
            method: 'POST',
          });
          
          if (transcribeResponse.ok) {
            toast({
              title: 'Transcription Complete',
              description: 'Your lecture has been successfully transcribed.',
              variant: 'success',
            });
          }
        } catch (error) {
          console.error('Error transcribing:', error);
          toast({
            title: 'Transcription Error',
            description: 'There was an issue transcribing your lecture, but the audio is saved.',
            variant: 'destructive',
          });
        }
        
        setTimeout(() => {
          setIsProcessing(false);
          setLocation(`/lectures/${result.id}`);
        }, 2000);
      } else {
        throw new Error('Failed to save lecture metadata');
      }
    } catch (error) {
      console.error('Error uploading lecture:', error);
      setUploadProgress(0);
      setUploadError(`Failed to upload to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast({
        title: 'Upload Failed',
        description: 'There was a problem uploading to the Neon database. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Check if user is a teacher
  if (user && user.role !== 'teacher') {
    return (
      <div className="container mx-auto py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
        <p className="text-muted-foreground mb-6">
          Only teachers can access the lecture recording feature.
        </p>
        <Button onClick={() => setLocation('/')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2">Record Lecture</h1>
        <p className="text-muted-foreground mb-6">
          Record audio lectures for your courses and create AI-powered transcripts and summaries.
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recording Panel */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle>Audio Recorder</CardTitle>
            <CardDescription>
              Record your lecture audio using your microphone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center mb-6">
              <div className="w-48 h-48 rounded-full bg-gray-100 flex items-center justify-center mb-4 relative">
                {recordingState === RecordingState.Inactive && (
                  <Mic className="h-20 w-20 text-gray-400" />
                )}
                {recordingState === RecordingState.Recording && (
                  <>
                    <Mic className="h-20 w-20 text-red-500 animate-pulse" />
                    <div className="absolute w-full h-full rounded-full border-4 border-red-500 animate-ping"></div>
                  </>
                )}
                {recordingState === RecordingState.Paused && (
                  <Pause className="h-20 w-20 text-amber-500" />
                )}
                {recordingState === RecordingState.Completed && (
                  <FileAudio className="h-20 w-20 text-green-500" />
                )}
              </div>
              
              <div className="text-2xl font-bold mb-2">
                {formatTime(recordingTime)}
              </div>
              
              <div className="text-sm text-muted-foreground mb-4">
                {recordingState === RecordingState.Inactive && "Ready to record"}
                {recordingState === RecordingState.Recording && "Recording..."}
                {recordingState === RecordingState.Paused && "Recording paused"}
                {recordingState === RecordingState.Completed && "Recording complete"}
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {recordingState === RecordingState.Inactive && (
                <Button 
                  onClick={startRecording}
                  className="flex gap-2 rounded-full"
                >
                  <Mic className="h-4 w-4" />
                  Start Recording
                </Button>
              )}
              
              {recordingState === RecordingState.Recording && (
                <>
                  <Button 
                    onClick={pauseRecording}
                    variant="outline"
                    className="flex gap-2 rounded-full"
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                  <Button 
                    onClick={stopRecording}
                    variant="destructive"
                    className="flex gap-2 rounded-full"
                  >
                    <MicOff className="h-4 w-4" />
                    Stop
                  </Button>
                </>
              )}
              
              {recordingState === RecordingState.Paused && (
                <>
                  <Button 
                    onClick={resumeRecording}
                    className="flex gap-2 rounded-full"
                  >
                    <Play className="h-4 w-4" />
                    Resume
                  </Button>
                  <Button 
                    onClick={stopRecording}
                    variant="destructive"
                    className="flex gap-2 rounded-full"
                  >
                    <MicOff className="h-4 w-4" />
                    Stop
                  </Button>
                </>
              )}
              
              {recordingState === RecordingState.Completed && (
                <>
                  {audioURL && (
                    <audio 
                      controls 
                      src={audioURL} 
                      className="w-full mb-4"
                    />
                  )}
                  <div className="flex flex-col gap-3 w-full items-center">
                    <Button 
                      onClick={() => form.handleSubmit(handleUploadToDatabase)()}
                      className="flex gap-2 w-full md:w-auto px-8"
                      variant="default"
                      disabled={!audioBlob || isUploading}
                    >
                      <Upload className="h-4 w-4" />
                      Upload to Database
                    </Button>
                    
                    <div className="flex gap-3 w-full justify-center mt-2">
                      <Button 
                        onClick={resetRecording}
                        variant="outline"
                        className="flex gap-2"
                      >
                        <Trash className="h-4 w-4" />
                        Discard
                      </Button>
                      <Button 
                        onClick={startRecording}
                        className="flex gap-2"
                        variant="secondary"
                      >
                        <Mic className="h-4 w-4" />
                        Record New
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {recordingState !== RecordingState.Inactive && recordingState !== RecordingState.Completed && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                <h3 className="font-medium flex items-center text-amber-800 mb-2">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Recording Tips
                </h3>
                <ul className="text-sm text-amber-700 list-disc pl-5 space-y-1">
                  <li>Speak clearly and at a moderate pace</li>
                  <li>Minimize background noise and interruptions</li>
                  <li>Use a quality microphone for best results</li>
                  <li>Keep your device stable and close to you</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Lecture Details Form */}
        <Card>
          <CardHeader>
            <CardTitle>Lecture Details</CardTitle>
            <CardDescription>
              Add information about your lecture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lecture Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Introduction to Topic" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter a clear and descriptive title for your lecture
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add additional details about this lecture" 
                          {...field} 
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a brief overview of the lecture content
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem 
                              key={course.id} 
                              value={course.id.toString()}
                            >
                              {course.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the course this lecture belongs to
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Upload and Process */}
        <Card>
          <CardHeader>
            <CardTitle>Upload & Process</CardTitle>
            <CardDescription>
              Upload your recording and generate AI-powered resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="transcribe">Transcribe</TabsTrigger>
                <TabsTrigger value="summarize">Summarize</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Audio File</div>
                    <div className="text-sm text-muted-foreground">
                      {audioBlob ? `${(audioBlob.size / (1024 * 1024)).toFixed(2)} MB` : "No file"}
                    </div>
                  </div>
                  
                  {uploadProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                  
                  {uploadError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                      {uploadError}
                    </div>
                  )}
                  
                  {uploadedFileId && !isProcessing && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-green-700 font-medium">Upload Successful!</p>
                        <p className="text-sm text-green-600">Your lecture has been uploaded and is ready for processing.</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="transcribe">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    ) : uploadedFileId ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-500" />
                    )}
                    <div>
                      <p className="font-medium">
                        {isProcessing ? "Transcribing Audio..." : uploadedFileId ? "Transcription Complete" : "Waiting for Upload"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isProcessing 
                          ? "Using OpenAI's Whisper API to transcribe your lecture" 
                          : uploadedFileId 
                            ? "Your lecture has been successfully transcribed" 
                            : "Upload your recording to generate a transcript"
                        }
                      </p>
                    </div>
                  </div>
                  
                  {uploadedFileId && !isProcessing && (
                    <div className="p-3 bg-gray-50 border rounded">
                      <p className="text-sm">Your transcript will be available after processing is complete.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="summarize">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    ) : uploadedFileId ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-500" />
                    )}
                    <div>
                      <p className="font-medium">
                        {isProcessing ? "Generating Summary..." : uploadedFileId ? "Summary Generated" : "Waiting for Transcript"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isProcessing 
                          ? "Using Google's Gemini AI to create a concise summary" 
                          : uploadedFileId 
                            ? "Your lecture summary has been generated" 
                            : "Transcript must be processed before generating a summary"
                        }
                      </p>
                    </div>
                  </div>
                  
                  {uploadedFileId && !isProcessing && (
                    <div className="p-3 bg-gray-50 border rounded">
                      <p className="text-sm">Your summary will be available after processing is complete.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/lectures')}
            >
              Cancel
            </Button>
            <Button 
              onClick={form.handleSubmit(handleUploadToDatabase)}
              disabled={recordingState !== RecordingState.Completed || !audioBlob || isUploading || isProcessing}
              className="flex gap-2"
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isUploading ? "Uploading..." : "Save & Process"}
            </Button>
          </CardFooter>
        </Card>
      </div>
      {/* Audio verification dialog */}
      <AudioVerificationDialog
        open={showVerificationDialog}
        audioBlob={audioBlob}
        onClose={() => setShowVerificationDialog(false)}
        onConfirm={handleConfirmedUpload}
        title={form.getValues().title || 'Untitled Lecture'}
      />
    </div>
  );
}