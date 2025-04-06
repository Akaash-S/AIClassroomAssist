import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull(),
  uid: text("uid").notNull().unique(),
});

export const lectures = pgTable("lectures", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  courseId: integer("course_id").notNull(),
  teacherId: integer("teacher_id").notNull(),
  audioUrl: text("audio_url"),
  audioContent: text("audio_content"), // Base64 encoded audio content
  audioType: text("audio_type"), // MIME type of the audio (e.g., audio/webm)
  transcriptUrl: text("transcript_url"),
  transcriptContent: text("transcript_content"),
  summary: text("summary"),
  duration: integer("duration"),
  status: text("status").notNull().default("draft"),
  processingStatus: text("processing_status").default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  lectureId: integer("lecture_id").notNull(),
  courseId: integer("course_id").notNull(),
  type: text("type").notNull(), // assignment, homework, quiz, or exam
  title: text("title").notNull(),
  description: text("description"),
  dueDate: date("due_date"),
  priority: integer("priority").notNull().default(2), // 1=high, 2=medium, 3=low
  completed: boolean("completed").notNull().default(false),
  calendarEventId: text("calendar_event_id"), // Google Calendar event ID
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  teacherId: integer("teacher_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  courseId: integer("course_id").notNull(),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
});

export const studentProgress = pgTable("student_progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  lectureId: integer("lecture_id").notNull(),
  progress: integer("progress").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  notes: text("notes"),
  lastAccessedAt: timestamp("last_accessed_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertLectureSchema = createInsertSchema(lectures).omit({ id: true, createdAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, enrolledAt: true });
export const insertStudentProgressSchema = createInsertSchema(studentProgress).omit({ id: true, lastAccessedAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertLecture = z.infer<typeof insertLectureSchema>;
export type Lecture = typeof lectures.$inferSelect;

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

export type InsertStudentProgress = z.infer<typeof insertStudentProgressSchema>;
export type StudentProgress = typeof studentProgress.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
