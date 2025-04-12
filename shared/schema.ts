import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Schema (base for both doctors and patients)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  bio: text("bio"),
  profileImage: text("profile_image"),
  coverImage: text("cover_image"),
  role: text("role", { enum: ["doctor", "patient"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Doctor Specific Details
export const doctorProfiles = pgTable("doctor_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  specialty: text("specialty").notNull(),
  hospital: text("hospital"),
  qualifications: text("qualifications"),
  experience: integer("experience"),
  verified: boolean("verified").default(false),
  rating: integer("rating"),
  reviewCount: integer("review_count").default(0),
});

// Patient Specific Details
export const patientProfiles = pgTable("patient_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  conditions: text("conditions").array(),
});

// Post Schema
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  image: text("image"),
  isAnonymous: boolean("is_anonymous").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  postType: text("post_type", { enum: ["update", "question", "resource"] }),
  relatedConditions: text("related_conditions").array(),
  likes: integer("likes").default(0),
  commentCount: integer("comment_count").default(0),
});

// Comment Schema
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  likes: integer("likes").default(0),
});

// Connection Schema
export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull().references(() => users.id),
  followingId: integer("following_id").notNull().references(() => users.id),
  status: text("status", { enum: ["pending", "accepted"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Message Schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Appointment Schema
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => users.id),
  patientId: integer("patient_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  status: text("status", { enum: ["scheduled", "completed", "cancelled"] }).default("scheduled"),
  reason: text("reason"),
  notes: text("notes"),
  isVirtual: boolean("is_virtual").default(false),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Health Topics Schema
export const healthTopics = pgTable("health_topics", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  count: integer("count").default(0),
  isActive: boolean("is_active").default(true),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertDoctorProfileSchema = createInsertSchema(doctorProfiles).omit({ id: true });
export const insertPatientProfileSchema = createInsertSchema(patientProfiles).omit({ id: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true, likes: true, commentCount: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true, likes: true });
export const insertConnectionSchema = createInsertSchema(connections).omit({ id: true, createdAt: true, status: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true, isRead: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true, status: true });
export const insertHealthTopicSchema = createInsertSchema(healthTopics).omit({ id: true, count: true, isActive: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type DoctorProfile = typeof doctorProfiles.$inferSelect;
export type InsertDoctorProfile = z.infer<typeof insertDoctorProfileSchema>;

export type PatientProfile = typeof patientProfiles.$inferSelect;
export type InsertPatientProfile = z.infer<typeof insertPatientProfileSchema>;

export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Connection = typeof connections.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type HealthTopic = typeof healthTopics.$inferSelect;
export type InsertHealthTopic = z.infer<typeof insertHealthTopicSchema>;

// Extended User types with profile information
export type DoctorWithProfile = User & {
  profile: DoctorProfile;
};

export type PatientWithProfile = User & {
  profile: PatientProfile;
};

export type UserWithProfile = DoctorWithProfile | PatientWithProfile;

// Login Schema
export const loginSchema = z.object({
  username: z.string().min(3, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginData = z.infer<typeof loginSchema>;
