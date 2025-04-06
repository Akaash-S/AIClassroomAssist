import React from 'react';
import { TaskList } from '@/components/tasks/TaskList';
import { BatchProcessTranscripts } from '@/components/tasks/BatchProcessTranscripts';
import { CalendarSync } from '@/components/calendar/CalendarSync';
import { TranscriptManager } from '@/components/notes/TranscriptManager';
import AppLayout from '@/components/layout/AppLayout';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth';
import { FileText, ListTodo } from 'lucide-react';

export default function TasksPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto py-6 px-4 max-w-7xl"
      >
        <div className="grid grid-cols-1 gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-4">Academic Management</h1>
            <p className="text-muted-foreground mb-6">
              Manage lecture transcripts and extract academic tasks from your course content
            </p>
          </div>
          
          <Tabs defaultValue="tasks">
            <TabsList className="mb-4 w-full sm:w-auto">
              <TabsTrigger value="tasks" className="flex-1 sm:flex-initial">
                <ListTodo className="w-4 h-4 mr-2" />
                Tasks
              </TabsTrigger>
              {isTeacher && (
                <TabsTrigger value="transcripts" className="flex-1 sm:flex-initial">
                  <FileText className="w-4 h-4 mr-2" />
                  Transcripts
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="tasks" className="space-y-6">
              <BatchProcessTranscripts />
              <CalendarSync />
              <TaskList />
            </TabsContent>
            
            {isTeacher && (
              <TabsContent value="transcripts">
                <TranscriptManager />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </motion.div>
    </AppLayout>
  );
}