import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  CheckCircle,
  Save,
  Loader2,
  FileText,
  RefreshCw,
  Edit,
  Check,
  ChevronDown,
  ChevronUp,
  FileDown,
  Clock
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface Course {
  id: number;
  name: string;
}

interface Lecture {
  id: number;
  title: string;
  courseId: number;
  courseName?: string;
  transcriptContent?: string;
  hasTranscript?: boolean;
  processingStatus?: string;
  selected?: boolean;
}

export function TranscriptManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [filteredLectures, setFilteredLectures] = useState<Lecture[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [selectedLectureId, setSelectedLectureId] = useState<string>('');
  const [transcriptContent, setTranscriptContent] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterHasTranscript, setFilterHasTranscript] = useState<boolean | null>(null);
  const [loadingLectures, setLoadingLectures] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [batchSelectedIds, setBatchSelectedIds] = useState<Set<number>>(new Set());
  const [showBatchMenu, setShowBatchMenu] = useState<boolean>(false);
  const [batchOperation, setBatchOperation] = useState<'process' | 'export' | null>(null);
  const [preparedLectures, setPreparedLectures] = useState<Lecture[]>([]);
  const [processingResults, setProcessingResults] = useState<any[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('all');
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchCourses();
      fetchAllLectures();
    }
  }, [user]);

  useEffect(() => {
    filterLectures();
  }, [lectures, selectedCourseId, searchTerm, filterHasTranscript]);

  const fetchCourses = async () => {
    if (!user) return;
    
    try {
      const teacherId = user.id;
      const response = await fetch(`/api/courses?teacherId=${teacherId}`);
      
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast({
        title: "Error",
        description: "Failed to fetch courses",
        variant: "destructive"
      });
    }
  };

  const fetchAllLectures = async () => {
    if (!user) return;
    
    setLoadingLectures(true);
    try {
      const teacherId = user.id;
      const response = await fetch(`/api/lectures?teacherId=${teacherId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Map each lecture to include hasTranscript flag
        const processedLectures = data.map((lecture: Lecture) => ({
          ...lecture,
          hasTranscript: Boolean(lecture.transcriptContent && lecture.transcriptContent.trim().length > 0)
        }));
        
        setLectures(processedLectures);
      }
    } catch (error) {
      console.error("Error fetching lectures:", error);
      toast({
        title: "Error",
        description: "Failed to fetch lectures",
        variant: "destructive"
      });
    } finally {
      setLoadingLectures(false);
    }
  };

  const fetchLectureDetails = async (lectureId: string) => {
    if (!lectureId) {
      setTranscriptContent('');
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch(`/api/lectures/${lectureId}`);
      
      if (response.ok) {
        const lecture = await response.json();
        setTranscriptContent(lecture.transcriptContent || '');
      }
    } catch (error) {
      console.error("Error fetching lecture details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch lecture details",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const filterLectures = () => {
    let filtered = [...lectures];
    
    // Filter by course if a course is selected
    if (selectedCourseId && selectedCourseId !== 'all') {
      filtered = filtered.filter(lecture => lecture.courseId === parseInt(selectedCourseId));
    }
    
    // Filter by search term
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(lecture => 
        lecture.title.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by transcript presence
    if (filterHasTranscript !== null) {
      filtered = filtered.filter(lecture => lecture.hasTranscript === filterHasTranscript);
    }
    
    // Add course names to the filtered lectures
    filtered = filtered.map(lecture => {
      const course = courses.find(c => c.id === lecture.courseId);
      return {
        ...lecture,
        courseName: course ? course.name : 'Unknown Course'
      };
    });
    
    setFilteredLectures(filtered);
  };

  const handleLectureChange = (lectureId: string) => {
    setSelectedLectureId(lectureId);
    fetchLectureDetails(lectureId);
  };

  const saveTranscript = async () => {
    if (!selectedLectureId || !transcriptContent.trim()) {
      toast({
        title: "Error",
        description: "Please select a lecture and enter transcript content",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch(`/api/lectures/${selectedLectureId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transcriptContent
        })
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Transcript saved successfully",
        });
        
        // Update the lecture in the local state
        const updatedLectures = lectures.map(lecture => 
          lecture.id === parseInt(selectedLectureId) 
            ? { ...lecture, 
                transcriptContent, 
                hasTranscript: Boolean(transcriptContent.trim()) 
              } 
            : lecture
        );
        
        setLectures(updatedLectures);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to save transcript");
      }
    } catch (error) {
      console.error("Error saving transcript:", error);
      toast({
        title: "Error",
        description: `Failed to save transcript: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleLectureSelection = (lectureId: number) => {
    setBatchSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lectureId)) {
        newSet.delete(lectureId);
      } else {
        newSet.add(lectureId);
      }
      return newSet;
    });
  };

  const selectAllVisible = () => {
    setBatchSelectedIds(new Set(filteredLectures.map(lecture => lecture.id)));
  };

  const clearSelection = () => {
    setBatchSelectedIds(new Set());
  };

  const prepareBatchOperation = (operation: 'process' | 'export') => {
    if (batchSelectedIds.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one lecture",
        variant: "destructive"
      });
      return;
    }
    
    // Get full lecture objects for the selected IDs
    const selectedLectures = lectures.filter(lecture => batchSelectedIds.has(lecture.id));
    
    if (operation === 'process') {
      // For processing, we need lectures with transcript content
      const lecturesWithTranscripts = selectedLectures.filter(lecture => 
        lecture.hasTranscript && lecture.transcriptContent
      );
      
      if (lecturesWithTranscripts.length === 0) {
        toast({
          title: "Error",
          description: "None of the selected lectures have transcript content",
          variant: "destructive"
        });
        return;
      }
      
      setPreparedLectures(lecturesWithTranscripts);
    } else if (operation === 'export') {
      // For export, just pass all selected lectures
      setPreparedLectures(selectedLectures);
    }
    
    setBatchOperation(operation);
    setShowBatchMenu(true);
  };

  const processBatchLectures = async () => {
    if (preparedLectures.length === 0) {
      toast({
        title: "Error",
        description: "No lectures with transcripts to process",
        variant: "destructive"
      });
      return;
    }
    
    setProcessing(true);
    setProgress(0);
    setProcessingResults([]);
    
    try {
      const results = [];
      
      for (let i = 0; i < preparedLectures.length; i++) {
        const lecture = preparedLectures[i];
        setProgress(Math.floor((i / preparedLectures.length) * 100));
        
        try {
          // Extract tasks from transcript
          const taskResponse = await fetch(`/api/extract-tasks/${lecture.id}?fallback=true`, {
            method: 'POST'
          });
          
          if (taskResponse.ok) {
            const taskData = await taskResponse.json();
            
            results.push({
              lectureId: lecture.id,
              lectureTitle: lecture.title,
              tasksExtracted: taskData.tasks.length,
              successful: true,
              message: `${taskData.tasks.length} tasks extracted`
            });
          } else {
            throw new Error(`Failed to extract tasks: ${(await taskResponse.json()).message}`);
          }
        } catch (error) {
          console.error(`Error processing lecture ${lecture.id}:`, error);
          results.push({
            lectureId: lecture.id,
            lectureTitle: lecture.title,
            tasksExtracted: 0,
            successful: false,
            message: `Error: ${(error as Error).message}`
          });
        }
      }
      
      setProgress(100);
      setProcessingResults(results);
      
      const totalTasksExtracted = results.reduce((sum, result) => sum + result.tasksExtracted, 0);
      const successfulLectures = results.filter(r => r.successful).length;
      
      toast({
        title: "Processing Complete",
        description: `Successfully processed ${successfulLectures} of ${preparedLectures.length} lectures. Extracted ${totalTasksExtracted} tasks.`
      });
    } catch (error) {
      console.error('Error processing lectures:', error);
      toast({
        title: "Error",
        description: `Failed to process lectures: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const exportBatchTranscripts = async () => {
    if (preparedLectures.length === 0) {
      toast({
        title: "Error",
        description: "No lectures selected for export",
        variant: "destructive"
      });
      return;
    }
    
    setProcessing(true);
    setProgress(0);
    
    try {
      // Compile all transcripts with lecture titles into a single document
      const content = preparedLectures.map((lecture, index) => {
        setProgress(Math.floor((index / preparedLectures.length) * 100));
        
        return `# ${lecture.title}\n\n${lecture.transcriptContent || 'No transcript available'}\n\n${'-'.repeat(50)}\n\n`;
      }).join('');
      
      // Create a Blob with the content
      const blob = new Blob([content], { type: 'text/plain' });
      
      // Create a download link
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `batch_transcripts_${new Date().toISOString().split('T')[0]}.txt`;
      
      // Trigger the download
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      
      setProgress(100);
      
      toast({
        title: "Export Complete",
        description: `Successfully exported ${preparedLectures.length} transcripts`
      });
    } catch (error) {
      console.error('Error exporting transcripts:', error);
      toast({
        title: "Error",
        description: `Failed to export transcripts: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
      setShowBatchMenu(false);
    }
  };

  return (
    <div>
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTabId}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All Lectures</TabsTrigger>
            <TabsTrigger value="edit">Edit Transcript</TabsTrigger>
            {batchSelectedIds.size > 0 && (
              <TabsTrigger value="batch" className="bg-primary text-primary-foreground">
                Selected ({batchSelectedIds.size})
              </TabsTrigger>
            )}
          </TabsList>
          
          <div className="space-x-2">
            {batchSelectedIds.size > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => prepareBatchOperation('process')}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Process Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => prepareBatchOperation('export')}
                >
                  <FileDown className="h-4 w-4 mr-1" />
                  Export Selected
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                >
                  Clear Selection
                </Button>
              </>
            )}
          </div>
        </div>
        
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lecture Transcripts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="course-filter">Filter by Course</Label>
                  <Select 
                    value={selectedCourseId} 
                    onValueChange={setSelectedCourseId}
                  >
                    <SelectTrigger id="course-filter">
                      <SelectValue placeholder="All Courses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <Label htmlFor="search-lectures">Search Lectures</Label>
                  <Input
                    id="search-lectures"
                    placeholder="Search by title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex-1">
                  <Label htmlFor="filter-transcript">Filter by Transcript</Label>
                  <Select 
                    value={filterHasTranscript === null ? 'all' : filterHasTranscript ? 'has' : 'missing'} 
                    onValueChange={(value) => {
                      if (value === 'all') setFilterHasTranscript(null);
                      else if (value === 'has') setFilterHasTranscript(true);
                      else setFilterHasTranscript(false);
                    }}
                  >
                    <SelectTrigger id="filter-transcript">
                      <SelectValue placeholder="All Lectures" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Lectures</SelectItem>
                      <SelectItem value="has">Has Transcript</SelectItem>
                      <SelectItem value="missing">Missing Transcript</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {loadingLectures ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center py-2 px-1">
                    <div className="text-sm text-muted-foreground">
                      {filteredLectures.length} lecture{filteredLectures.length !== 1 ? 's' : ''} found
                    </div>
                    <div>
                      <Button variant="ghost" size="sm" onClick={selectAllVisible}>
                        Select All Visible
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12 text-center"></TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLectures.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                              No lectures found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredLectures.map(lecture => (
                            <TableRow key={lecture.id}>
                              <TableCell className="text-center">
                                <Checkbox 
                                  checked={batchSelectedIds.has(lecture.id)}
                                  onCheckedChange={() => toggleLectureSelection(lecture.id)}
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                {lecture.title}
                              </TableCell>
                              <TableCell>{lecture.courseName}</TableCell>
                              <TableCell className="text-center">
                                {lecture.hasTranscript ? (
                                  <Badge variant="success" className="bg-green-100 text-green-600 hover:bg-green-200">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Has Transcript
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">Missing</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedLectureId(lecture.id.toString());
                                    fetchLectureDetails(lecture.id.toString());
                                    setActiveTabId('edit');
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>Edit Transcript</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lecture-select">Select Lecture</Label>
                <Select 
                  value={selectedLectureId} 
                  onValueChange={handleLectureChange}
                  disabled={saving}
                >
                  <SelectTrigger id="lecture-select">
                    <SelectValue placeholder="Select a lecture" />
                  </SelectTrigger>
                  <SelectContent>
                    {lectures.map(lecture => (
                      <SelectItem key={lecture.id} value={lecture.id.toString()}>
                        {lecture.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transcript-content">Transcript Content</Label>
                <Textarea
                  id="transcript-content"
                  placeholder="Enter the lecture transcript here..."
                  value={transcriptContent}
                  onChange={(e) => setTranscriptContent(e.target.value)}
                  className="min-h-[300px]"
                  disabled={saving || !selectedLectureId}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                {transcriptContent ? 
                  `${transcriptContent.length} characters` : 
                  'No transcript content'}
              </div>
              <Button 
                onClick={saveTranscript} 
                disabled={saving || !selectedLectureId || !transcriptContent.trim()}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Transcript
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="batch">
          <Card>
            <CardHeader>
              <CardTitle>Batch Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Button 
                      onClick={() => prepareBatchOperation('process')}
                      className="w-full"
                      variant="default"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Process Selected Lectures
                    </Button>
                  </div>
                  <div className="flex-1">
                    <Button 
                      onClick={() => prepareBatchOperation('export')}
                      className="w-full"
                      variant="outline"
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      Export Selected Transcripts
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from(batchSelectedIds).map(id => {
                        const lecture = lectures.find(l => l.id === id);
                        if (!lecture) return null;
                        
                        const course = courses.find(c => c.id === lecture.courseId);
                        
                        return (
                          <TableRow key={lecture.id}>
                            <TableCell className="font-medium">
                              {lecture.title}
                            </TableCell>
                            <TableCell>{course?.name || 'Unknown Course'}</TableCell>
                            <TableCell className="text-center">
                              {lecture.hasTranscript ? (
                                <Badge variant="success" className="bg-green-100 text-green-600 hover:bg-green-200">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Has Transcript
                                </Badge>
                              ) : (
                                <Badge variant="outline">Missing</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedLectureId(lecture.id.toString());
                                  fetchLectureDetails(lecture.id.toString());
                                  setActiveTabId('edit');
                                }}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" onClick={clearSelection}>
                Clear Selection
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Batch Process Dialog */}
      <Dialog open={showBatchMenu} onOpenChange={setShowBatchMenu}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {batchOperation === 'process' ? 'Process Selected Lectures' : 'Export Selected Transcripts'}
            </DialogTitle>
            <DialogDescription>
              {batchOperation === 'process' 
                ? 'This will process transcripts and extract tasks from the selected lectures.' 
                : 'This will export the transcripts from all selected lectures.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {processing ? (
              <div className="space-y-4">
                <div className="flex items-center text-muted-foreground">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  {batchOperation === 'process' ? 'Processing lectures...' : 'Exporting transcripts...'}
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-xs text-muted-foreground">{progress}% complete</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p>
                  {batchOperation === 'process'
                    ? `You've selected ${preparedLectures.length} lecture(s) with transcript content to process.`
                    : `You've selected ${preparedLectures.length} lecture(s) to export.`}
                </p>
                
                {preparedLectures.length > 0 && (
                  <Collapsible className="w-full">
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full flex justify-between">
                        <span>Show selected lectures</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 border rounded-md p-2 max-h-[200px] overflow-y-auto">
                        <ul className="space-y-1">
                          {preparedLectures.map(lecture => (
                            <li key={lecture.id} className="text-sm p-1 border-b last:border-b-0">
                              {lecture.title}
                              {!lecture.hasTranscript && (
                                <Badge variant="outline" className="ml-2 text-xs">No Transcript</Badge>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
                
                {processingResults.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Processing Results:</h4>
                    <div className="border rounded-md overflow-y-auto max-h-[200px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Lecture</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right">Tasks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {processingResults.map((result, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="py-2">{result.lectureTitle}</TableCell>
                              <TableCell className="text-center py-2">
                                {result.successful ? (
                                  <span className="flex items-center justify-center text-green-500">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Success
                                  </span>
                                ) : (
                                  <span className="flex items-center justify-center text-red-500">
                                    <Clock className="h-4 w-4 mr-1" />
                                    Failed
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right py-2">{result.tasksExtracted}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={processing}>
                Close
              </Button>
            </DialogClose>
            
            {!processing && processingResults.length === 0 && (
              <Button 
                type="button" 
                onClick={batchOperation === 'process' ? processBatchLectures : exportBatchTranscripts}
                disabled={preparedLectures.length === 0}
              >
                {batchOperation === 'process' ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Process Now
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export Now
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}