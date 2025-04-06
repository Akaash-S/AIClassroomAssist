import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Calendar, 
  CheckSquare, 
  FilePlus, 
  FileText, 
  Home 
} from 'lucide-react';
import { TaskList } from '@/components/tasks/TaskList';
import { StudentCalendar } from '@/components/calendar/StudentCalendar';
import { NotesViewer } from '@/components/notes/NotesViewer';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface StudentStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completedLectures: number;
  lecturesWithSummaries: number;
  totalLectures: number;
  tasksDueThisWeek: number;
  recentLectures: number;
}

export default function StudentDashboard() {
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchStudentStats();
    }
  }, [user]);

  const fetchStudentStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/stats/student/${user?.id}`);
      const statsData = await response.json();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching student stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard statistics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletionPercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="container mx-auto py-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
        <p className="text-muted-foreground mb-6">
          Welcome back, {user?.displayName}! Here's an overview of your academic progress.
        </p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats ? `${stats.completedTasks}/${stats.totalTasks}` : '-'}
              </div>
              <div className="mt-2">
                <Progress 
                  value={stats ? calculateCompletionPercentage(stats.completedTasks, stats.totalTasks) : 0} 
                  className="h-2"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats ? `${calculateCompletionPercentage(stats.completedTasks, stats.totalTasks)}% complete` : 'Loading...'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lectures Accessed</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats ? `${stats.completedLectures}/${stats.totalLectures}` : '-'}
              </div>
              <div className="mt-2">
                <Progress 
                  value={stats ? calculateCompletionPercentage(stats.completedLectures, stats.totalLectures) : 0} 
                  className="h-2"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats?.lecturesWithSummaries} lectures with summaries
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Deadlines</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.tasksDueThisWeek || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Tasks due in the next 7 days
              </p>
              {stats?.tasksDueThisWeek > 0 && (
                <Badge className="mt-2" variant={stats?.tasksDueThisWeek > 3 ? "destructive" : "default"}>
                  {stats?.tasksDueThisWeek > 3 ? 'High workload' : 'Manageable'}
                </Badge>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <FilePlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.recentLectures || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Lectures accessed in the last 30 days
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-6">
          <TabsTrigger value="tasks" className="flex items-center">
            <CheckSquare className="mr-2 h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Notes
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks">
          <TaskList onTaskUpdate={fetchStudentStats} />
        </TabsContent>
        
        <TabsContent value="calendar">
          <StudentCalendar />
        </TabsContent>
        
        <TabsContent value="notes">
          <NotesViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}