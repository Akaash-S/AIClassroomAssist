import React, { useState, useRef, useEffect } from 'react';
import {
  startRecording,
  pauseRecording,
  resumeRecording,
  stopRecording,
  getRecordingTime,
  createAudioBlobFromChunks,
  uploadAudio,
  type RecordingSession
} from '@/lib/audioRecorder';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardFooter, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { 
  Mic, MicOff, Pause, Play, Save, Trash2, Upload, CheckCircle, 
  AlertCircle, ArrowRight, Check, XCircle 
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface AudioRecorderProps {
  onSave?: (audioUrl: string) => void;
  lectureId?: number; // Optional lecture ID if this is being used to record for an existing lecture
  className?: string;
}

// Define the recording state for better state management
enum RecordingState {
  INACTIVE = 'inactive',
  RECORDING = 'recording',
  PAUSED = 'paused',
  REVIEWING = 'reviewing',  // New state for reviewing before uploading
  UPLOADING = 'uploading'
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onSave, lectureId, className }) => {
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.INACTIVE);
  const [recordingSession, setRecordingSession] = useState<RecordingSession | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState('00:00');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visualizationData, setVisualizationData] = useState<Uint8Array>(new Uint8Array(0));
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<number>(0);
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState<boolean>(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Create audio element for playback
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });
      
      // Add timeupdate event to track playback progress
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentPlaybackTime(audioRef.current?.currentTime || 0);
      });
      
      // Add loadedmetadata event to get duration
      audioRef.current.addEventListener('loadedmetadata', () => {
        setAudioDuration(audioRef.current?.duration || 0);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      
      if (recordingSession) {
        stopRecording(recordingSession);
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Clean up any object URLs to avoid memory leaks
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  const updateVisualization = (dataArray: Uint8Array) => {
    setVisualizationData(dataArray);
  };

  const handleDataAvailable = (event: BlobEvent) => {
    if (event.data.size > 0) {
      setAudioChunks(prev => [...prev, event.data]);
    }
  };

  const updateTimer = () => {
    if (recordingSession) {
      setRecordingTime(getRecordingTime(recordingSession));
    }
  };

  const handleStartRecording = async () => {
    try {
      setError(null);
      setAudioChunks([]);
      setAudioBlob(null);
      setAudioUrl(null);
      
      const session = await startRecording(handleDataAvailable, updateVisualization);
      setRecordingSession(session);
      setRecordingState(RecordingState.RECORDING);
      
      timerRef.current = setInterval(updateTimer, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      toast({
        title: 'Recording Error',
        description: err instanceof Error ? err.message : 'Failed to start recording',
        variant: 'destructive',
      });
    }
  };

  const handlePauseRecording = () => {
    if (recordingSession) {
      const updatedSession = pauseRecording(recordingSession);
      setRecordingSession(updatedSession);
      setRecordingState(RecordingState.PAUSED);
    }
  };

  const handleResumeRecording = () => {
    if (recordingSession) {
      const updatedSession = resumeRecording(recordingSession);
      setRecordingSession(updatedSession);
      setRecordingState(RecordingState.RECORDING);
    }
  };

  const handleStopRecording = async () => {
    if (recordingSession) {
      stopRecording(recordingSession);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      try {
        // Create the initial webm blob
        const webmBlob = createAudioBlobFromChunks(audioChunks);
        
        // Show a toast that we're converting the audio to MP3
        toast({
          title: 'Converting Audio',
          description: 'Converting to MP3 format for smaller file size...',
        });
        
        // Import the convertToMP3 function only when needed to save on initial load time
        const { convertToMP3 } = await import('@/lib/audioRecorder');
        
        // Convert to MP3
        const mp3Blob = await convertToMP3(webmBlob);
        setAudioBlob(mp3Blob);
        
        // Create object URL for playback
        const url = URL.createObjectURL(mp3Blob);
        setAudioUrl(url);
        
        if (audioRef.current) {
          audioRef.current.src = url;
          // Load the audio to get duration and prepare for playback
          audioRef.current.load();
        }
        
        toast({
          title: 'Recording Complete',
          description: 'Please review your recording before uploading.',
        });
        
        // Change state to reviewing
        setRecordingState(RecordingState.REVIEWING);
        
        // Open verification dialog
        setIsVerificationDialogOpen(true);
      } catch (error) {
        console.error('Error processing audio:', error);
        
        // Fallback to original webm if MP3 conversion fails
        const blob = createAudioBlobFromChunks(audioChunks);
        setAudioBlob(blob);
        
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.load();
        }
        
        toast({
          title: 'MP3 Conversion Failed',
          description: 'Using original format instead. The file might be larger.',
          variant: 'destructive',
        });
        
        // Change state to reviewing
        setRecordingState(RecordingState.REVIEWING);
        
        // Open verification dialog
        setIsVerificationDialogOpen(true);
      }
      
      setRecordingSession(null);
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleUploadRecording = async () => {
    if (audioBlob) {
      setRecordingState(RecordingState.UPLOADING);
      setUploadProgress(10); // Start with 10% to show activity
      
      try {
        // Simulate progress updates during upload
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 300);
        
        // Create headers for the upload
        const customHeaders: HeadersInit = {};
        
        // Add lecture ID if available
        if (lectureId) {
          customHeaders['X-Lecture-Id'] = lectureId.toString();
        }
        
        // Upload the audio with the lecture ID
        const uploadedUrl = await uploadAudio(audioBlob, customHeaders);
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        toast({
          title: 'Upload Success',
          description: 'Audio recording has been saved to Firebase Storage successfully.',
        });
        
        // Call onSave callback if provided
        if (onSave) {
          onSave(uploadedUrl);
        }
        
        // Reset the recorder state
        setAudioChunks([]);
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingState(RecordingState.INACTIVE);
        setUploadProgress(0);
        setIsVerificationDialogOpen(false);
      } catch (err) {
        setRecordingState(RecordingState.REVIEWING);
        setUploadProgress(0);
        toast({
          title: 'Upload Failed',
          description: err instanceof Error ? err.message : 'Failed to upload recording',
          variant: 'destructive',
        });
      }
    }
  };

  const handleCancelRecording = () => {
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioChunks([]);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime('00:00');
    setRecordingState(RecordingState.INACTIVE);
    setIsVerificationDialogOpen(false);
    
    if (recordingSession) {
      stopRecording(recordingSession);
      setRecordingSession(null);
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  // Format seconds into MM:SS format
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Update playback position
  const handleSeek = (value: number[]) => {
    if (audioRef.current && audioUrl) {
      audioRef.current.currentTime = value[0];
      setCurrentPlaybackTime(value[0]);
    }
  };

  const renderVisualization = () => {
    if (!visualizationData || visualizationData.length === 0) {
      return (
        <div className="flex items-center justify-center h-12 bg-muted rounded-md">
          <Mic className="h-6 w-6 text-muted-foreground" />
        </div>
      );
    }

    return (
      <div className="flex items-end justify-center h-12 gap-0.5 bg-muted rounded-md overflow-hidden">
        {Array.from({ length: Math.min(40, visualizationData.length) }).map((_, i) => {
          const index = Math.floor(i * (visualizationData.length / 40));
          const value = visualizationData[index] / 255;
          return (
            <div
              key={i}
              className="w-1.5 bg-primary transition-all duration-75"
              style={{ height: `${Math.max(5, value * 100)}%` }}
            ></div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Audio Recorder
        </CardTitle>
        <CardDescription>
          Record your lecture, then verify the recording before uploading to Firebase Storage
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Recording Status */}
        {recordingState === RecordingState.RECORDING && (
          <Alert className="mb-4 bg-red-50 border-red-200">
            <Mic className="h-4 w-4 text-red-500 animate-pulse" />
            <AlertTitle>Recording in progress</AlertTitle>
            <AlertDescription>Speak clearly into your microphone. Click stop when finished.</AlertDescription>
          </Alert>
        )}

        {recordingState === RecordingState.REVIEWING && (
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <CheckCircle className="h-4 w-4 text-blue-500" />
            <AlertTitle>Recording complete</AlertTitle>
            <AlertDescription>
              Please review your recording before uploading to Firebase Storage.
            </AlertDescription>
          </Alert>
        )}

        {/* Audio Visualization */}
        {renderVisualization()}
        
        {/* Timer Display */}
        <div className="text-center font-mono text-lg my-2">
          {recordingTime}
        </div>
        
        {/* Playback Controls - Only show when in reviewing state */}
        {recordingState === RecordingState.REVIEWING && audioUrl && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>{formatTime(currentPlaybackTime)}</span>
              <span>{formatTime(audioDuration)}</span>
            </div>
            <Slider
              value={[currentPlaybackTime]}
              min={0}
              max={audioDuration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="my-2"
            />
          </div>
        )}
        
        {/* Upload Progress */}
        {recordingState === RecordingState.UPLOADING && (
          <div className="mt-4">
            <div className="flex justify-between mb-1 text-sm">
              <span>Uploading to Firebase Storage...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-wrap gap-2 justify-center">
        {recordingState === RecordingState.INACTIVE && (
          <Button
            onClick={handleStartRecording}
            disabled={recordingState === RecordingState.UPLOADING}
            className="gap-2"
          >
            <Mic className="h-4 w-4" /> Start Recording
          </Button>
        )}
        
        {recordingState === RecordingState.RECORDING && (
          <>
            <Button 
              onClick={handlePauseRecording} 
              variant="secondary"
              className="gap-2"
            >
              <Pause className="h-4 w-4" /> Pause
            </Button>
            
            <Button 
              onClick={handleStopRecording} 
              variant="secondary"
              className="gap-2"
            >
              <MicOff className="h-4 w-4" /> Stop
            </Button>
            
            <Button 
              onClick={handleCancelRecording} 
              variant="destructive"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" /> Cancel
            </Button>
          </>
        )}
        
        {recordingState === RecordingState.PAUSED && (
          <>
            <Button 
              onClick={handleResumeRecording} 
              variant="secondary"
              className="gap-2"
            >
              <Play className="h-4 w-4" /> Resume
            </Button>
            
            <Button 
              onClick={handleStopRecording} 
              variant="secondary"
              className="gap-2"
            >
              <MicOff className="h-4 w-4" /> Finish
            </Button>
            
            <Button 
              onClick={handleCancelRecording} 
              variant="destructive"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" /> Cancel
            </Button>
          </>
        )}
        
        {recordingState === RecordingState.REVIEWING && (
          <>
            <Button 
              onClick={handlePlayPause} 
              variant="secondary"
              className="gap-2"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Play
                </>
              )}
            </Button>
            
            <Button 
              onClick={() => setIsVerificationDialogOpen(true)} 
              className="gap-2"
            >
              <Upload className="h-4 w-4" /> Verify & Upload
            </Button>
            
            <Button 
              onClick={handleCancelRecording} 
              variant="destructive"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" /> Discard
            </Button>
          </>
        )}
      </CardFooter>

      {/* Audio Verification Dialog */}
      <Dialog open={isVerificationDialogOpen} onOpenChange={setIsVerificationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Recording</DialogTitle>
            <DialogDescription>
              Please verify your recording before uploading to Firebase Storage.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col space-y-4 py-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-full bg-muted">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Recording Complete</h4>
                <p className="text-sm text-muted-foreground">
                  Duration: {formatTime(audioDuration)}
                </p>
              </div>
            </div>
            
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Once uploaded, your audio will be saved to Firebase Storage and transcribed using OpenAI's Whisper API.
              </AlertDescription>
            </Alert>
            
            <div className="border rounded-md p-3">
              <h4 className="font-medium mb-2">Playback Controls</h4>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">{formatTime(currentPlaybackTime)}</span>
                <span className="text-sm">{formatTime(audioDuration)}</span>
              </div>
              <Slider
                value={[currentPlaybackTime]}
                min={0}
                max={audioDuration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="my-2"
              />
              <Button 
                onClick={handlePlayPause} 
                variant="outline"
                className="w-full mt-2 gap-2"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" /> Play
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline" 
              onClick={() => setIsVerificationDialogOpen(false)}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" /> Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleUploadRecording}
              className="gap-2"
            >
              <ArrowRight className="h-4 w-4" /> Upload to Firebase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AudioRecorder;