import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';
import { ChevronRight, Clock, FileCheck, FileText, GraduationCap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CourseProgress {
  courseId: number;
  courseName: string;
  completedLectures: number;
  totalLectures: number;
  percentComplete: number;
  lastAccessedDate: string;
}

interface LectureProgress {
  lectureId: number;
  title: string;
  courseName: string;
  completionStatus: 'completed' | 'in-progress' | 'not-started';
  hasTranscript: boolean;
  hasSummary: boolean;
  accessDate: string;
  accessCount: number;
}

export default function ProgressPage() {
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [lectureProgress, setLectureProgress] = useState<LectureProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchProgressData();
    }
  }, [user]);

  const fetchProgressData = async () => {
    setLoading(true);
    try {
      // Fetch student progress for courses
      const coursesResponse = await fetch(`/api/progress/courses/${user?.id}`);
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setCourseProgress(coursesData);
      }

      // Fetch student progress for lectures
      const lecturesResponse = await fetch(`/api/progress/lectures/${user?.id}`);
      if (lecturesResponse.ok) {
        const lecturesData = await lecturesResponse.json();
        setLectureProgress(lecturesData);
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load progress data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // For preview purposes only - will be replaced with API data
  useEffect(() => {
    if (loading && courseProgress.length === 0 && lectureProgress.length === 0) {
      // Sample data for UI development
      setCourseProgress([
        {
          courseId: 1,
          courseName: "Introduction to Psychology",
          completedLectures: 8,
          totalLectures: 12,
          percentComplete: 67,
          lastAccessedDate: new Date().toISOString()
        },
        {
          courseId: 2,
          courseName: "Advanced Mathematics",
          completedLectures: 5,
          totalLectures: 15,
          percentComplete: 33,
          lastAccessedDate: new Date(Date.now() - 86400000 * 2).toISOString()
        }
      ]);
      
      setLectureProgress([
        {
          lectureId: 1,
          title: "Introduction to Cognitive Psychology",
          courseName: "Introduction to Psychology",
          completionStatus: "completed",
          hasTranscript: true,
          hasSummary: true,
          accessDate: new Date().toISOString(),
          accessCount: 3
        },
        {
          lectureId: 2,
          title: "Memory and Learning",
          courseName: "Introduction to Psychology",
          completionStatus: "in-progress",
          hasTranscript: true,
          hasSummary: false,
          accessDate: new Date(Date.now() - 86400000).toISOString(),
          accessCount: 1
        },
        {
          lectureId: 3,
          title: "Differential Equations",
          courseName: "Advanced Mathematics",
          completionStatus: "not-started",
          hasTranscript: false,
          hasSummary: false,
          accessDate: "",
          accessCount: 0
        }
      ]);
      
      setLoading(false);
    }
  }, [loading, courseProgress.length, lectureProgress.length]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'not-started':
        return <Badge className="bg-gray-500">Not Started</Badge>;
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

  return (
    <div className="container mx-auto py-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2">My Progress</h1>
        <p className="text-muted-foreground mb-6">
          Track your learning journey across all courses and lectures.
        </p>
      </motion.div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
          <TabsTrigger value="courses" className="flex items-center">
            <GraduationCap className="mr-2 h-4 w-4" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="lectures" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Lectures
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Course Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : courseProgress.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>You haven't enrolled in any courses yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {courseProgress.map((course) => (
                    <div key={course.courseId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-medium">{course.courseName}</h3>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mb-3">
                        <FileCheck className="mr-2 h-4 w-4" />
                        <span>{course.completedLectures} of {course.totalLectures} lectures completed</span>
                      </div>
                      <Progress value={course.percentComplete} className="h-2 mb-2" />
                      <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                        <span>{course.percentComplete}% complete</span>
                        <div className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          <span>Last accessed: {formatDate(course.lastAccessedDate)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="lectures">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Lecture Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : lectureProgress.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>You haven't accessed any lectures yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lecture Title</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Resources</TableHead>
                        <TableHead>Last Accessed</TableHead>
                        <TableHead className="text-right">Access Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lectureProgress.map((lecture) => (
                        <TableRow key={lecture.lectureId}>
                          <TableCell className="font-medium">{lecture.title}</TableCell>
                          <TableCell>{lecture.courseName}</TableCell>
                          <TableCell>{getStatusBadge(lecture.completionStatus)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {lecture.hasTranscript && (
                                <Badge variant="outline" className="bg-gray-100">Transcript</Badge>
                              )}
                              {lecture.hasSummary && (
                                <Badge variant="outline" className="bg-gray-100">Summary</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(lecture.accessDate)}</TableCell>
                          <TableCell className="text-right">{lecture.accessCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}