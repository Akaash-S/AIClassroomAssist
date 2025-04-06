import { useState, useEffect, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume, Volume2, VolumeX, FastForward } from "lucide-react";

interface AudioPlayerProps {
  audioUrl?: string;
  audioContent?: string;
  audioType?: string;
  title: string;
  transcript?: Array<{ time: number; text: string }>;
  summary?: string;
}

// Simple formatTime function
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

const AudioPlayer = ({ audioUrl, audioContent, audioType, title, transcript, summary }: AudioPlayerProps) => {
  const [tempAudioUrl, setTempAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [progress, setProgress] = useState(0);
  const [activeTranscriptIndex, setActiveTranscriptIndex] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Create a temporary URL from audioContent if available
  useEffect(() => {
    // If we have audio content but no audio URL, create a blob URL
    if (audioContent && (!audioUrl || audioUrl === '')) {
      try {
        const binaryData = atob(audioContent);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        const blob = new Blob([bytes.buffer], { type: audioType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setTempAudioUrl(url);
      } catch (err) {
        console.error('Failed to convert audio content to blob URL', err);
      }
    }
    
    return () => {
      // Clean up the temporary URL when component unmounts
      if (tempAudioUrl) {
        URL.revokeObjectURL(tempAudioUrl);
      }
    };
  }, [audioContent, audioType, audioUrl]);
  
  // Initialize audio element
  useEffect(() => {
    const effectiveUrl = tempAudioUrl || audioUrl;
    
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    if (effectiveUrl) {
      audioRef.current.src = effectiveUrl;
      audioRef.current.load();
    }
    
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      if (audio) {
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / audio.duration) * 100 || 0);
        
        // Update active transcript index
        if (transcript && transcript.length > 0) {
          for (let i = transcript.length - 1; i >= 0; i--) {
            if (audio.currentTime >= transcript[i].time) {
              setActiveTranscriptIndex(i);
              break;
            }
          }
        }
      }
    };
    
    const handleLoadedMetadata = () => {
      if (audio) {
        setDuration(audio.duration);
      }
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
    };
    
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
    };
  }, [tempAudioUrl, audioUrl, transcript]);
  
  // Handle play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error("Failed to play audio:", error);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);
  
  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  
  // Handle playback rate changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);
  
  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      const newTime = (value[0] / 100) * (duration || 0);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };
  
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const handleChangeSpeed = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    setPlaybackRate(rates[nextIndex]);
  };

  // Sample transcript for demo if none provided
  const transcriptItems = transcript || [
    { time: 15, text: "Welcome to today's lecture on quantum computing fundamentals. We'll be covering the basic principles that make quantum computing different from classical computing." },
    { time: 88, text: "The key difference lies in how information is processed. Classical computers use bits, which can be either 0 or 1. Quantum computers use quantum bits or qubits, which can exist in multiple states simultaneously." },
    { time: 165, text: "This property, known as superposition, allows quantum computers to process a vast number of possibilities simultaneously. Another important concept is entanglement, where qubits become correlated in such a way that the state of one qubit instantly influences the state of another, regardless of distance." },
    { time: 250, text: "These properties give quantum computers the potential to solve certain problems much faster than classical computers. For example, Shor's algorithm for factoring large numbers could potentially break current encryption methods..." },
  ];
  
  // Check if audio is available
  const hasAudio = !!(audioUrl || tempAudioUrl);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">Lecture: {title}</h3>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          {/* Audio Player */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            {hasAudio ? (
              <div className="flex items-center space-x-4">
                <Button
                  variant="default"
                  size="icon"
                  className={`w-12 h-12 rounded-full bg-primary text-white hover:bg-primary/90`}
                  onClick={handleTogglePlay}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                
                <div className="flex-1">
                  <div className="relative">
                    <Slider
                      value={[progress]}
                      min={0}
                      max={100}
                      step={0.1}
                      className="w-full"
                      onValueChange={handleSeek}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-800"
                    onClick={handleToggleMute}
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : volume < 0.5 ? (
                      <Volume className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="w-20">
                    <Slider
                      value={[isMuted ? 0 : volume * 100]}
                      min={0}
                      max={100}
                      className="w-full"
                      onValueChange={handleVolumeChange}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-800"
                    onClick={handleChangeSpeed}
                  >
                    <span className="text-xs font-semibold">{playbackRate}x</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No audio available for this lecture
              </div>
            )}
          </div>
          
          {/* Transcript */}
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Transcript</h4>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 h-64 overflow-y-auto">
              {transcriptItems && transcriptItems.length > 0 ? (
                <div className="space-y-4">
                  {transcriptItems.map((item, index) => (
                    <div 
                      key={index} 
                      className={`transcript-item p-2 rounded ${index === activeTranscriptIndex ? "bg-primary/10 border-l-4 border-primary" : ""}`}
                    >
                      <div className="flex">
                        <span className="text-sm font-medium text-gray-500 w-16">
                          {formatTime(item.time)}
                        </span>
                        <p className="text-sm text-gray-800 flex-1">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No transcript available for this lecture
                </div>
              )}
            </div>
          </div>
          
          {/* Summary */}
          {summary && (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Lecture Summary</h4>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-800">{summary}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
