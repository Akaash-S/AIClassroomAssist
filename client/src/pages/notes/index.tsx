import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  FileText, 
  Download, 
  Calendar, 
  Clock, 
  Tag,
  SortAsc,
  SortDesc,
  CheckSquare,
  XSquare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Lecture {
  id: number;
  title: string;
  courseName: string;
  date: string;
  hasTranscript: boolean;
  hasSummary: boolean;
  hasFlashcards: boolean;
  tags: string[];
}

export default function NotesPage() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [filteredLectures, setFilteredLectures] = useState<Lecture[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterHasTranscript, setFilterHasTranscript] = useState<boolean | null>(null);
  const [filterHasSummary, setFilterHasSummary] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch lectures with notes
  useEffect(() => {
    if (user?.id) {
      fetchLectures();
    }
  }, [user]);

  const fetchLectures = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/lectures/student/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setLectures(data);
        setFilteredLectures(data);
      }
    } catch (error) {
      console.error('Error fetching lecture notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lecture notes',
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
          date: new Date().toISOString(),
          hasTranscript: true,
          hasSummary: true,
          hasFlashcards: true,
          tags: ["psychology", "cognitive", "introduction"]
        },
        {
          id: 2,
          title: "Memory and Learning",
          courseName: "Introduction to Psychology",
          date: new Date(Date.now() - 86400000 * 2).toISOString(),
          hasTranscript: true,
          hasSummary: false,
          hasFlashcards: false,
          tags: ["psychology", "memory", "learning"]
        },
        {
          id: 3,
          title: "Differential Equations",
          courseName: "Advanced Mathematics",
          date: new Date(Date.now() - 86400000 * 5).toISOString(),
          hasTranscript: true,
          hasSummary: true,
          hasFlashcards: false,
          tags: ["mathematics", "calculus", "differential-equations"]
        },
        {
          id: 4,
          title: "Statistical Analysis in Psychology",
          courseName: "Introduction to Psychology",
          date: new Date(Date.now() - 86400000 * 10).toISOString(),
          hasTranscript: false,
          hasSummary: false,
          hasFlashcards: false,
          tags: ["psychology", "statistics", "analysis"]
        }
      ];
      
      setLectures(sampleLectures);
      setFilteredLectures(sampleLectures);
      setLoading(false);
    }
  }, [loading, lectures.length]);

  // Filter and sort whenever search term or filters change
  useEffect(() => {
    let results = [...lectures];
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      results = results.filter(lecture => 
        lecture.title.toLowerCase().includes(searchLower) ||
        lecture.courseName.toLowerCase().includes(searchLower) ||
        lecture.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // Filter by transcript availability
    if (filterHasTranscript !== null) {
      results = results.filter(lecture => lecture.hasTranscript === filterHasTranscript);
    }
    
    // Filter by summary availability
    if (filterHasSummary !== null) {
      results = results.filter(lecture => lecture.hasSummary === filterHasSummary);
    }
    
    // Sort by date
    results.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    setFilteredLectures(results);
  }, [searchTerm, sortOrder, filterHasTranscript, filterHasSummary, lectures]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  
  const resetFilters = () => {
    setSearchTerm('');
    setSortOrder('desc');
    setFilterHasTranscript(null);
    setFilterHasSummary(null);
  };

  const downloadTranscript = (lectureId: number) => {
    // In a real app, this would download the transcript file
    toast({
      title: 'Download Started',
      description: 'Your transcript is being downloaded'
    });
  };
  
  const downloadSummary = (lectureId: number) => {
    // In a real app, this would download the summary file
    toast({
      title: 'Download Started',
      description: 'Your summary is being downloaded'
    });
  };

  const formatDate = (dateString: string) => {
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
        <h1 className="text-3xl font-bold mb-2">My Notes</h1>
        <p className="text-muted-foreground mb-6">
          Access transcripts, summaries, and flashcards from your lectures.
        </p>
      </motion.div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search notes by title, course or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by Date</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortOrder('desc')}>
                <SortDesc className="mr-2 h-4 w-4" /> Newest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder('asc')}>
                <SortAsc className="mr-2 h-4 w-4" /> Oldest First
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter Notes</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setFilterHasTranscript(true)}
                className={filterHasTranscript === true ? "bg-secondary" : ""}
              >
                <CheckSquare className="mr-2 h-4 w-4" /> Has Transcript
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setFilterHasTranscript(false)}
                className={filterHasTranscript === false ? "bg-secondary" : ""}
              >
                <XSquare className="mr-2 h-4 w-4" /> No Transcript
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setFilterHasSummary(true)}
                className={filterHasSummary === true ? "bg-secondary" : ""}
              >
                <CheckSquare className="mr-2 h-4 w-4" /> Has Summary
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setFilterHasSummary(false)}
                className={filterHasSummary === false ? "bg-secondary" : ""}
              >
                <XSquare className="mr-2 h-4 w-4" /> No Summary
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={resetFilters}>
                Reset All Filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Lecture Notes Cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredLectures.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No notes found</h3>
          <p className="text-muted-foreground">
            {searchTerm || filterHasTranscript !== null || filterHasSummary !== null
              ? "Try changing your search or filter settings"
              : "You don't have any lecture notes yet"}
          </p>
          {(searchTerm || filterHasTranscript !== null || filterHasSummary !== null) && (
            <Button variant="outline" className="mt-4" onClick={resetFilters}>
              Reset Filters
            </Button>
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
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{lecture.title}</CardTitle>
                      <CardDescription>{lecture.courseName}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex items-center text-sm text-muted-foreground mb-4">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>{formatDate(lecture.date)}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {lecture.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        <span className="text-sm">Transcript</span>
                      </div>
                      {lecture.hasTranscript ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8"
                          onClick={() => downloadTranscript(lecture.id)}
                        >
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Download
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Not Available
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        <span className="text-sm">Summary</span>
                      </div>
                      {lecture.hasSummary ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8"
                          onClick={() => downloadSummary(lecture.id)}
                        >
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Download
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Not Available
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 border-t">
                  <Link href={`/lectures/${lecture.id}`}>
                    <Button variant="default" className="w-full">
                      View Lecture
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}