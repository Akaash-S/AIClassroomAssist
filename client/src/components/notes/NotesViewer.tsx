import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';
import { Download, FileText, Text, RefreshCw } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface NotesViewerProps {
  onSelect?: (lectureId: number) => void;
}

interface Lecture {
  id: number;
  title: string;
  transcriptContent?: string;
  summary?: string;
  courseId: number;
}

interface Course {
  id: number;
  name: string;
}

export function NotesViewer({ onSelect }: NotesViewerProps) {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchLectures(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      if (user?.id) {
        const enrollmentsResponse = await fetch(`/api/enrollments?studentId=${user.id}`);
        const enrollments = await enrollmentsResponse.json();
        
        const courseIds = enrollments.map((enrollment: any) => enrollment.courseId);
        const courseList: Course[] = [];
        
        for (const courseId of courseIds) {
          const courseResponse = await fetch(`/api/courses/${courseId}`);
          const course = await courseResponse.json();
          courseList.push(course);
        }
        
        setCourses(courseList);
        
        if (courseList.length > 0) {
          setSelectedCourse(courseList[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLectures = async (courseId: number) => {
    setLoading(true);
    try {
      const lecturesResponse = await fetch(`/api/lectures?courseId=${courseId}`);
      const lectureList = await lecturesResponse.json();
      
      // Only include lectures with transcripts or summaries
      const filteredLectures = lectureList.filter((lecture: Lecture) => 
        lecture.transcriptContent || lecture.summary
      );
      
      setLectures(filteredLectures);
      
      if (filteredLectures.length > 0) {
        setSelectedLecture(filteredLectures[0]);
        if (onSelect) {
          onSelect(filteredLectures[0].id);
        }
      } else {
        setSelectedLecture(null);
      }
    } catch (error) {
      console.error('Error fetching lectures:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lectures',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLectureChange = (lectureId: string) => {
    const lecture = lectures.find(l => l.id === parseInt(lectureId));
    if (lecture) {
      setSelectedLecture(lecture);
      if (onSelect) {
        onSelect(lecture.id);
      }
    }
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(parseInt(courseId));
  };

  const downloadAsText = (content: string, filename: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadAsPDF = async (contentId: string, filename: string) => {
    const element = document.getElementById(contentId);
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(filename);
      
      toast({
        title: 'Success',
        description: 'PDF downloaded successfully',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error creating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to create PDF',
        variant: 'destructive'
      });
    }
  };

  const formatContent = (content: string) => {
    if (!content) return '';
    
    // Split into paragraphs and add proper spacing
    return content
      .split('\n\n')
      .map((paragraph, index) => (
        <p key={index} className="mb-4">
          {paragraph}
        </p>
      ));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">Lecture Notes</CardTitle>
            <CardDescription>Access summaries and transcripts from your lectures</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Select onValueChange={handleCourseChange} value={selectedCourse?.toString()}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Courses</SelectLabel>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Button 
              size="sm"
              variant="outline"
              onClick={() => selectedCourse && fetchLectures(selectedCourse)}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full max-w-sm rounded-md" />
              <Skeleton className="h-[400px] w-full rounded-md" />
            </div>
          ) : lectures.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-2" />
              <h3 className="text-xl font-semibold mb-1">No Notes Available</h3>
              <p className="text-muted-foreground">
                No lectures with transcripts or summaries were found for this course.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Select onValueChange={handleLectureChange} value={selectedLecture?.id.toString()}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a lecture" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Lectures</SelectLabel>
                      {lectures.map(lecture => (
                        <SelectItem key={lecture.id} value={lecture.id.toString()}>
                          {lecture.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedLecture && (
                <Tabs defaultValue="summary" className="w-full">
                  <div className="flex justify-between items-center mb-2">
                    <TabsList>
                      <TabsTrigger value="summary" disabled={!selectedLecture.summary}>
                        Summary
                      </TabsTrigger>
                      <TabsTrigger value="transcript" disabled={!selectedLecture.transcriptContent}>
                        Full Transcript
                      </TabsTrigger>
                    </TabsList>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const activeTab = document.querySelector('[role="tabpanel"]:not([hidden])');
                          const tabId = activeTab?.getAttribute('data-state') === 'active' ? activeTab?.id : 'summary';
                          const content = tabId === 'summary' ? selectedLecture.summary : selectedLecture.transcriptContent;
                          const filename = `${selectedLecture.title}_${tabId}.txt`;
                          
                          if (content) {
                            downloadAsText(content, filename);
                            
                            toast({
                              title: 'Success',
                              description: `${filename} downloaded successfully`,
                              variant: 'default'
                            });
                          }
                        }}
                      >
                        <Text className="mr-2 h-4 w-4" />
                        Download .txt
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const activeTab = document.querySelector('[role="tabpanel"]:not([hidden])');
                          const tabId = activeTab?.getAttribute('data-state') === 'active' ? activeTab?.id : 'summary';
                          const contentId = tabId === 'summary' ? 'summary-content' : 'transcript-content';
                          const filename = `${selectedLecture.title}_${tabId}.pdf`;
                          
                          downloadAsPDF(contentId, filename);
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download .pdf
                      </Button>
                    </div>
                  </div>
                  
                  <TabsContent value="summary" className="p-4 border rounded-md">
                    <div id="summary-content" className="prose max-w-none">
                      <h2 className="text-xl font-bold mb-4">{selectedLecture.title} - Summary</h2>
                      {selectedLecture.summary ? (
                        formatContent(selectedLecture.summary)
                      ) : (
                        <p className="text-muted-foreground">No summary available for this lecture.</p>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="transcript" className="p-4 border rounded-md max-h-[500px] overflow-y-auto">
                    <div id="transcript-content" className="prose max-w-none">
                      <h2 className="text-xl font-bold mb-4">{selectedLecture.title} - Full Transcript</h2>
                      {selectedLecture.transcriptContent ? (
                        formatContent(selectedLecture.transcriptContent)
                      ) : (
                        <p className="text-muted-foreground">No transcript available for this lecture.</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}