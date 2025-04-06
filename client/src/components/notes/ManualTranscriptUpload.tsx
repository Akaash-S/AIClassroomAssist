import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

interface Lecture {
  id: number;
  title: string;
  courseId: number;
  transcriptContent?: string;
}

export function ManualTranscriptUpload() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedLectureId, setSelectedLectureId] = useState<string>('');
  const [transcriptContent, setTranscriptContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchLectures();
  }, [user]);

  const fetchLectures = async () => {
    if (!user) return;
    
    setIsFetching(true);
    try {
      const teacherId = user.id;
      const response = await fetch(`/api/lectures?teacherId=${teacherId}`);
      
      if (response.ok) {
        const data = await response.json();
        setLectures(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load lectures",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching lectures:", error);
      toast({
        title: "Error",
        description: "Failed to load lectures",
        variant: "destructive"
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleLectureChange = async (lectureId: string) => {
    setSelectedLectureId(lectureId);
    
    if (!lectureId) {
      setTranscriptContent('');
      return;
    }
    
    setIsFetching(true);
    try {
      const response = await fetch(`/api/lectures/${lectureId}`);
      
      if (response.ok) {
        const lecture = await response.json();
        setTranscriptContent(lecture.transcriptContent || '');
      }
    } catch (error) {
      console.error("Error fetching lecture details:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedLectureId || !transcriptContent.trim()) {
      toast({
        title: "Error",
        description: "Please select a lecture and enter transcript content",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/lectures/${selectedLectureId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transcriptContent
        })
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Transcript content updated successfully",
          variant: "default"
        });
        
        // Update the lecture in the local state
        setLectures(lectures.map(lecture => 
          lecture.id === parseInt(selectedLectureId) 
            ? { ...lecture, transcriptContent } 
            : lecture
        ));
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to update transcript");
      }
    } catch (error) {
      console.error("Error updating transcript:", error);
      toast({
        title: "Error",
        description: `Failed to update transcript: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Transcript Upload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="lecture-select">Select Lecture</Label>
          <Select 
            value={selectedLectureId} 
            onValueChange={handleLectureChange}
            disabled={isFetching || isLoading}
          >
            <SelectTrigger id="lecture-select">
              <SelectValue placeholder="Select a lecture" />
            </SelectTrigger>
            <SelectContent>
              {lectures.map(lecture => (
                <SelectItem key={lecture.id} value={lecture.id.toString()}>
                  {lecture.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="transcript-content">Transcript Content</Label>
          <Textarea
            id="transcript-content"
            placeholder="Enter the lecture transcript here..."
            value={transcriptContent}
            onChange={(e) => setTranscriptContent(e.target.value)}
            className="min-h-[200px]"
            disabled={isFetching || isLoading || !selectedLectureId}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading || isFetching || !selectedLectureId || !transcriptContent.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : 'Save Transcript'}
        </Button>
      </CardFooter>
    </Card>
  );
}