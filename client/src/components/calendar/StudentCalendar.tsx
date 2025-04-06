import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card } from '@/components/ui/card';
import type { Task } from '@/lib/types';
import { format, parseISO } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: {
    description?: string;
    type?: string;
    taskId?: number;
  };
}

export function StudentCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      fetchTasks();
    }
  }, [user?.id]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Fetch all courses the student is enrolled in
      const enrollmentsResponse = await fetch(`/api/enrollments?studentId=${user?.id}`);
      const enrollments = await enrollmentsResponse.json();
      
      const courseIds = enrollments.map((enrollment: any) => enrollment.courseId);
      const allTasks: Task[] = [];
      
      // Fetch tasks for each course
      for (const courseId of courseIds) {
        const tasksResponse = await fetch(`/api/tasks/course/${courseId}`);
        const courseTasks = await tasksResponse.json();
        allTasks.push(...courseTasks);
      }
      
      // Convert tasks to calendar events
      const calendarEvents = allTasks.filter(task => task.dueDate).map(task => {
        // Set color based on task type and status
        let color = '#3498db'; // default blue
        if (task.type === 'quiz' || task.type === 'exam') {
          color = '#e74c3c'; // red for quizzes/exams
        } else if (task.type === 'reading') {
          color = '#2ecc71'; // green for readings
        } else if (task.type === 'project') {
          color = '#9b59b6'; // purple for projects
        } else if (task.type === 'presentation') {
          color = '#f39c12'; // orange for presentations
        } else if (task.type === 'lab') {
          color = '#1abc9c'; // teal for labs
        }
        
        // If completed, make it a lighter color
        if (task.completed) {
          color = '#aaaaaa'; // gray for completed
        }
        
        // Parse the due date safely
        let startDate;
        try {
          // Handle both string and Date objects
          startDate = typeof task.dueDate === 'string' 
            ? new Date(task.dueDate).toISOString().split('T')[0]
            : (task.dueDate as Date).toISOString().split('T')[0];
        } catch (e) {
          // If date parsing fails, use today's date
          console.warn(`Failed to parse date for task ${task.id}: ${task.dueDate}`);
          startDate = new Date().toISOString().split('T')[0];
        }
        
        // Create calendar event
        return {
          id: `task-${task.id}`,
          title: task.title,
          start: startDate,
          allDay: true,
          backgroundColor: color,
          borderColor: color,
          textColor: '#ffffff',
          extendedProps: {
            description: task.description,
            type: task.type,
            taskId: task.id,
            priority: task.priority
          }
        };
      });
      
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching tasks for calendar:', error);
      toast({
        title: 'Error',
        description: 'Failed to load academic calendar',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (info: any) => {
    const { extendedProps } = info.event;
    const startDate = info.event.start;
    
    // Format the due date for display
    const formattedDate = startDate ? format(startDate, 'PPP') : 'No date specified';
    
    const taskType = extendedProps.type ? `Type: ${extendedProps.type}` : '';
    const taskDesc = extendedProps.description || 'No description available';
    
    // Display priority if available
    let priorityText = '';
    if (extendedProps.priority !== undefined) {
      const priorityLabels = ['Low', 'Medium', 'High'];
      const priority = Math.min(Math.max(0, extendedProps.priority), 2); // Ensure within 0-2 range
      priorityText = `Priority: ${priorityLabels[priority]}`;
    }
    
    // Create a more comprehensive description
    const description = `
${taskDesc}

${taskType}${priorityText ? `\n${priorityText}` : ''}
Due: ${formattedDate}
    `.trim();
    
    toast({
      title: info.event.title,
      description,
    });
  };

  return (
    <div>
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <Card className="p-4">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek'
            }}
            height="auto"
            eventClick={handleEventClick}
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short'
            }}
          />
        </Card>
      )}
    </div>
  );
}