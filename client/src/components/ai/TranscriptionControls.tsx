import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transcribeLecture, summarizeLecture, extractLectureTasks } from '@/lib/aiServices';
import { Button } from '@/components/ui/button';
import { Wand2, FileText, ListTodo, RefreshCw, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface TranscriptionControlsProps {
  lectureId: number;
  hasAudio: boolean;
  hasTranscript: boolean;
  hasSummary: boolean;
  onSuccess?: () => void;
}

const TranscriptionControls: React.FC<TranscriptionControlsProps> = ({
  lectureId,
  hasAudio,
  hasTranscript,
  hasSummary,
  onSuccess,
}) => {
  const [aiEngine, setAiEngine] = useState<'openai' | 'gemini'>('openai');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Transcribe mutation
  const transcribeMutation = useMutation({
    mutationFn: () => transcribeLecture(lectureId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lectures', lectureId] });
      toast({
        title: 'Transcription Complete',
        description: 'Audio has been successfully transcribed.',
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Transcription Failed',
        description: `Error: ${(error as Error).message}`,
        variant: 'destructive',
      });
    },
  });

  // Summarize mutation
  const summarizeMutation = useMutation({
    mutationFn: () => summarizeLecture(lectureId, aiEngine),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lectures', lectureId] });
      toast({
        title: 'Summary Generated',
        description: `Summary successfully generated using ${aiEngine}.`,
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Summary Generation Failed',
        description: `Error: ${(error as Error).message}`,
        variant: 'destructive',
      });
    },
  });

  // Extract tasks mutation
  const extractTasksMutation = useMutation({
    mutationFn: () => extractLectureTasks(lectureId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/lecture', lectureId] });
      toast({
        title: 'Tasks Extracted',
        description: `Tasks successfully extracted from the transcript.`,
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Task Extraction Failed',
        description: `Error: ${(error as Error).message}`,
        variant: 'destructive',
      });
    },
  });

  const isProcessing = transcribeMutation.isPending || summarizeMutation.isPending || extractTasksMutation.isPending;
  
  const getCurrentStep = () => {
    if (transcribeMutation.isPending) return 'Transcribing audio...';
    if (summarizeMutation.isPending) return 'Generating summary...';
    if (extractTasksMutation.isPending) return 'Extracting tasks...';
    return '';
  };

  if (!hasAudio) {
    return (
      <Alert className="mb-4">
        <AlertTitle>No audio uploaded</AlertTitle>
        <AlertDescription>
          Please upload an audio recording before using transcription services.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-lg font-semibold">AI Processing</h3>
      
      {isProcessing && (
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{getCurrentStep()}</span>
            <RefreshCw className="h-4 w-4 animate-spin" />
          </div>
          <Progress value={33} className="h-2" />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="flex items-center"
          onClick={() => transcribeMutation.mutate()}
          disabled={isProcessing || !hasAudio || hasTranscript}
        >
          <FileText className="h-4 w-4 mr-2" />
          {hasTranscript ? (
            <>
              <Check className="h-3 w-3 mr-1" /> Transcribed
            </>
          ) : (
            'Transcribe Audio'
          )}
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center"
            onClick={() => summarizeMutation.mutate()}
            disabled={isProcessing || !hasTranscript || hasSummary}
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {hasSummary ? (
              <>
                <Check className="h-3 w-3 mr-1" /> Summarized
              </>
            ) : (
              'Generate Summary'
            )}
          </Button>
          
          {!hasSummary && (
            <Select 
              value={aiEngine} 
              onValueChange={(value) => setAiEngine(value as 'openai' | 'gemini')}
              disabled={isProcessing || !hasTranscript || hasSummary}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="gemini">Gemini</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        
        <Button
          variant="outline"
          className="flex items-center"
          onClick={() => extractTasksMutation.mutate()}
          disabled={isProcessing || !hasTranscript}
        >
          <ListTodo className="h-4 w-4 mr-2" />
          Extract Tasks
        </Button>
      </div>
    </div>
  );
};

export default TranscriptionControls;