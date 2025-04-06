import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import AudioRecorder from "@/components/recorder/AudioRecorder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Loader2, Save } from "lucide-react";

const RecordLecture = () => {
  const [, setLocation] = useLocation();
  const [, params] = useRoute<{ id?: string }>("/lectures/record/:id?");
  const lectureId = params?.id ? parseInt(params.id) : undefined;
  
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState<string>("");
  const [courses, setCourses] = useState<Array<{ id: number; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load existing lecture data if editing
  useEffect(() => {
    if (lectureId) {
      setIsLoading(true);
      apiRequest<any>(`/api/lectures/${lectureId}`)
        .then(data => {
          setTitle(data.title);
          setCourseId(data.courseId.toString());
          setIsLoading(false);
        })
        .catch(err => {
          toast({
            title: "Error",
            description: "Failed to load lecture data",
            variant: "destructive"
          });
          setIsLoading(false);
        });
    }
  }, [lectureId, toast]);

  // Load courses for selection
  useEffect(() => {
    if (user) {
      apiRequest<Array<{ id: number; name: string }>>(`/api/courses?teacherId=${user.id}`)
        .then(data => {
          setCourses(data);
          if (data.length > 0 && !courseId) {
            setCourseId(data[0].id.toString());
          }
        })
        .catch(err => {
          toast({
            title: "Error",
            description: "Failed to load courses",
            variant: "destructive"
          });
        });
    }
  }, [user, toast, courseId]);

  const handleSaveLecture = async (audioUrl: string) => {
    if (!title || !courseId) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and select a course for the lecture.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      if (lectureId) {
        // Update existing lecture
        await apiRequest<any>({
          url: `/api/lectures/${lectureId}`,
          method: "PUT",
          data: {
            title,
            courseId: parseInt(courseId),
            teacherId: user?.id,
            audioUrl,
            status: "draft"
          }
        });
        
        toast({
          title: "Success",
          description: "Lecture updated successfully"
        });
      } else {
        // Create new lecture
        const newLecture = await apiRequest<any>({
          url: "/api/lectures",
          method: "POST",
          data: {
            title,
            courseId: parseInt(courseId),
            teacherId: user?.id,
            audioUrl,
            status: "draft"
          }
        });
        
        toast({
          title: "Success",
          description: "Lecture created successfully"
        });
        
        // Redirect to the lecture view page
        setLocation(`/lectures/${newLecture.id}`);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save lecture",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSave = async () => {
    if (!title || !courseId) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and select a course for the lecture.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      if (lectureId) {
        // Update existing lecture without changing audio
        await apiRequest<any>({
          url: `/api/lectures/${lectureId}`,
          method: "PUT",
          data: {
            title,
            courseId: parseInt(courseId),
            teacherId: user?.id
          }
        });
        
        toast({
          title: "Success",
          description: "Lecture details updated successfully"
        });
      } else {
        toast({
          title: "Information",
          description: "Please record audio before saving the lecture."
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save lecture details",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            {lectureId ? "Edit Lecture" : "Record New Lecture"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Lecture Title</Label>
              <Input
                id="title"
                placeholder="Enter lecture title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="course">Course</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger id="course">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleManualSave} 
              disabled={isSaving || !title || !courseId}
              className="w-full gap-2"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Details
            </Button>
          </div>
        </CardContent>
      </Card>

      <AudioRecorder 
        onSave={handleSaveLecture} 
        lectureId={lectureId}
        className="w-full" 
      />
    </div>
  );
};

export default RecordLecture;
