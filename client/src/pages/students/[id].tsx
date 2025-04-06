import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Calendar,
  BarChart2,
  FileText,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Phone,
  AlertCircle
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StudentDetail {
  id: number;
  name: string;
  email: string;
  phone: string;
  enrollmentDate: string;
  enrolledCourses: number;
  completedLectures: number;
  totalLectures: number;
  completionRate: number;
  lastActivity: string;
  status: 'active' | 'inactive' | 'at-risk';
}

interface CourseProgress {
  id: number;
  name: string;
  progress: number;
  completedLectures: number;
  totalLectures: number;
  lastAccessed: string;
}

interface ActivityLog {
  id: number;
  type: 'lecture_view' | 'task_complete' | 'note_download' | 'login';
  description: string;
  timestamp: string;
  relatedItem?: string;
}

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.id;
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id && studentId) {
      fetchStudentData();
    }
  }, [user, studentId]);

  const fetchStudentData = async () => {
    setLoading(true);
    
    try {
      // Fetch student details
      const studentResponse = await fetch(`/api/students/${studentId}`);
      if (studentResponse.ok) {
        const studentData = await studentResponse.json();
        setStudent(studentData);
      }

      // Fetch courses progress
      const coursesResponse = await fetch(`/api/progress/student/${studentId}/courses`);
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setCourses(coursesData);
      }

      // Fetch activity logs
      const activitiesResponse = await fetch(`/api/activity-log/student/${studentId}`);
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setActivities(activitiesData);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load student data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // For preview purposes only - will be replaced with API data
  useEffect(() => {
    if (loading && !student) {
      // Sample data for UI development
      const sampleStudent: StudentDetail = {
        id: parseInt(studentId || '1'),
        name: "Emma Johnson",
        email: "emma.j@example.com",
        phone: "+1 (555) 123-4567",
        enrollmentDate: new Date(Date.now() - 86400000 * 60).toISOString(),
        enrolledCourses: 2,
        completedLectures: 15,
        totalLectures: 20,
        completionRate: 75,
        lastActivity: new Date().toISOString(),
        status: 'active'
      };
      
      const sampleCourses: CourseProgress[] = [
        {
          id: 1,
          name: "Introduction to Psychology",
          progress: 80,
          completedLectures: 8,
          totalLectures: 10,
          lastAccessed: new Date().toISOString()
        },
        {
          id: 2,
          name: "Advanced Mathematics",
          progress: 70,
          completedLectures: 7,
          totalLectures: 10,
          lastAccessed: new Date(Date.now() - 86400000 * 2).toISOString()
        }
      ];
      
      const sampleActivities: ActivityLog[] = [
        {
          id: 1,
          type: 'lecture_view',
          description: 'Viewed lecture: Introduction to Cognitive Psychology',
          timestamp: new Date().toISOString(),
          relatedItem: 'Introduction to Psychology'
        },
        {
          id: 2,
          type: 'task_complete',
          description: 'Completed task: Read Chapter 3 and submit notes',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          relatedItem: 'Introduction to Psychology'
        },
        {
          id: 3,
          type: 'note_download',
          description: 'Downloaded lecture notes: Memory and Learning',
          timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
          relatedItem: 'Introduction to Psychology'
        },
        {
          id: 4,
          type: 'login',
          description: 'Logged into the platform',
          timestamp: new Date(Date.now() - 86400000 * 3).toISOString()
        }
      ];
      
      setStudent(sampleStudent);
      setCourses(sampleCourses);
      setActivities(sampleActivities);
      setLoading(false);
    }
  }, [loading, student, studentId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'at-risk':
        return <Badge className="bg-yellow-500">At Risk</Badge>;
      case 'inactive':
        return <Badge className="bg-red-500">Inactive</Badge>;
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lecture_view':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'task_complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'note_download':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'login':
        return <User className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const sendReminder = () => {
    toast({
      title: 'Reminder Sent',
      description: 'A reminder email has been sent to the student'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container mx-auto py-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Student Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The student you're looking for doesn't exist or you don't have permission to view their information.
        </p>
        <Link href="/students">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Link href="/students">
          <Button variant="ghost" className="p-0 h-auto mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Button>
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold">{student.name}</h1>
            <div className="flex items-center mt-2">
              {getStatusBadge(student.status)}
              <span className="ml-3 text-muted-foreground">
                Student since {formatDate(student.enrollmentDate)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={sendReminder}>
              Send Reminder
            </Button>
            <Button>
              Message Student
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <BookOpen className="mr-2 h-4 w-4 text-blue-500" />
              Course Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student.completionRate}%</div>
            <p className="text-sm text-muted-foreground mb-2">
              {student.completedLectures} of {student.totalLectures} lectures
            </p>
            <Progress value={student.completionRate} className="h-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-green-500" />
              Enrolled Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student.enrolledCourses}</div>
            <p className="text-sm text-muted-foreground">Active courses</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Clock className="mr-2 h-4 w-4 text-purple-500" />
              Last Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{
              (() => {
                const date = new Date(student.lastActivity);
                const now = new Date();
                const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                
                if (diffDays === 0) return 'Today';
                if (diffDays === 1) return 'Yesterday';
                return `${diffDays} days ago`;
              })()
            }</div>
            <p className="text-sm text-muted-foreground">{formatDate(student.lastActivity)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-xl">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start">
              <Mail className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">Email</div>
                <a href={`mailto:${student.email}`} className="text-sm text-blue-600 hover:underline">
                  {student.email}
                </a>
              </div>
            </div>
            
            <div className="flex items-start">
              <Phone className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">Phone</div>
                <a href={`tel:${student.phone}`} className="text-sm text-blue-600 hover:underline">
                  {student.phone}
                </a>
              </div>
            </div>
            
            <div className="flex items-start">
              <Calendar className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">Enrolled Since</div>
                <div className="text-sm">{formatDate(student.enrollmentDate)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Course Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p>No course data available</p>
              </div>
            ) : (
              <div className="space-y-6">
                {courses.map((course) => (
                  <div key={course.id} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{course.name}</h3>
                      <span className="text-sm text-muted-foreground">
                        Last accessed: {formatDate(course.lastAccessed)}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground mb-1">
                      <span>{course.completedLectures} of {course.totalLectures} lectures completed</span>
                      <span className="ml-auto">{course.progress}%</span>
                    </div>
                    
                    <Progress value={course.progress} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
          <TabsTrigger value="activity" className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            Activity Log
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center">
            <BarChart2 className="mr-2 h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Recent Activity</CardTitle>
              <CardDescription>Student's recent interactions with course materials</CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No activity data available</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activity</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Date & Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="mr-3">
                              {getActivityIcon(activity.type)}
                            </div>
                            <span>{activity.description}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {activity.relatedItem || '-'}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const date = new Date(activity.timestamp);
                            return date.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                          })()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Performance Analytics</CardTitle>
              <CardDescription>Detailed performance metrics for this student</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Engagement Over Time</CardTitle>
                  </CardHeader>
                  <CardContent className="h-60 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <p className="mb-2">Interactive chart will be displayed here</p>
                      <p className="text-sm">Showing weekly login frequency and duration</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Task Completion Rate</CardTitle>
                  </CardHeader>
                  <CardContent className="h-60 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <p className="mb-2">Interactive chart will be displayed here</p>
                      <p className="text-sm">Showing task completion vs. due dates</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Course Performance Comparison</CardTitle>
                  </CardHeader>
                  <CardContent className="h-60 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <p className="mb-2">Interactive chart will be displayed here</p>
                      <p className="text-sm">Comparing performance across all enrolled courses</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}