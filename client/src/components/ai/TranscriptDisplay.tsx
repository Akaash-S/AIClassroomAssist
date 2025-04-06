import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileAudio, FileText, FileSpreadsheet } from 'lucide-react';

interface TranscriptDisplayProps {
  transcript?: string;
  summary?: string;
  isLoading?: boolean;
}

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  transcript,
  summary,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!transcript && !summary) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            No Content Available
          </CardTitle>
          <CardDescription>
            This lecture hasn't been transcribed or summarized yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Use the AI Processing tools above to transcribe the lecture audio and generate a summary.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="transcript" className="mt-6">
      <TabsList className="mb-4">
        <TabsTrigger value="transcript" disabled={!transcript} className="flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          Transcript
        </TabsTrigger>
        <TabsTrigger value="summary" disabled={!summary} className="flex items-center">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Summary
        </TabsTrigger>
      </TabsList>
      <TabsContent value="transcript">
        {transcript ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Full Transcript
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-line">
                {transcript}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <FileAudio className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No transcript available. Process the audio recording to generate a transcript.</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
      <TabsContent value="summary">
        {summary ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileSpreadsheet className="h-5 w-5 mr-2" />
                Lecture Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-line">
                {summary}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No summary available. Generate a summary from the transcript.</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default TranscriptDisplay;