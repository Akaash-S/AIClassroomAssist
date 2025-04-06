import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'wouter';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  FileText,
  BookOpen,
  Calendar,
  Clock,
  Download,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  CheckCircle,
  XCircle,
  List,
  Edit,
  Save,
  Bookmark,
  Repeat,
  Sparkles
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Lecture {
  id: number;
  title: string;
  description?: string;
  courseName: string;
  date: string;
  duration: number;
  audioUrl: string;
  transcriptContent: string;
  summary: string;
  processingStatus: 'complete' | 'processing' | 'failed';
  teacherName: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  isCompleted: boolean;
}

interface Note {
  id: number;
  content: string;
  timestamp: number;
  updatedAt: string;
}

export default function LectureDetailPage() {
  const params = useParams();
  const lectureId = parseInt(params.id);
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedTranscriptSegment, setSelectedTranscriptSegment] = useState<number | null>(null);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch lecture data when component mounts
  useEffect(() => {
    if (lectureId) {
      fetchLectureData();
    }
  }, [lectureId]);

  const fetchLectureData = async () => {
    setLoading(true);
    try {
      // Fetch lecture details
      const lectureResponse = await fetch(`/api/lectures/${lectureId}`);
      if (lectureResponse.ok) {
        const lectureData = await lectureResponse.json();
        setLecture(lectureData);
        
        // Set up audio element if lecture has audio
        if (lectureData.audioUrl) {
          if (audioRef.current) {
            audioRef.current.src = lectureData.audioUrl;
            audioRef.current.load();
          }
        }
      } else {
        throw new Error('Failed to fetch lecture details');
      }

      // Fetch tasks for this lecture
      const tasksResponse = await fetch(`/api/tasks/lecture/${lectureId}`);
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData);
      }

      // Fetch user notes for this lecture
      const notesResponse = await fetch(`/api/notes/lecture/${lectureId}/user/${user?.id}`);
      if (notesResponse.ok) {
        const notesData = await notesResponse.json();
        setNotes(notesData);
      }
    } catch (error) {
      console.error('Error fetching lecture data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lecture data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // For preview purposes only - will be replaced with API data
  useEffect(() => {
    if (loading && !lecture) {
      // Sample data for UI development
      const sampleLecture: Lecture = {
        id: lectureId,
        title: "Introduction to Cognitive Psychology",
        description: "This lecture introduces the fundamental concepts of cognitive psychology, including perception, attention, memory, and problem-solving.",
        courseName: "Introduction to Psychology",
        date: new Date().toISOString(),
        duration: 3540, // 59 minutes
        audioUrl: "https://example.com/lectures/sample-audio.mp3", // placeholder URL
        transcriptContent: `
[00:00:00] Welcome to Introduction to Cognitive Psychology. Today we'll be exploring the fundamental concepts that shape our understanding of human cognition.

[00:02:30] Let's begin by discussing perception. Perception is the process by which we interpret and organize sensory information to understand our environment.

[00:05:45] Various factors can influence perception, including top-down processing where our existing knowledge affects how we perceive new information.

[00:10:15] Moving on to attention, which is the cognitive process of selectively concentrating on discrete aspects of information while ignoring other perceivable information.

[00:15:30] There are several theories of attention, including the Broadbent's filter model and Treisman's attenuation theory.

[00:20:00] Now, let's discuss memory, which is the faculty of the brain by which data or information is encoded, stored, and retrieved when needed.

[00:25:45] Memory can be categorized into sensory memory, short-term memory, and long-term memory.

[00:30:30] Long-term memory can be further divided into explicit memory (declarative) and implicit memory (procedural).

[00:35:15] Let's move on to problem-solving, which is the process of finding solutions to difficult or complex issues.

[00:40:00] Strategies for problem-solving include algorithms, heuristics, and insight-based approaches.

[00:45:30] Finally, we'll discuss language and cognition, exploring how language shapes our thinking and problem-solving abilities.

[00:50:00] The Sapir-Whorf hypothesis suggests that the language we speak influences how we think about and perceive the world.

[00:55:00] To summarize today's lecture, we've covered perception, attention, memory, problem-solving, and the relationship between language and cognition.
        `,
        summary: `
This lecture provided an introduction to cognitive psychology, focusing on five key areas: perception, attention, memory, problem-solving, and language.

Perception involves interpreting sensory information to understand our environment, influenced by both bottom-up and top-down processing. Attention is the selective focusing on specific information while filtering out irrelevant stimuli, with major theories including Broadbent's filter model and Treisman's attenuation theory.

Memory was discussed as having three main components: sensory memory (brief storage of sensory information), short-term memory (limited capacity, short duration), and long-term memory (vast storage with explicit/declarative and implicit/procedural divisions).

Problem-solving strategies were categorized as algorithms (step-by-step procedures), heuristics (mental shortcuts), and insight-based approaches (sudden solution recognition). The lecture concluded by examining how language influences cognition, referencing the Sapir-Whorf hypothesis which suggests our language shapes our thinking patterns and worldview.
        `,
        processingStatus: 'complete',
        teacherName: "Dr. Jane Smith"
      };
      
      const sampleTasks: Task[] = [
        {
          id: 1,
          title: "Read Chapter 3: Cognitive Processes",
          description: "Complete the assigned reading for next week's discussion",
          dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
          isCompleted: false
        },
        {
          id: 2,
          title: "Complete quiz on perception and attention",
          description: "Online quiz available through the course portal",
          dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
          isCompleted: false
        },
        {
          id: 3,
          title: "Write reflection on memory models",
          description: "500-word reflection on how memory models apply to your own learning",
          dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
          isCompleted: false
        }
      ];
      
      const sampleNotes: Note[] = [
        {
          id: 1,
          content: "Perception is influenced by both bottom-up and top-down processing",
          timestamp: 180, // 3 minutes
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          content: "Three types of memory: sensory, short-term, and long-term. Long-term can be explicit or implicit.",
          timestamp: 1560, // 26 minutes
          updatedAt: new Date().toISOString()
        }
      ];
      
      setLecture(sampleLecture);
      setTasks(sampleTasks);
      setNotes(sampleNotes);
      
      // Simulate audio duration
      setDuration(3540);
      
      setLoading(false);
    }
  }, [loading, lecture, lectureId]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleDurationChange = () => {
      setDuration(audio.duration);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Update audio play/pause state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Update audio volume
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Format time as MM:SS
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Play/pause toggle
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Skip forward/backward
  const skipTime = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = Math.min(Math.max(audio.currentTime + seconds, 0), audio.duration);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Set progress
  const setProgress = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    const audio = audioRef.current;
    if (!audio || !progressBar) return;
    
    const clickPosition = e.clientX - progressBar.getBoundingClientRect().left;
    const progressBarWidth = progressBar.clientWidth;
    const percentage = clickPosition / progressBarWidth;
    const newTime = audio.duration * percentage;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (isMuted && newVolume > 0) {
      setIsMuted(false);
    }
  };

  // Find transcript segment based on current time
  useEffect(() => {
    if (!lecture?.transcriptContent) return;
    
    const transcriptSegments = lecture.transcriptContent
      .split(/\[\d{2}:\d{2}:\d{2}\]/)
      .filter(segment => segment.trim().length > 0);
    
    const timeStamps = lecture.transcriptContent
      .match(/\[\d{2}:\d{2}:\d{2}\]/g)
      ?.map(timeStamp => {
        const [hours, minutes, seconds] = timeStamp
          .replace('[', '')
          .replace(']', '')
          .split(':')
          .map(Number);
        return hours * 3600 + minutes * 60 + seconds;
      }) || [];
    
    for (let i = timeStamps.length - 1; i >= 0; i--) {
      if (currentTime >= timeStamps[i]) {
        setSelectedTranscriptSegment(i);
        break;
      }
    }
  }, [currentTime, lecture?.transcriptContent]);

  // Save a new note
  const saveNote = async () => {
    if (!currentNote.trim()) {
      toast({
        title: 'Empty Note',
        description: 'Please enter some text for your note',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const newNote = {
        content: currentNote,
        timestamp: Math.floor(currentTime),
        lectureId,
        userId: user?.id
      };
      
      // In a real app, send to API
      // const response = await fetch('/api/notes', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newNote)
      // });
      
      // if (response.ok) {
      //   const savedNote = await response.json();
      //   setNotes(prev => [...prev, savedNote]);
      //   setCurrentNote('');
      // }
      
      // For demo purpose, simulate saving
      const savedNote = {
        id: Date.now(),
        content: currentNote,
        timestamp: Math.floor(currentTime),
        updatedAt: new Date().toISOString()
      };
      
      setNotes(prev => [...prev, savedNote]);
      setCurrentNote('');
      
      toast({
        title: 'Note Saved',
        description: 'Your note has been saved successfully'
      });
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: 'Error',
        description: 'Failed to save note',
        variant: 'destructive'
      });
    }
  };

  // Download transcript as text
  const downloadTranscript = () => {
    if (!lecture?.transcriptContent) return;
    
    const element = document.createElement('a');
    const file = new Blob([lecture.transcriptContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${lecture.title.replace(/\s+/g, '_')}_transcript.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: 'Download Started',
      description: 'Transcript download has started'
    });
  };

  // Download summary as text
  const downloadSummary = () => {
    if (!lecture?.summary) return;
    
    const element = document.createElement('a');
    const file = new Blob([lecture.summary], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${lecture.title.replace(/\s+/g, '_')}_summary.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: 'Download Started',
      description: 'Summary download has started'
    });
  };

  // Toggle task completion status
  const toggleTaskCompletion = async (taskId: number) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      const updatedTask = { ...task, isCompleted: !task.isCompleted };
      
      // In a real app, send to API
      // const response = await fetch(`/api/tasks/${taskId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ isCompleted: updatedTask.isCompleted })
      // });
      
      // if (response.ok) {
      //   setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      // }
      
      // For demo purpose, simulate updating
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      
      toast({
        title: updatedTask.isCompleted ? 'Task Completed' : 'Task Reopened',
        description: updatedTask.isCompleted ? 'Task marked as completed' : 'Task marked as incomplete'
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive'
      });
    }
  };

  // Jump to timestamp in audio
  const jumpToTimestamp = (timestamp: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = timestamp;
    setCurrentTime(timestamp);
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };

  // Parse timestamp string to seconds
  const parseTimestamp = (timestamp: string): number => {
    const match = timestamp.match(/\[(\d{2}):(\d{2}):(\d{2})\]/);
    if (!match) return 0;
    
    const [_, hours, minutes, seconds] = match;
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
  };

  // Render transcript segments with clickable timestamps
  const renderTranscriptWithTimestamps = () => {
    if (!lecture?.transcriptContent) return null;
    
    // Split transcript by timestamps
    const segments = lecture.transcriptContent.split(/(\[\d{2}:\d{2}:\d{2}\])/).filter(Boolean);
    
    return (
      <div className="space-y-4">
        {segments.map((segment, index) => {
          // Check if segment is a timestamp
          if (segment.match(/\[\d{2}:\d{2}:\d{2}\]/)) {
            const timestamp = parseTimestamp(segment);
            return (
              <button
                key={`timestamp-${index}`}
                onClick={() => jumpToTimestamp(timestamp)}
                className="text-blue-600 hover:text-blue-800 hover:underline font-mono text-sm"
              >
                {segment}
              </button>
            );
          }
          
          // If not a timestamp, render as text
          return (
            <span 
              key={`text-${index}`} 
              className={selectedTranscriptSegment === Math.floor(index/2) ? 'bg-yellow-100 rounded px-1' : ''}
            >
              {segment}
            </span>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Lecture Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The lecture you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Link href="/lectures">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lectures
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        {/* Header and Navigation */}
        <div className="flex flex-col space-y-4">
          <Link href="/lectures">
            <Button variant="ghost" className="w-fit p-0 h-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Lectures
            </Button>
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">{lecture.title}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <BookOpen className="mr-1 h-4 w-4" />
                  {lecture.courseName}
                </div>
                <span>•</span>
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  {new Date(lecture.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <span>•</span>
                <div className="flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  {formatTime(duration)}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {lecture.processingStatus === 'complete' && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={downloadTranscript}>
                          <Download className="mr-2 h-4 w-4" />
                          Transcript
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Download transcript as text</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={downloadSummary}>
                          <Download className="mr-2 h-4 w-4" />
                          Summary
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Download summary as text</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <List className="mr-2 h-4 w-4" />
                    Tasks
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Tasks & Assignments</SheetTitle>
                    <SheetDescription>
                      Assignments related to this lecture
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-4">
                    {tasks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No tasks or assignments for this lecture</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {tasks.map((task) => (
                          <div key={task.id} className="border rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <div 
                                className={`mt-1 flex-shrink-0 h-5 w-5 rounded-full border cursor-pointer ${
                                  task.isCompleted 
                                    ? 'border-green-500 bg-green-500 flex items-center justify-center' 
                                    : 'border-gray-300'
                                }`}
                                onClick={() => toggleTaskCompletion(task.id)}
                              >
                                {task.isCompleted && (
                                  <CheckCircle className="h-4 w-4 text-white" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className={`font-medium ${task.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                  {task.title}
                                </h3>
                                <p className={`text-sm mt-1 ${task.isCompleted ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                                  {task.description}
                                </p>
                                <div className="flex items-center mt-2">
                                  <Calendar className="h-3 w-3 text-muted-foreground mr-1" />
                                  <span className="text-xs text-muted-foreground">
                                    Due: {new Date(task.dueDate).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          
          {lecture.description && (
            <p className="text-muted-foreground">{lecture.description}</p>
          )}
        </div>
        
        {/* Audio Player */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">Audio Player</div>
              <Badge variant={lecture.processingStatus === 'complete' ? 'default' : 'secondary'}>
                {lecture.processingStatus === 'complete' ? 'Ready' : lecture.processingStatus}
              </Badge>
            </div>
            
            <audio ref={audioRef} className="hidden" />
            
            {/* Progress Bar */}
            <div 
              className="h-2 bg-gray-200 rounded-full cursor-pointer overflow-hidden"
              onClick={setProgress}
            >
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              ></div>
            </div>
            
            {/* Time Display */}
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => skipTime(-10)}
                    >
                      <SkipBack className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Back 10 seconds</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button 
                variant="default" 
                size="icon" 
                className="h-12 w-12 rounded-full"
                onClick={togglePlayPause}
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
              </Button>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => skipTime(10)}
                    >
                      <SkipForward className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Forward 10 seconds</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="flex-1 h-2 accent-primary"
              />
            </div>
          </div>
        </Card>
        
        {/* Tabs for Transcript, Summary, and Notes */}
        <Tabs defaultValue="transcript" className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-6">
            <TabsTrigger value="transcript" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Transcript
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center">
              <Sparkles className="mr-2 h-4 w-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center">
              <Edit className="mr-2 h-4 w-4" />
              My Notes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="transcript">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Lecture Transcript
                </CardTitle>
                <CardDescription>
                  Full transcript of the lecture with timestamps
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                {lecture.processingStatus === 'complete' ? (
                  renderTranscriptWithTimestamps()
                ) : lecture.processingStatus === 'processing' ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Transcript is being processed...</p>
                    <p className="text-sm text-muted-foreground mt-2">This may take a few minutes</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <XCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                    <p>Transcript processing failed</p>
                    <p className="text-sm text-muted-foreground mt-2">Please contact support for assistance</p>
                  </div>
                )}
              </CardContent>
              {lecture.processingStatus === 'complete' && (
                <CardFooter className="border-t pt-4 flex justify-between">
                  <div className="text-sm text-muted-foreground">
                    Click on timestamps to jump to that point in the lecture
                  </div>
                  <Button variant="outline" size="sm" onClick={downloadTranscript}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="mr-2 h-5 w-5" />
                  AI-Generated Summary
                </CardTitle>
                <CardDescription>
                  Concise summary of key points from the lecture
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lecture.processingStatus === 'complete' ? (
                  <div className="prose max-w-none">
                    {lecture.summary.split('\n\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                ) : lecture.processingStatus === 'processing' ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Summary is being generated...</p>
                    <p className="text-sm text-muted-foreground mt-2">This may take a few minutes</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <XCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                    <p>Summary generation failed</p>
                    <p className="text-sm text-muted-foreground mt-2">Please contact support for assistance</p>
                  </div>
                )}
              </CardContent>
              {lecture.processingStatus === 'complete' && (
                <CardFooter className="border-t pt-4 flex justify-end">
                  <Button variant="outline" size="sm" onClick={downloadSummary}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Edit className="mr-2 h-5 w-5" />
                  My Notes
                </CardTitle>
                <CardDescription>
                  Your personal notes for this lecture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Note Input */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="note">Add a note at {formatTime(currentTime)}</Label>
                      <span className="text-sm text-muted-foreground">
                        {currentNote.length}/500
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Textarea
                        id="note"
                        placeholder="Type your note here..."
                        value={currentNote}
                        onChange={(e) => setCurrentNote(e.target.value)}
                        maxLength={500}
                        className="flex-1"
                      />
                      <Button className="self-end" onClick={saveNote}>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Saved Notes */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Saved Notes</h3>
                    {notes.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bookmark className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                        <p>You haven't added any notes for this lecture yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {notes.map((note) => (
                          <div key={note.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <button
                                onClick={() => jumpToTimestamp(note.timestamp)}
                                className="text-blue-600 hover:text-blue-800 hover:underline font-mono text-sm"
                              >
                                {formatTime(note.timestamp)}
                              </button>
                              <span className="text-xs text-muted-foreground">
                                {new Date(note.updatedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap">{note.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}