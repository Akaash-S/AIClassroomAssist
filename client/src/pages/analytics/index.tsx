import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Calendar,
  BookOpen,
  CheckCircle,
  FileText,
  Download
} from 'lucide-react';

// Placeholder components for charts
const BarChart = ({ title, description }: { title: string; description: string }) => (
  <div className="p-6 border rounded-md h-80 flex flex-col justify-center items-center">
    <BarChart2 className="h-12 w-12 text-muted-foreground mb-4" />
    <h3 className="text-lg font-medium mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground text-center max-w-xs">{description}</p>
  </div>
);

const LineChart = ({ title, description }: { title: string; description: string }) => (
  <div className="p-6 border rounded-md h-80 flex flex-col justify-center items-center">
    <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
    <h3 className="text-lg font-medium mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground text-center max-w-xs">{description}</p>
  </div>
);

// Interface definitions
interface AnalyticsSummary {
  totalStudents: number;
  activeStudents: number;
  totalCourses: number;
  totalLectures: number;
  avgCompletionRate: number;
  totalTasks: number;
  completedTasks: number;
}

interface CourseAnalytics {
  id: number;
  name: string;
  enrolledStudents: number;
  avgCompletionRate: number;
  totalLectures: number;
  popularLecture: string;
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [courses, setCourses] = useState<CourseAnalytics[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('month');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch analytics data
  useEffect(() => {
    if (user?.id) {
      fetchAnalyticsData();
    }
  }, [user, selectedTimeframe]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch summary analytics
      const summaryResponse = await fetch(`/api/analytics/summary/${user?.id}?timeframe=${selectedTimeframe}`);
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setSummary(summaryData);
      }

      // Fetch course analytics
      const coursesResponse = await fetch(`/api/analytics/courses/${user?.id}?timeframe=${selectedTimeframe}`);
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setCourses(coursesData);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // For preview purposes only - will be replaced with API data
  useEffect(() => {
    if (loading && !summary) {
      // Sample data for UI development
      const sampleSummary: AnalyticsSummary = {
        totalStudents: 42,
        activeStudents: 35,
        totalCourses: 4,
        totalLectures: 28,
        avgCompletionRate: 68,
        totalTasks: 96,
        completedTasks: 72
      };
      
      const sampleCourses: CourseAnalytics[] = [
        {
          id: 1,
          name: "Introduction to Psychology",
          enrolledStudents: 28,
          avgCompletionRate: 75,
          totalLectures: 10,
          popularLecture: "Memory and Learning"
        },
        {
          id: 2,
          name: "Advanced Mathematics",
          enrolledStudents: 18,
          avgCompletionRate: 62,
          totalLectures: 12,
          popularLecture: "Differential Equations"
        },
        {
          id: 3,
          name: "Principles of Economics",
          enrolledStudents: 22,
          avgCompletionRate: 58,
          totalLectures: 6,
          popularLecture: "Market Structures"
        }
      ];
      
      setSummary(sampleSummary);
      setCourses(sampleCourses);
      setLoading(false);
    }
  }, [loading, summary]);

  const handleTimeframeChange = (value: string) => {
    setSelectedTimeframe(value);
  };

  const downloadReport = () => {
    toast({
      title: 'Report Generation Started',
      description: 'Your analytics report is being generated and will download shortly'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            View insights about your courses, students, and content engagement.
          </p>
        </motion.div>

        <div className="flex items-center gap-4">
          <Select value={selectedTimeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="quarter">Last 3 months</SelectItem>
              <SelectItem value="year">Last 12 months</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={downloadReport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Users className="mr-2 h-4 w-4 text-blue-500" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalStudents || 0}</div>
            <div className="text-sm text-muted-foreground flex items-center mt-1">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span>{Math.round((summary?.activeStudents || 0) / (summary?.totalStudents || 1) * 100)}% active</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <BookOpen className="mr-2 h-4 w-4 text-purple-500" />
              Courses & Lectures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalCourses || 0}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {summary?.totalLectures || 0} total lectures
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              Task Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((summary?.completedTasks || 0) / (summary?.totalTasks || 1) * 100)}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {summary?.completedTasks || 0} of {summary?.totalTasks || 0} tasks
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <BarChart2 className="mr-2 h-4 w-4 text-amber-500" />
              Avg. Course Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.avgCompletionRate || 0}%</div>
            <div className="mt-1">
              <Progress value={summary?.avgCompletionRate || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-8">
          <TabsTrigger value="overview" className="flex items-center">
            <BarChart2 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center">
            <BookOpen className="mr-2 h-4 w-4" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Engagement
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <LineChart 
                title="Student Enrollment Over Time" 
                description="Graph showing how student enrollment has changed over the selected time period"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <BarChart 
                title="Course Engagement by Day" 
                description="Shows which days of the week have the highest student activity"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="md:col-span-2"
            >
              <LineChart 
                title="Overall Completion Progress" 
                description="Trends in course completion rates across all courses"
              />
            </motion.div>
          </div>
        </TabsContent>
        
        <TabsContent value="courses">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl">Course Performance</CardTitle>
                <CardDescription>Comparing enrollment and completion across your courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center border rounded-md">
                  <div className="text-center text-muted-foreground">
                    <BarChart2 className="h-12 w-12 mx-auto mb-4" />
                    <p className="mb-2">Comparative course performance chart</p>
                    <p className="text-sm">Visual comparison of enrollment and completion rates</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {courses.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{course.name}</CardTitle>
                  <CardDescription>
                    {course.enrolledStudents} students enrolled
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1 text-sm">
                        <span>Average Completion</span>
                        <span className="font-medium">{course.avgCompletionRate}%</span>
                      </div>
                      <Progress value={course.avgCompletionRate} className="h-2" />
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <div>
                        <div className="font-medium">{course.totalLectures}</div>
                        <div className="text-muted-foreground">Total Lectures</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{course.popularLecture}</div>
                        <div className="text-muted-foreground">Most Popular Lecture</div>
                      </div>
                    </div>

                    <Link href={`/analytics/courses/${course.id}`}>
                      <Button variant="outline" className="w-full mt-2">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="engagement">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <LineChart 
                title="Daily Active Students" 
                description="Number of students active each day over the selected time period"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <BarChart 
                title="Popular Study Times" 
                description="Shows which times of day have the highest student activity"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <LineChart 
                title="Content Engagement" 
                description="Compares engagement with different types of content (lectures, notes, etc.)"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <BarChart 
                title="Task Completion Rates" 
                description="Percentage of tasks completed on-time vs. late vs. incomplete"
              />
            </motion.div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Student Engagement Insights</CardTitle>
              <CardDescription>Key metrics about how students are interacting with your content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-blue-500" />
                    Average Session Time
                  </h3>
                  <div className="text-2xl font-bold mb-1">32 min</div>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    <span>+12% vs previous period</span>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-purple-500" />
                    Weekly Logins per Student
                  </h3>
                  <div className="text-2xl font-bold mb-1">3.8</div>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    <span>+8% vs previous period</span>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2 flex items-center">
                    <FileText className="mr-2 h-4 w-4 text-amber-500" />
                    Notes Download Rate
                  </h3>
                  <div className="text-2xl font-bold mb-1">68%</div>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                    <span>-3% vs previous period</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}