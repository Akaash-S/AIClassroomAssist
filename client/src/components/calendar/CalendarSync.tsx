import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  htmlLink: string;
}

export function CalendarSync() {
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncedEvents, setSyncedEvents] = useState<CalendarEvent[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleToggleSync = async (enabled: boolean) => {
    setSyncEnabled(enabled);
    
    if (enabled) {
      await syncCalendar();
    }
  };

  const syncCalendar = async () => {
    if (!user?.email) {
      toast({
        title: 'Error',
        description: 'Your email is not available. Please update your profile.',
        variant: 'destructive'
      });
      setSyncEnabled(false);
      return;
    }

    setSyncing(true);
    
    try {
      // Fetch all tasks with due dates
      const enrollmentsResponse = await fetch(`/api/enrollments?studentId=${user.id}`);
      const enrollments = await enrollmentsResponse.json();
      
      const courseIds = enrollments.map((enrollment: any) => enrollment.courseId);
      let allTasks: any[] = [];
      
      // Fetch tasks for each course
      for (const courseId of courseIds) {
        const tasksResponse = await fetch(`/api/tasks/course/${courseId}`);
        const courseTasks = await tasksResponse.json();
        
        // Only include tasks with due dates that aren't already synced
        const tasksWithDueDate = courseTasks.filter((task: any) => 
          task.dueDate && !task.calendarEventId
        );
        
        allTasks = [...allTasks, ...tasksWithDueDate];
      }
      
      // Sort tasks by due date (earliest first)
      allTasks.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
      
      if (allTasks.length === 0) {
        toast({
          title: 'No new tasks',
          description: 'There are no new tasks to synchronize with your calendar.',
        });
        setSyncing(false);
        return;
      }
      
      // Create calendar events for tasks
      const createdEvents = [];
      
      for (const task of allTasks) {
        try {
          // Make sure the email is valid before sending
          if (!user.email) {
            throw new Error('User email is not available');
          }
          
          const response = await fetch('/api/calendar/events', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              taskId: task.id,
              userEmail: user.email // No need to encode for JSON body
            })
          });
          
          if (response.ok) {
            const eventData = await response.json();
            createdEvents.push(eventData);
            
            // Update the task with the calendar event ID
            await fetch(`/api/tasks/${task.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                calendarEventId: eventData.id
              })
            });
          }
        } catch (err) {
          console.error(`Failed to create calendar event for task ${task.id}:`, err);
        }
      }
      
      setSyncedEvents(createdEvents);
      
      toast({
        title: 'Calendar Synchronized',
        description: `Successfully added ${createdEvents.length} tasks to your Google Calendar.`,
      });
    } catch (error) {
      console.error('Error syncing with calendar:', error);
      toast({
        title: 'Sync Failed',
        description: 'Failed to synchronize with your calendar. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Calendar Synchronization</CardTitle>
        <CardDescription>
          Sync your academic tasks with Google Calendar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <Switch
            id="calendar-sync"
            checked={syncEnabled}
            onCheckedChange={handleToggleSync}
            disabled={syncing}
          />
          <Label htmlFor="calendar-sync">
            {syncEnabled ? 'Calendar sync is enabled' : 'Enable calendar sync'}
          </Label>
        </div>
        
        {syncing && (
          <div className="flex items-center text-muted-foreground">
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
            Synchronizing tasks with your calendar...
          </div>
        )}
        
        {syncedEvents.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Recently synced events:</h4>
            <ul className="space-y-2">
              {syncedEvents.slice(0, 5).map(event => (
                <li key={event.id} className="text-sm flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                  <div>
                    <div>{event.summary}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(event.start.dateTime).toLocaleString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground flex items-start">
          <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          Calendar sync requires your Google account to have permission to access your calendar.
        </div>
      </CardFooter>
    </Card>
  );
}