import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  UserPlus, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Users,
  BookOpen,
  BarChart
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Student {
  id: number;
  name: string;
  email: string;
  enrolledCourses: number;
  completedLectures: number;
  totalLectures: number;
  completionRate: number;
  lastActivity: string;
  status: 'active' | 'inactive' | 'at-risk';
}

interface Course {
  id: number;
  name: string;
  enrolledStudents: number;
  avgCompletionRate: number;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch students
  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch students
      const studentsResponse = await fetch(`/api/students/teacher/${user?.id}`);
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        setStudents(studentsData);
        setFilteredStudents(studentsData);
      }

      // Fetch courses
      const coursesResponse = await fetch(`/api/courses/teacher/${user?.id}`);
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setCourses(coursesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load students data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // For preview purposes only - will be replaced with API data
  useEffect(() => {
    if (loading && students.length === 0) {
      // Sample data for UI development
      const sampleStudents: Student[] = [
        {
          id: 1,
          name: "Emma Johnson",
          email: "emma.j@example.com",
          enrolledCourses: 2,
          completedLectures: 15,
          totalLectures: 20,
          completionRate: 75,
          lastActivity: new Date().toISOString(),
          status: 'active'
        },
        {
          id: 2,
          name: "Alex Smith",
          email: "alex.smith@example.com",
          enrolledCourses: 1,
          completedLectures: 6,
          totalLectures: 20,
          completionRate: 30,
          lastActivity: new Date(Date.now() - 86400000 * 3).toISOString(),
          status: 'at-risk'
        },
        {
          id: 3,
          name: "Jamie Wilson",
          email: "jamie.w@example.com",
          enrolledCourses: 2,
          completedLectures: 18,
          totalLectures: 20,
          completionRate: 90,
          lastActivity: new Date(Date.now() - 86400000).toISOString(),
          status: 'active'
        },
        {
          id: 4,
          name: "Morgan Lee",
          email: "morgan.l@example.com",
          enrolledCourses: 1,
          completedLectures: 2,
          totalLectures: 20,
          completionRate: 10,
          lastActivity: new Date(Date.now() - 86400000 * 10).toISOString(),
          status: 'inactive'
        }
      ];
      
      const sampleCourses: Course[] = [
        {
          id: 1,
          name: "Introduction to Psychology",
          enrolledStudents: 3,
          avgCompletionRate: 65
        },
        {
          id: 2,
          name: "Advanced Mathematics",
          enrolledStudents: 2,
          avgCompletionRate: 40
        }
      ];
      
      setStudents(sampleStudents);
      setFilteredStudents(sampleStudents);
      setCourses(sampleCourses);
      setLoading(false);
    }
  }, [loading, students.length]);

  // Filter students based on search term and status filter
  useEffect(() => {
    let results = [...students];
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      results = results.filter(student => 
        student.name.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower)
      );
    }
    
    if (statusFilter) {
      results = results.filter(student => student.status === statusFilter);
    }
    
    setFilteredStudents(results);
  }, [searchTerm, statusFilter, students]);

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

  const inviteStudent = () => {
    toast({
      title: 'Invite Sent',
      description: 'Student invitation has been sent successfully'
    });
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
            <h1 className="text-3xl font-bold mb-2">Students</h1>
            <p className="text-muted-foreground">
              Manage your students and track their learning progress.
            </p>
          </div>
          <Button onClick={inviteStudent} className="md:self-start">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Student
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Users className="mr-2 h-4 w-4 text-blue-500" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-sm text-muted-foreground">Enrolled in your courses</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <BookOpen className="mr-2 h-4 w-4 text-green-500" />
              Active Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter(s => s.status === 'active').length}
            </div>
            <p className="text-sm text-muted-foreground">Active in the last 7 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <BarChart className="mr-2 h-4 w-4 text-purple-500" />
              Avg. Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.length > 0 
                ? Math.round(students.reduce((acc, s) => acc + s.completionRate, 0) / students.length)
                : 0}%
            </div>
            <p className="text-sm text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
          <TabsTrigger value="students" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center">
            <BookOpen className="mr-2 h-4 w-4" />
            Courses
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search students by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" />
                        {statusFilter ? `Filter: ${statusFilter}` : 'Filter'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                        All Students
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        Active
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('at-risk')}>
                        <AlertCircle className="mr-2 h-4 w-4 text-yellow-500" />
                        At Risk
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                        <Clock className="mr-2 h-4 w-4 text-red-500" />
                        Inactive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No students found. {searchTerm && 'Try adjusting your search.'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Courses</TableHead>
                        <TableHead>Completion</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.enrolledCourses}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className="mr-2">{student.completionRate}%</span>
                              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary"
                                  style={{ width: `${student.completionRate}%` }}
                                ></div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(student.status)}</TableCell>
                          <TableCell>{formatDate(student.lastActivity)}</TableCell>
                          <TableCell className="text-right">
                            <Link href={`/students/${student.id}`}>
                              <Button variant="ghost" size="sm">
                                View Details
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Course Enrollment</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No courses found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {courses.map((course) => (
                    <Card key={course.id} className="border shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{course.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm text-muted-foreground">
                            <Users className="inline mr-2 h-4 w-4" />
                            {course.enrolledStudents} Students
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <BarChart className="inline mr-2 h-4 w-4" />
                            {course.avgCompletionRate}% Avg. Completion
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Link href={`/courses/${course.id}/students`}>
                            <Button variant="outline" size="sm" className="w-full">
                              View Students
                            </Button>
                          </Link>
                          <Link href={`/courses/${course.id}`}>
                            <Button variant="default" size="sm" className="w-full">
                              Course Details
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}