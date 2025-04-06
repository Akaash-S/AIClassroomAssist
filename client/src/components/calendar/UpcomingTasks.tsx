import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Calendar, CalendarCheck2, CheckCircle, ClipboardCheck, GraduationCap, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UpcomingTasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load tasks from enrolled courses
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;
      
      setLoading(true);
      
      try {
        // Fetch enrollments for student
        const enrollmentsResponse = await fetch(`/api/enrollments?studentId=${user.id}`);
        if (!enrollmentsResponse.ok) throw new Error('Failed to fetch enrollments');
        
        const enrollments = await enrollmentsResponse.json();
        const courseIds = enrollments.map((enrollment: any) => enrollment.courseId);
        
        if (courseIds.length === 0) {
          setTasks([]);
          return;
        }
        
        // Fetch tasks for all enrolled courses
        let allTasks: any[] = [];
        
        for (const courseId of courseIds) {
          const tasksResponse = await fetch(`/api/tasks/course/${courseId}`);
          if (!tasksResponse.ok) continue;
          
          const courseTasks = await tasksResponse.json();
          allTasks = [...allTasks, ...courseTasks];
        }
        
        // Filter for upcoming tasks with due dates, not completed
        const now = new Date();
        const upcomingTasks = allTasks
          .filter(task => task.dueDate && !task.completed && new Date(task.dueDate) >= now)
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        
        setTasks(upcomingTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast({
          title: 'Error',
          description: 'Failed to load upcoming tasks',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, [user, toast]);
  
  // Mark task as completed
  const handleMarkComplete = async (taskId: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          completed: true
        })
      });
      
      if (response.ok) {
        // Update local state
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, completed: true } : task
        ).filter(task => !task.completed));
        
        toast({
          title: 'Task completed',
          description: 'Task marked as completed successfully',
        });
      }
    } catch (error) {
      console.error('Error marking task as complete:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive'
      });
    }
  };
  
  // Get appropriate icon based on task type
  const getTaskIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'assignment':
        return <PenLine className="h-4 w-4" />;
      case 'quiz':
        return <ClipboardCheck className="h-4 w-4" />;
      case 'reading':
        return <BookOpen className="h-4 w-4" />;
      case 'project':
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };
  
  // Get appropriate color based on priority
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 2:
        return "bg-red-500/10 text-red-500 border-red-200";
      case 1: 
        return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case 0:
      default:
        return "bg-blue-500/10 text-blue-600 border-blue-200";
    }
  };
  
  // Get formatted priority label
  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 2:
        return "High";
      case 1:
        return "Medium";
      case 0:
      default:
        return "Low";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarCheck2 className="h-5 w-5 mr-2" />
          Upcoming Tasks
        </CardTitle>
        <CardDescription>
          Tasks extracted from your lecture recordings
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No upcoming tasks found
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.slice(0, 5).map(task => (
              <div 
                key={task.id} 
                className="p-3 rounded-md border flex items-start justify-between bg-card"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 rounded-md bg-primary/10">
                      {getTaskIcon(task.type)}
                    </span>
                    <h4 className="font-medium text-sm">{task.title}</h4>
                  </div>
                  
                  <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
                    {task.description || "No description"}
                  </div>
                  
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {task.type}
                    </Badge>
                    
                    {task.dueDate && (
                      <Badge variant="outline" className="text-xs">
                        Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      </Badge>
                    )}
                    
                    {task.priority !== undefined && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(task.priority)}`}
                      >
                        {getPriorityLabel(task.priority)}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="ml-2 h-7 w-7"
                  onClick={() => handleMarkComplete(task.id)}
                  title="Mark as completed"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {tasks.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="link" size="sm">
                  View all {tasks.length} tasks
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}