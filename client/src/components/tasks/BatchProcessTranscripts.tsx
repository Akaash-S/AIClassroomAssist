import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProcessedResult {
  lectureId: number;
  lectureTitle: string;
  tasksExtracted: number;
  successful: boolean;
  message: string;
}

export function BatchProcessTranscripts() {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ProcessedResult[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const processAllTranscripts = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to process transcripts',
        variant: 'destructive'
      });
      return;
    }

    setProcessing(true);
    setProgress(0);
    setResults([]);
    
    try {
      // 1. Get all lectures with transcripts
      // We need to include either teacherId or courseId as required by the API
      let allLectures = [];
      
      if (user.role === 'teacher') {
        // If user is a teacher, get lectures by teacherId
        const lecturesResponse = await fetch(`/api/lectures?teacherId=${user.id}`);
        allLectures = await lecturesResponse.json();
      } else if (user.role === 'student') {
        // If user is a student, get enrollments and then lectures from each course
        const enrollmentsResponse = await fetch(`/api/enrollments?studentId=${user.id}`);
        const enrollments = await enrollmentsResponse.json();
        
        // For each enrollment, get lectures for that course
        for (const enrollment of enrollments) {
          const courseLecturesResponse = await fetch(`/api/lectures?courseId=${enrollment.courseId}`);
          const courseLectures = await courseLecturesResponse.json();
          allLectures = [...allLectures, ...courseLectures];
        }
      } else {
        // Handle other roles or fallback to a default query
        const lecturesResponse = await fetch(`/api/lectures?teacherId=${user.id}`);
        allLectures = await lecturesResponse.json();
      }
      
      // Filter to only include lectures with transcript content
      console.log("All lectures:", allLectures);
      const lecturesWithTranscripts = allLectures.filter((lecture: any) => 
        lecture.transcriptContent && lecture.transcriptContent.trim() !== '');
      
      if (lecturesWithTranscripts.length === 0) {
        toast({
          title: 'No Transcripts Found',
          description: 'There are no lectures with transcripts to process',
          variant: 'destructive'
        });
        setProcessing(false);
        return;
      }
      
      const processResults: ProcessedResult[] = [];
      
      // For each lecture with a transcript, extract tasks
      for (let i = 0; i < lecturesWithTranscripts.length; i++) {
        const lecture = lecturesWithTranscripts[i];
        setProgress(Math.floor((i / lecturesWithTranscripts.length) * 100));
        
        try {
          // Extract tasks from transcript
          const taskResponse = await fetch(`/api/extract-tasks/${lecture.id}?fallback=true`, {
            method: 'POST'
          });
          
          if (taskResponse.ok) {
            const taskData = await taskResponse.json();
            
            // Add the result
            processResults.push({
              lectureId: lecture.id,
              lectureTitle: lecture.title,
              tasksExtracted: taskData.tasks.length,
              successful: true,
              message: `${taskData.tasks.length} tasks extracted`
            });
            
            // Update the tasks in the calendar if the user is a student
            if (user.role === 'student' && taskData.tasks.length > 0) {
              try {
                // For each task, check if it has a due date and not already in calendar
                for (const task of taskData.tasks) {
                  if (task.dueDate && !task.calendarEventId) {
                    // Add to calendar
                    await fetch('/api/calendar/events', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        taskId: task.id,
                        userEmail: user.email
                      })
                    });
                  }
                }
              } catch (calendarError) {
                console.error(`Error syncing tasks to calendar for lecture ${lecture.id}:`, calendarError);
              }
            }
          } else {
            throw new Error(`Failed to extract tasks: ${(await taskResponse.json()).message}`);
          }
        } catch (error) {
          console.error(`Error processing lecture ${lecture.id}:`, error);
          processResults.push({
            lectureId: lecture.id,
            lectureTitle: lecture.title,
            tasksExtracted: 0,
            successful: false,
            message: `Error: ${(error as Error).message}`
          });
        }
      }
      
      setProgress(100);
      setResults(processResults);
      
      const totalTasksExtracted = processResults.reduce((sum, result) => sum + result.tasksExtracted, 0);
      const successfulLectures = processResults.filter(r => r.successful).length;
      
      toast({
        title: 'Processing Complete',
        description: `Successfully processed ${successfulLectures} of ${lecturesWithTranscripts.length} lectures. Extracted ${totalTasksExtracted} tasks.`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error processing transcripts:', error);
      toast({
        title: 'Error',
        description: `Failed to process transcripts: ${(error as Error).message}`,
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Batch Process Transcripts</CardTitle>
        <CardDescription>
          Extract tasks from all lecture transcripts and add them to your calendar
        </CardDescription>
      </CardHeader>
      <CardContent>
        {processing ? (
          <div className="space-y-4">
            <div className="flex items-center text-muted-foreground">
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              Processing transcripts and extracting tasks...
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-muted-foreground">{progress}% complete</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <Button 
              onClick={processAllTranscripts} 
              disabled={processing}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
              Process All Transcripts
            </Button>
            
            {results.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Processing Results:</h4>
                <div className="overflow-auto max-h-[300px] border rounded-md">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Lecture</th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tasks</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {results.map((result, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{result.lectureTitle}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {result.successful ? (
                              <span className="flex items-center text-green-500">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Success
                              </span>
                            ) : (
                              <span className="flex items-center text-red-500">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{result.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          This process will extract academic tasks from lecture transcripts and add them to your calendar and task list.
        </div>
      </CardFooter>
    </Card>
  );
}