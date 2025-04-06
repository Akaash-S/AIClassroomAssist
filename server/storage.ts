import { 
  users, type User, type InsertUser, 
  lectures, type Lecture, type InsertLecture,
  courses, type Course, type InsertCourse,
  enrollments, type Enrollment, type InsertEnrollment,
  studentProgress, type StudentProgress, type InsertStudentProgress,
  tasks, type Task, type InsertTask
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// modify the interface with any CRUD methods you might need
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUid(uid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Lecture operations
  getLecture(id: number): Promise<Lecture | undefined>;
  getLecturesByTeacher(teacherId: number): Promise<Lecture[]>;
  getLecturesByCourse(courseId: number): Promise<Lecture[]>;
  createLecture(lecture: InsertLecture): Promise<Lecture>;
  updateLecture(id: number, lecture: Partial<InsertLecture>): Promise<Lecture | undefined>;
  
  // Course operations
  getCourse(id: number): Promise<Course | undefined>;
  getCoursesByTeacher(teacherId: number): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  
  // Enrollment operations
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]>;
  getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  
  // Student progress operations
  getStudentProgress(id: number): Promise<StudentProgress | undefined>;
  getProgressByStudentAndLecture(studentId: number, lectureId: number): Promise<StudentProgress | undefined>;
  getProgressByStudent(studentId: number): Promise<StudentProgress[]>;
  createStudentProgress(progress: InsertStudentProgress): Promise<StudentProgress>;
  updateStudentProgress(id: number, progress: Partial<InsertStudentProgress>): Promise<StudentProgress | undefined>;
  
  // Task operations
  getTask(id: number): Promise<Task | undefined>;
  getTasksByLecture(lectureId: number): Promise<Task[]>;
  getTasksByCourse(courseId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUid(uid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.uid, uid));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  // Lecture operations
  async getLecture(id: number): Promise<Lecture | undefined> {
    const [lecture] = await db.select().from(lectures).where(eq(lectures.id, id));
    return lecture;
  }

  async getLecturesByTeacher(teacherId: number): Promise<Lecture[]> {
    return db.select().from(lectures).where(eq(lectures.teacherId, teacherId));
  }

  async getLecturesByCourse(courseId: number): Promise<Lecture[]> {
    return db.select().from(lectures).where(eq(lectures.courseId, courseId));
  }

  async createLecture(lecture: InsertLecture): Promise<Lecture> {
    const [newLecture] = await db.insert(lectures).values(lecture).returning();
    return newLecture;
  }

  async updateLecture(id: number, lecture: Partial<InsertLecture>): Promise<Lecture | undefined> {
    const [updatedLecture] = await db
      .update(lectures)
      .set(lecture)
      .where(eq(lectures.id, id))
      .returning();
    return updatedLecture;
  }
  
  // Course operations
  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCoursesByTeacher(teacherId: number): Promise<Course[]> {
    return db.select().from(courses).where(eq(courses.teacherId, teacherId));
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }
  
  // Enrollment operations
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, id));
    return enrollment;
  }

  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.studentId, studentId));
  }

  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [newEnrollment] = await db.insert(enrollments).values(enrollment).returning();
    return newEnrollment;
  }
  
  // Student progress operations
  async getStudentProgress(id: number): Promise<StudentProgress | undefined> {
    const [progress] = await db.select().from(studentProgress).where(eq(studentProgress.id, id));
    return progress;
  }

  async getProgressByStudentAndLecture(studentId: number, lectureId: number): Promise<StudentProgress | undefined> {
    const [progress] = await db
      .select()
      .from(studentProgress)
      .where(
        and(
          eq(studentProgress.studentId, studentId),
          eq(studentProgress.lectureId, lectureId)
        )
      );
    return progress;
  }

  async getProgressByStudent(studentId: number): Promise<StudentProgress[]> {
    return db.select().from(studentProgress).where(eq(studentProgress.studentId, studentId));
  }

  async createStudentProgress(progress: InsertStudentProgress): Promise<StudentProgress> {
    const [newProgress] = await db.insert(studentProgress).values(progress).returning();
    return newProgress;
  }

  async updateStudentProgress(id: number, progress: Partial<InsertStudentProgress>): Promise<StudentProgress | undefined> {
    const [updatedProgress] = await db
      .update(studentProgress)
      .set(progress)
      .where(eq(studentProgress.id, id))
      .returning();
    return updatedProgress;
  }
  
  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getTasksByLecture(lectureId: number): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.lectureId, lectureId));
  }

  async getTasksByCourse(courseId: number): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.courseId, courseId));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set(task)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }
}

export const storage = new DatabaseStorage();
