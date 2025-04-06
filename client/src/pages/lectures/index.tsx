import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Filter, 
  Plus, 
  BookOpen, 
  FileText, 
  Clock, 
  Calendar, 
  MoreHorizontal,
  Headphones,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface Lecture {
  id: number;
  title: string;
  courseName: string;
  description?: string;
  date: string;
  duration: number;
  hasTranscript: boolean;
  hasSummary: boolean;
  processingStatus: 'complete' | 'processing' | 'failed';
}

interface Course {
  id: number;
  name: string;
  totalLectures: number;
}

export default function LecturesPage() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [filteredLectures, setFilteredLectures] = useState<Lecture[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const isTeacher = user?.role === 'teacher';

  // Fetch lectures when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch lectures based on user role
      const lecturesEndpoint = isTeacher
        ? `/api/lectures/teacher/${user?.id}`
        : `/api/lectures/student/${user?.id}`;
        
      const lecturesResponse = await fetch(lecturesEndpoint);
      if (lecturesResponse.ok) {
        const lecturesData = await lecturesResponse.json();
        setLectures(lecturesData);
        setFilteredLectures(lecturesData);
      }

      // Fetch courses based on user role
      const coursesEndpoint = isTeacher
        ? `/api/courses/teacher/${user?.id}`
        : `/api/courses/student/${user?.id}`;
        
      const coursesResponse = await fetch(coursesEndpoint);
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setCourses(coursesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lectures',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // For preview purposes only - will be replaced with API data
  useEffect(() => {
    if (loading && lectures.length === 0) {
      // Sample data for UI development
      const sampleLectures: Lecture[] = [
        {
          id: 1,
          title: "Introduction to Cognitive Psychology",
          courseName: "Introduction to Psychology",
          description: "An overview of cognitive processes and theories",
          date: new Date().toISOString(),
          duration: 3540, // 59 minutes
          hasTranscript: true,
          hasSummary: true,
          processingStatus: 'complete'
        },
        {
          id: 2,
          title: "Memory and Learning",
          courseName: "Introduction to Psychology",
          description: "Understanding how memory works and learning mechanisms",
          date: new Date(Date.now() - 86400000 * 2).toISOString(),
          duration: 2820, // 47 minutes
          hasTranscript: true,
          hasSummary: false,
          processingStatus: 'processing'
        },
        {
          id: 3,
          title: "Differential Equations",
          courseName: "Advanced Mathematics",
          description: "Solving first-order and second-order differential equations",
          date: new Date(Date.now() - 86400000 * 5).toISOString(),
          duration: 4200, // 70 minutes
          hasTranscript: true,
          hasSummary: true,
          processingStatus: 'complete'
        },
        {
          id: 4,
          title: "Statistical Analysis in Psychology",
          courseName: "Introduction to Psychology",
          description: "Using statistics to analyze psychological data",
          date: new Date(Date.now() - 86400000 * 10).toISOString(),
          duration: 3120, // 52 minutes
          hasTranscript: false,
          hasSummary: false,
          processingStatus: 'failed'
        }
      ];
      
      const sampleCourses: Course[] = [
        {
          id: 1,
          name: "Introduction to Psychology",
          totalLectures: 3
        },
        {
          id: 2,
          name: "Advanced Mathematics",
          totalLectures: 1
        }
      ];
      
      setLectures(sampleLectures);
      setFilteredLectures(sampleLectures);
      setCourses(sampleCourses);
      setLoading(false);
    }
  }, [loading, lectures.length, isTeacher]);

  // Filter lectures based on search term and course filter
  useEffect(() => {
    let results = [...lectures];
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      results = results.filter(lecture => 
        lecture.title.toLowerCase().includes(searchLower) ||
        lecture.courseName.toLowerCase().includes(searchLower) ||
        (lecture.description && lecture.description.toLowerCase().includes(searchLower))
      );
    }
    
    if (selectedCourse !== null) {
      results = results.filter(lecture => {
        // Find the course ID based on course name
        const course = courses.find(c => c.name === lecture.courseName);
        return course && course.id === selectedCourse;
      });
    }
    
    setFilteredLectures(results);
  }, [searchTerm, selectedCourse, lectures, courses]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-500">Complete</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Failed</Badge>;
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };

  const handleDeleteLecture = (lectureId: number) => {
    // API call would go here
    toast({
      title: 'Lecture Deleted',
      description: 'The lecture has been deleted successfully.',
    });
    
    // Update local state to remove the deleted lecture
    setLectures(prev => prev.filter(lecture => lecture.id !== lectureId));
    setFilteredLectures(prev => prev.filter(lecture => lecture.id !== lectureId));
  };

  return (
    <div className="container mx-auto py-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {isTeacher ? "My Lectures" : "Lectures"}
            </h1>
            <p className="text-muted-foreground">
              {isTeacher 
                ? "Manage your recorded lectures and course materials" 
                : "Access lectures and educational resources from your courses"
              }
            </p>
          </div>
          
          {isTeacher && (
            <Link href="/record-lecture">
              <Button className="md:self-start">
                <Plus className="mr-2 h-4 w-4" />
                Record New Lecture
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search lectures by title or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[150px]">
              <Filter className="mr-2 h-4 w-4" />
              {selectedCourse !== null 
                ? courses.find(c => c.id === selectedCourse)?.name || 'Filter by Course'
                : 'Filter by Course'
              }
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Select Course</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSelectedCourse(null)}>
              All Courses
            </DropdownMenuItem>
            {courses.map((course) => (
              <DropdownMenuItem 
                key={course.id} 
                onClick={() => setSelectedCourse(course.id)}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                {course.name}
                <Badge variant="outline" className="ml-auto">
                  {course.totalLectures}
                </Badge>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="grid grid-cols-2 w-36 mb-6">
          <TabsTrigger value="grid">Grid</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredLectures.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No lectures found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedCourse !== null
                  ? "Try changing your search or filter settings"
                  : isTeacher
                    ? "You haven't recorded any lectures yet"
                    : "No lectures are available for your courses yet"
                }
              </p>
              {isTeacher && (
                <Link href="/record-lecture">
                  <Button className="mt-4">
                    Record Your First Lecture
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLectures.map((lecture) => (
                <motion.div
                  key={lecture.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="h-full flex flex-col overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <Badge variant="outline" className="mb-2">
                          {lecture.courseName}
                        </Badge>
                        {isTeacher && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <FileText className="mr-2 h-4 w-4" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteLecture(lecture.id)}
                                className="text-red-600"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Delete Lecture
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      <CardTitle className="text-lg">{lecture.title}</CardTitle>
                      {lecture.description && (
                        <CardDescription className="line-clamp-2">
                          {lecture.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="flex-1 pb-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="mr-2 h-4 w-4" />
                            {formatDate(lecture.date)}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="mr-2 h-4 w-4" />
                            {formatDuration(lecture.duration)}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="mr-1 h-4 w-4 text-blue-500" />
                            <span className={!lecture.hasTranscript ? "text-muted-foreground" : ""}>
                              Transcript
                            </span>
                          </div>
                          {lecture.hasTranscript ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : lecture.processingStatus === 'processing' ? (
                            <div className="h-4 w-4 rounded-full bg-blue-100 flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                            </div>
                          ) : lecture.processingStatus === 'failed' ? (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-300" />
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="mr-1 h-4 w-4 text-purple-500" />
                            <span className={!lecture.hasSummary ? "text-muted-foreground" : ""}>
                              Summary
                            </span>
                          </div>
                          {lecture.hasSummary ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : lecture.processingStatus === 'processing' ? (
                            <div className="h-4 w-4 rounded-full bg-blue-100 flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                            </div>
                          ) : lecture.processingStatus === 'failed' ? (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-300" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 border-t flex justify-between">
                      <div>
                        {getStatusBadge(lecture.processingStatus)}
                      </div>
                      <Link href={`/lectures/${lecture.id}`}>
                        <Button variant="default" size="sm">
                          <Headphones className="mr-2 h-4 w-4" />
                          View Lecture
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="list">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredLectures.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No lectures found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedCourse !== null
                  ? "Try changing your search or filter settings"
                  : isTeacher
                    ? "You haven't recorded any lectures yet"
                    : "No lectures are available for your courses yet"
                }
              </p>
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Resources</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLectures.map((lecture) => (
                    <TableRow key={lecture.id}>
                      <TableCell className="font-medium">{lecture.title}</TableCell>
                      <TableCell>{lecture.courseName}</TableCell>
                      <TableCell>{formatDate(lecture.date)}</TableCell>
                      <TableCell>{formatDuration(lecture.duration)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {lecture.hasTranscript && (
                            <Badge variant="outline" className="bg-blue-50">Transcript</Badge>
                          )}
                          {lecture.hasSummary && (
                            <Badge variant="outline" className="bg-purple-50">Summary</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(lecture.processingStatus)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Link href={`/lectures/${lecture.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                          {isTeacher && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteLecture(lecture.id)}
                                  className="text-red-600"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Delete Lecture
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}