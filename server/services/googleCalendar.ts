import { google } from 'googleapis';
import { Task } from '../../shared/schema';
import dotenv from 'dotenv';
dotenv.config();
// Initialize the Google Calendar API
// Note: This is a mock implementation for development purposes
// In production, you would use the actual Google Calendar API with OAuth
const calendar = {
  events: {
    insert: async () => {
      // Mock successful response
      return {
        data: {
          id: 'mock-event-' + Date.now(),
          summary: 'Mock Event',
          htmlLink: 'https://calendar.google.com',
          start: { dateTime: new Date().toISOString(), timeZone: 'UTC' },
          end: { dateTime: new Date().toISOString(), timeZone: 'UTC' },
        }
      };
    },
    patch: async () => {
      // Mock successful response
      return {
        data: {
          id: 'mock-event-' + Date.now(),
          summary: 'Updated Mock Event',
          htmlLink: 'https://calendar.google.com',
          start: { dateTime: new Date().toISOString(), timeZone: 'UTC' },
          end: { dateTime: new Date().toISOString(), timeZone: 'UTC' },
        }
      };
    },
    delete: async () => {
      // Mock successful response
      return { data: {} };
    },
    list: async () => {
      // Mock successful response
      return {
        data: {
          items: [
            {
              id: 'mock-event-1',
              summary: 'Mock Event 1',
              description: 'This is a mock event for testing',
              htmlLink: 'https://calendar.google.com',
              start: { dateTime: new Date().toISOString(), timeZone: 'UTC' },
              end: { dateTime: new Date().toISOString(), timeZone: 'UTC' },
            }
          ]
        }
      };
    }
  }
};

/**
 * Create a Google Calendar event from a task
 * @param task The task to create an event for
 * @param userEmail The email of the user to add the event to
 * @returns The created event
 */
export async function createCalendarEvent(task: Task, userEmail: string) {
  try {
    // Format the task for Google Calendar
    const event = {
      summary: task.title,
      description: task.description || '',
      start: {
        dateTime: task.dueDate ? new Date(task.dueDate).toISOString() : new Date().toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: task.dueDate 
          ? new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000).toISOString() // Default to 1 hour duration
          : new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: 'UTC',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
      attendees: [
        { email: userEmail }
      ],
      // Add metadata to identify this event as coming from our application
      extendedProperties: {
        private: {
          taskId: task.id.toString(),
          lectureId: task.lectureId ? task.lectureId.toString() : '',
          courseId: task.courseId ? task.courseId.toString() : '',
          appSource: 'LectureHub'
        }
      }
    };

    // Create the event
    const response = await calendar.events.insert({
      calendarId: 'primary', // Use the primary calendar of the authenticated user
      requestBody: event,
      sendUpdates: 'all', // Send updates to all attendees
    });

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

/**
 * Update a Google Calendar event for a task
 * @param task The updated task
 * @param eventId The ID of the event to update
 * @param userEmail The email of the user who owns the event
 * @returns The updated event
 */
export async function updateCalendarEvent(task: Task, eventId: string, userEmail: string) {
  try {
    // Format the task for Google Calendar
    const event = {
      summary: task.title,
      description: task.description || '',
      start: {
        dateTime: task.dueDate ? new Date(task.dueDate).toISOString() : new Date().toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: task.dueDate 
          ? new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000).toISOString() // Default to 1 hour duration
          : new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: 'UTC',
      },
      attendees: [
        { email: userEmail }
      ],
      // Update metadata
      extendedProperties: {
        private: {
          taskId: task.id.toString(),
          lectureId: task.lectureId ? task.lectureId.toString() : '',
          courseId: task.courseId ? task.courseId.toString() : '',
          appSource: 'LectureHub',
          completed: task.completed ? 'true' : 'false'
        }
      }
    };

    // Update the event
    const response = await calendar.events.patch({
      calendarId: 'primary', // Use the primary calendar of the authenticated user
      eventId,
      requestBody: event,
      sendUpdates: 'all', // Send updates to all attendees
    });

    return response.data;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
}

/**
 * Delete a Google Calendar event for a task
 * @param eventId The ID of the event to delete
 * @returns void
 */
export async function deleteCalendarEvent(eventId: string) {
  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
}

/**
 * Get all events in the user's calendar
 * @param userEmail The email of the user to get events for
 * @returns Array of events
 */
export async function getCalendarEvents(userEmail: string) {
  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items;
  } catch (error) {
    console.error('Error getting calendar events:', error);
    throw error;
  }
}