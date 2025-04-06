import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, FilterX, PlusCircle, Trash2, CalendarClock, AlertTriangle, RefreshCw, CalendarPlus } from 'lucide-react';
import { getCourseTasks, updateTask } from '@/lib/aiServices';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { format, isPast, isThisWeek, addDays, parseISO } from 'date-fns';
import { Task } from '@/lib/types';

interface TaskListProps {
  onTaskUpdate?: () => void;
}

export function TaskList({ onTaskUpdate }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [courseId, setCourseId] = useState<number | null>(null);
  const [courses, setCourses] = useState<{ id: number; name: string }[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (courseId !== null) {
      fetchTasks(courseId);
    }
  }, [courseId]);

  const fetchCourses = async () => {
    try {
      if (user?.id) {
        const enrollmentsResponse = await fetch(`/api/enrollments?studentId=${user.id}`);
        const enrollments = await enrollmentsResponse.json();
        
        const courseIds = enrollments.map((enrollment: any) => enrollment.courseId);
        const courseList: { id: number; name: string }[] = [];
        
        for (const courseId of courseIds) {
          const courseResponse = await fetch(`/api/courses/${courseId}`);
          const course = await courseResponse.json();
          courseList.push(course);
        }
        
        setCourses(courseList);
        
        if (courseList.length > 0) {
          setCourseId(courseList[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive'
      });
    }
  };

  const fetchTasks = async (courseId: number) => {
    setLoading(true);
    try {
      const tasks = await getCourseTasks(courseId);
      setTasks(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCheck = async (taskId: number, completed: boolean) => {
    try {
      const updatedTask = await updateTask(taskId, { completed });
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, completed } : task
        )
      );
      
      if (onTaskUpdate) {
        onTaskUpdate();
      }
      
      toast({
        title: 'Success',
        description: `Task marked as ${completed ? 'completed' : 'incomplete'}`,
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

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return { label: 'Low', variant: 'outline' as const };
      case 2: return { label: 'Medium', variant: 'default' as const };
      case 3: return { label: 'High', variant: 'destructive' as const };
      default: return { label: 'Normal', variant: 'outline' as const };
    }
  };
  
  const getTaskTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'assignment': return { label: 'Assignment', variant: 'default' as const, icon: null };
      case 'reading': return { label: 'Reading', variant: 'secondary' as const, icon: null };
      case 'quiz': return { label: 'Quiz', variant: 'destructive' as const, icon: null };
      case 'exam': return { label: 'Exam', variant: 'destructive' as const, icon: <AlertTriangle className="h-3 w-3" /> };
      case 'project': return { label: 'Project', variant: 'default' as const, icon: null };
      default: return { label: type, variant: 'outline' as const, icon: null };
    }
  };

  const formatDueDate = (dueDate: string | Date | undefined) => {
    if (!dueDate) return 'No due date';
    
    const date = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
    
    if (isPast(date) && !isThisWeek(date)) {
      return `Overdue: ${format(date, 'MMM d, yyyy')}`;
    } else if (isThisWeek(date)) {
      return `This week: ${format(date, 'EEE, MMM d')}`;
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  const getDueDateColor = (dueDate: string | Date | undefined) => {
    if (!dueDate) return 'text-muted-foreground';
    
    const date = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
    
    if (isPast(date) && !isThisWeek(date)) {
      return 'text-destructive font-semibold';
    } else if (isThisWeek(date)) {
      return 'text-warning font-semibold';
    }
    return 'text-muted-foreground';
  };

  const filterTasks = (tasks: Task[]) => {
    let filteredTasks = [...tasks];
    
    // Apply filter
    switch (filter) {
      case 'completed':
        filteredTasks = filteredTasks.filter(task => task.completed);
        break;
      case 'pending':
        filteredTasks = filteredTasks.filter(task => !task.completed);
        break;
      case 'overdue':
        filteredTasks = filteredTasks.filter(task => 
          !task.completed && 
          task.dueDate && 
          isPast(typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate)
        );
        break;
      case 'thisWeek':
        filteredTasks = filteredTasks.filter(task => 
          !task.completed && 
          task.dueDate && 
          isThisWeek(typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate)
        );
        break;
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'dueDate':
        filteredTasks.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
        break;
      case 'priority':
        filteredTasks.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        break;
      case 'title':
        filteredTasks.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    
    return filteredTasks;
  };

  const showTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const getCourseName = (courseId: number) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.name : 'Unknown Course';
  };

  const filteredTasks = filterTasks(tasks);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">Task List</CardTitle>
            <CardDescription>Manage your assignments, readings, and deadlines</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Select onValueChange={(value) => setCourseId(parseInt(value))} value={courseId?.toString()}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Select onValueChange={setFilter} defaultValue="all">
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="thisWeek">This Week</SelectItem>
              </SelectContent>
            </Select>
            
            <Select onValueChange={setSortBy} defaultValue="dueDate">
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <FilterX className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-1">No Tasks Found</h3>
              <p className="text-muted-foreground">
                There are currently no tasks for this course.
              </p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <FilterX className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-1">No Matching Tasks</h3>
              <p className="text-muted-foreground">
                There are no tasks matching your current filter.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setFilter('all')}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <AnimatePresence>
              <ul className="space-y-3">
                {filteredTasks.map((task) => (
                  <motion.li
                    key={task.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div 
                      className={`flex items-start p-4 bg-card border rounded-lg hover:shadow-md transition-all ${task.completed ? 'opacity-60' : ''}`}
                      onClick={() => showTaskDetails(task)}
                    >
                      <div className="mr-4 mt-1" onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                          checked={task.completed}
                          onCheckedChange={(checked) => {
                            if (typeof checked === 'boolean') {
                              handleTaskCheck(task.id, checked);
                            }
                          }}
                        />
                      </div>
                      <div className="flex-grow cursor-pointer">
                        <div className="flex items-center mb-1">
                          <h3 className={`font-semibold ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </h3>
                          <div className="flex ml-auto space-x-2">
                            {task.priority && (
                              <Badge variant={getPriorityLabel(task.priority).variant}>
                                {getPriorityLabel(task.priority).label} Priority
                              </Badge>
                            )}
                            {task.type && (
                              <Badge 
                                variant={getTaskTypeLabel(task.type).variant} 
                                className="flex items-center"
                              >
                                {getTaskTypeLabel(task.type).icon && (
                                  <span className="mr-1">{getTaskTypeLabel(task.type).icon}</span>
                                )}
                                {getTaskTypeLabel(task.type).label}
                              </Badge>
                            )}
                            {task.calendarEventId && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className="flex items-center">
                                      <CalendarClock className="h-3 w-3 mr-1" />
                                      Calendar
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Added to your Google Calendar</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                        {task.description && (
                          <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center text-xs">
                          {task.dueDate && (
                            <div className={`flex items-center ${getDueDateColor(task.dueDate)}`}>
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDueDate(task.dueDate)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </AnimatePresence>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-xs text-muted-foreground">
            {!loading && `Showing ${filteredTasks.length} of ${tasks.length} tasks`}
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchTasks(courseId || 0)} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardFooter>
      </Card>
      
      {/* Task Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
            <DialogDescription className="flex flex-wrap gap-2 mt-2">
              {selectedTask?.type && (
                <Badge variant={getTaskTypeLabel(selectedTask.type).variant}>
                  {getTaskTypeLabel(selectedTask.type).label}
                </Badge>
              )}
              {selectedTask?.priority && (
                <Badge variant={getPriorityLabel(selectedTask.priority).variant}>
                  {getPriorityLabel(selectedTask.priority).label} Priority
                </Badge>
              )}
              <Badge variant="outline">
                {getCourseName(selectedTask?.courseId || 0)}
              </Badge>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTask?.description && (
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              {selectedTask?.dueDate && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Due Date</h4>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className={getDueDateColor(selectedTask.dueDate)}>
                      {formatDueDate(selectedTask.dueDate)}
                    </span>
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium mb-1">Status</h4>
                <div className="flex items-center">
                  <Checkbox 
                    checked={selectedTask?.completed}
                    onCheckedChange={(checked) => {
                      if (selectedTask && typeof checked === 'boolean') {
                        handleTaskCheck(selectedTask.id, checked);
                      }
                    }}
                    className="mr-2"
                  />
                  <span>{selectedTask?.completed ? 'Completed' : 'Pending'}</span>
                </div>
              </div>
            </div>
            
            {selectedTask?.calendarEventId && (
              <div>
                <h4 className="text-sm font-medium mb-1">Calendar</h4>
                <p className="text-sm text-muted-foreground flex items-center">
                  <CalendarClock className="h-4 w-4 mr-2" />
                  Added to your Google Calendar
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsDialogOpen(false)}
            >
              Close
            </Button>
            
            {!selectedTask?.completed && (
              <Button
                variant="default"
                onClick={() => {
                  if (selectedTask) {
                    handleTaskCheck(selectedTask.id, true);
                    setIsDialogOpen(false);
                  }
                }}
              >
                Mark as Completed
              </Button>
            )}
            
            {!selectedTask?.calendarEventId && selectedTask?.dueDate && (
              <Button
                variant="outline"
                className="flex items-center"
                onClick={async () => {
                  if (selectedTask && user?.email) {
                    try {
                      const response = await fetch('/api/calendar/events', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          taskId: selectedTask.id,
                          userEmail: user.email,
                        }),
                      });
                      
                      if (response.ok) {
                        const data = await response.json();
                        // Update the task in the local state with the calendar event ID
                        setTasks(prevTasks => 
                          prevTasks.map(task => 
                            task.id === selectedTask.id 
                              ? { ...task, calendarEventId: data.task.calendarEventId } 
                              : task
                          )
                        );
                        
                        // Update the selected task
                        setSelectedTask({
                          ...selectedTask,
                          calendarEventId: data.task.calendarEventId
                        });
                        
                        toast({
                          title: 'Success',
                          description: 'Task added to your Google Calendar',
                        });
                      } else {
                        throw new Error('Failed to add to calendar');
                      }
                    } catch (error) {
                      console.error('Error adding task to calendar:', error);
                      toast({
                        title: 'Error',
                        description: 'Failed to add task to calendar',
                        variant: 'destructive'
                      });
                    }
                  } else if (!user?.email) {
                    toast({
                      title: 'Error',
                      description: 'Email is required to add task to calendar',
                      variant: 'destructive'
                    });
                  }
                }}
              >
                <CalendarPlus className="h-4 w-4 mr-2" />
                Add to Calendar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}