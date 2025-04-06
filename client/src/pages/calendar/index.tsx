import React from 'react';
import { useAuth } from '@/lib/auth';
import { StudentCalendar } from '@/components/calendar/StudentCalendar';
import { CalendarSync } from '@/components/calendar/CalendarSync';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Layout, RefreshCw, ListTodo } from 'lucide-react';
import UpcomingTasks from '@/components/calendar/UpcomingTasks';

export default function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState('calendar');
  
  // Query to get events for the calendar
  const { data: calendarEvents, isLoading, refetch } = useQuery({
    queryKey: ['calendar-events', user?.email],
    queryFn: async () => {
      try {
        // Ensure email is properly encoded for URL
        const encodedEmail = encodeURIComponent(user?.email || '');
        const response = await fetch(`/api/calendar/events?userEmail=${encodedEmail}`);
        if (!response.ok) throw new Error('Failed to fetch calendar events');
        return response.json();
      } catch (error) {
        console.error('Error fetching calendar events:', error);
        return [];
      }
    },
    enabled: !!user?.email,
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: 'Refreshing Calendar',
      description: 'Updating your calendar with the latest information',
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Academic Calendar</h1>
          <p className="text-muted-foreground">
            Manage your academic schedule and synchronize with Google Calendar
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="sync">Sync Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="space-y-4">
          <StudentCalendar />
        </TabsContent>
        
        <TabsContent value="tasks" className="space-y-4">
          <div className="grid grid-cols-1 gap-6">
            <UpcomingTasks />
          </div>
        </TabsContent>
        
        <TabsContent value="sync">
          <CalendarSync />
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="text-lg font-medium mb-2 flex items-center">
              <Layout className="h-5 w-5 mr-2" />
              Calendar Integration
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your academic tasks will appear in your connected Google Calendar, allowing you to:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
              <li>Keep track of assignment due dates</li>
              <li>Set reminders for important deadlines</li>
              <li>View your academic schedule alongside your personal events</li>
              <li>Access your schedule from any device with Google Calendar</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}