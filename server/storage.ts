import { 
  User, InsertUser, 
  DoctorProfile, InsertDoctorProfile,
  PatientProfile, InsertPatientProfile,
  Post, InsertPost,
  Comment, InsertComment,
  Connection, InsertConnection,
  Message, InsertMessage,
  Appointment, InsertAppointment,
  HealthTopic, InsertHealthTopic,
  DoctorWithProfile, PatientWithProfile,
  users,
  doctorProfiles,
  patientProfiles,
  posts,
  comments,
  connections,
  messages,
  appointments,
  healthTopics
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Database setup
const connectionString = process.env.DATABASE_URL || "";
const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

// Session store setup
const PostgresSessionStore = connectPg(session);
const MemoryStore = createMemoryStore(session);

// Create a PostgreSQL connection pool
const pool = {
  query: (text: string, params: any[]) => client.unsafe(text, params),
  connect: () => Promise.resolve(client),
};

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User Management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Doctor Profiles
  getDoctorProfileByUserId(userId: number): Promise<DoctorProfile | undefined>;
  createDoctorProfile(profile: InsertDoctorProfile): Promise<DoctorProfile>;
  getDoctors(): Promise<DoctorWithProfile[]>;
  getDoctorById(id: number): Promise<DoctorWithProfile | undefined>;
  
  // Patient Profiles
  getPatientProfileByUserId(userId: number): Promise<PatientProfile | undefined>;
  createPatientProfile(profile: InsertPatientProfile): Promise<PatientProfile>;
  getPatientById(id: number): Promise<PatientWithProfile | undefined>;
  
  // Posts
  getAllPosts(): Promise<Post[]>;
  getPostsByUserId(userId: number): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
  likePost(postId: number, userId: number): Promise<void>;
  
  // Comments
  getCommentsByPostId(postId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Connections
  getConnectionsByUserId(userId: number): Promise<Connection[]>;
  createConnection(connection: InsertConnection): Promise<Connection>;
  updateConnectionStatus(connectionId: number, status: string): Promise<Connection>;
  
  // Messages
  getMessagesByUserId(userId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(messageId: number): Promise<Message>;
  
  // Appointments
  getAppointmentsByDoctorId(doctorId: number): Promise<Appointment[]>;
  getAppointmentsByPatientId(patientId: number): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointmentStatus(appointmentId: number, status: string): Promise<Appointment>;
  
  // Health Topics
  getHealthTopics(): Promise<HealthTopic[]>;
  createHealthTopic(topic: InsertHealthTopic): Promise<HealthTopic>;
  
  // Session Store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private doctorProfiles: Map<number, DoctorProfile>;
  private patientProfiles: Map<number, PatientProfile>;
  private posts: Map<number, Post>;
  private comments: Map<number, Comment>;
  private connections: Map<number, Connection>;
  private messages: Map<number, Message>;
  private appointments: Map<number, Appointment>;
  private healthTopics: Map<number, HealthTopic>;
  private postLikes: Map<number, Set<number>>;
  
  currentUserId: number;
  currentDoctorProfileId: number;
  currentPatientProfileId: number;
  currentPostId: number;
  currentCommentId: number;
  currentConnectionId: number;
  currentMessageId: number;
  currentAppointmentId: number;
  currentHealthTopicId: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.doctorProfiles = new Map();
    this.patientProfiles = new Map();
    this.posts = new Map();
    this.comments = new Map();
    this.connections = new Map();
    this.messages = new Map();
    this.appointments = new Map();
    this.healthTopics = new Map();
    this.postLikes = new Map();
    
    this.currentUserId = 1;
    this.currentDoctorProfileId = 1;
    this.currentPatientProfileId = 1;
    this.currentPostId = 1;
    this.currentCommentId = 1;
    this.currentConnectionId = 1;
    this.currentMessageId = 1;
    this.currentAppointmentId = 1;
    this.currentHealthTopicId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Seed health topics
    this.seedHealthTopics();
    
    // Seed dummy users and content
    this.seedUsers();
    this.seedContent();
  }
  
  private seedUsers() {
    // Create dummy doctors
    const doctor1 = this.createUser({
      name: "Dr. Sarah Johnson",
      username: "dr.sarah",
      password: "password123",
      email: "sarah@mediconnect.com",
      role: "doctor",
      bio: "Cardiologist with 15 years of experience specializing in heart disease prevention and treatment."
    });
    
    const doctor2 = this.createUser({
      name: "Dr. Michael Chen",
      username: "dr.michael",
      password: "password123",
      email: "michael@mediconnect.com",
      role: "doctor",
      bio: "Pediatrician focused on early childhood development and preventative care."
    });
    
    const doctor3 = this.createUser({
      name: "Dr. Emma Rodriguez",
      username: "dr.emma",
      password: "password123",
      email: "emma@mediconnect.com",
      role: "doctor",
      bio: "Neurologist specializing in stroke recovery and neurodegenerative disorders."
    });
    
    // Create doctor profiles
    this.createDoctorProfile({
      userId: doctor1.id,
      specialty: "Cardiology",
      hospital: "Memorial Hospital",
      qualifications: "MD, PhD, FACC",
      experience: 15,
      verified: true,
      rating: 4.8,
      reviewCount: 124
    });
    
    this.createDoctorProfile({
      userId: doctor2.id,
      specialty: "Pediatrics",
      hospital: "Children's Medical Center",
      qualifications: "MD, FAAP",
      experience: 8,
      verified: true,
      rating: 4.9,
      reviewCount: 87
    });
    
    this.createDoctorProfile({
      userId: doctor3.id,
      specialty: "Neurology",
      hospital: "University Medical Center",
      qualifications: "MD, PhD",
      experience: 12,
      verified: true,
      rating: 4.7,
      reviewCount: 92
    });
    
    // Create dummy patients
    const patient1 = this.createUser({
      name: "John Doe",
      username: "john_doe",
      password: "password123",
      email: "john@example.com",
      role: "patient",
      bio: "Looking for advice on managing chronic back pain and hypertension."
    });
    
    const patient2 = this.createUser({
      name: "Alice Smith",
      username: "alice_smith",
      password: "password123",
      email: "alice@example.com",
      role: "patient",
      bio: "Mother of two children with asthma, seeking to connect with pediatric specialists."
    });
    
    const patient3 = this.createUser({
      name: "Robert Taylor",
      username: "robert_taylor",
      password: "password123",
      email: "robert@example.com",
      role: "patient",
      bio: "Recently diagnosed with Type 2 diabetes, looking for lifestyle management tips."
    });
    
    // Create patient profiles
    this.createPatientProfile({
      userId: patient1.id,
      conditions: ["Hypertension", "Chronic Back Pain"]
    });
    
    this.createPatientProfile({
      userId: patient2.id,
      conditions: ["Family History: Asthma"]
    });
    
    this.createPatientProfile({
      userId: patient3.id,
      conditions: ["Type 2 Diabetes", "High Cholesterol"]
    });
  }
  
  private seedContent() {
    // Create some posts
    this.createPost({
      userId: 2, // Dr. Michael Chen
      content: "Parents: Remember that flu season is approaching! Make sure to schedule vaccinations for your children early to ensure they're protected before winter arrives.",
      postType: "resource",
      likes: 0,
      commentCount: 0
    });
    
    this.createPost({
      userId: 1, // Dr. Sarah Johnson
      content: "Just published a new research paper on preventative cardiology approaches in the International Journal of Cardiology. Happy to answer any questions!",
      postType: "update",
      likes: 0,
      commentCount: 0
    });
    
    this.createPost({
      userId: 5, // John Doe (patient)
      content: "Has anyone tried yoga for chronic back pain? My doctor recommended it, and I'm curious about others' experiences.",
      postType: "question",
      likes: 0,
      commentCount: 0
    });
    
    this.createPost({
      userId: 3, // Dr. Emma Rodriguez
      content: "Exciting news! Our neurology department is starting a new stroke recovery support group that meets virtually every Thursday. Open to all patients and their families.",
      postType: "update",
      likes: 0,
      commentCount: 0
    });
    
    // Create some comments
    this.createComment({
      postId: 3, // John's question about yoga
      userId: 1, // Dr. Sarah
      content: "While I'm not specialized in orthopedics, many of my cardiac patients have reported benefits from gentle yoga for various pain issues. Just make sure to start with a qualified instructor who understands your condition.",
      likes: 0
    });
    
    this.createComment({
      postId: 3, // John's question about yoga
      userId: 6, // Alice
      content: "I've been doing yoga for about 6 months now, and it's really helped with my lower back pain. I started with chair yoga and worked my way up. Definitely worth trying!",
      likes: 0
    });
    
    // Create some connections
    this.createConnection({
      requesterId: 5, // John (patient)
      receiverId: 1, // Dr. Sarah (doctor)
      status: "accepted"
    });
    
    this.createConnection({
      requesterId: 6, // Alice (patient)
      receiverId: 2, // Dr. Michael (doctor - pediatrician)
      status: "accepted"
    });
    
    this.createConnection({
      requesterId: 7, // Robert (patient)
      receiverId: 1, // Dr. Sarah (doctor - cardiologist)
      status: "pending"
    });
    
    // Create some messages
    this.createMessage({
      senderId: 5, // John
      receiverId: 1, // Dr. Sarah
      content: "Hello Dr. Johnson, I have a follow-up question about the medication you recommended last month.",
      isRead: true
    });
    
    this.createMessage({
      senderId: 1, // Dr. Sarah
      receiverId: 5, // John
      content: "Hi John, of course. What questions do you have about the medication?",
      isRead: true
    });
    
    this.createMessage({
      senderId: 5, // John
      receiverId: 1, // Dr. Sarah
      content: "I've noticed some mild dizziness in the mornings. Is this a common side effect?",
      isRead: false
    });
    
    // Create some appointments
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    this.createAppointment({
      doctorId: 1, // Dr. Sarah
      patientId: 5, // John
      date: nextWeek,
      status: "scheduled",
      reason: "Quarterly blood pressure check-up",
      notes: "Bring medication list",
      location: "Memorial Hospital, Room 302",
      isVirtual: false
    });
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    this.createAppointment({
      doctorId: 2, // Dr. Michael
      patientId: 6, // Alice
      date: tomorrow,
      status: "scheduled",
      reason: "Annual check-up for children",
      notes: "Both children will be present",
      location: null,
      isVirtual: true
    });
  }

  // User Management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }
  
  // Doctor Profiles
  async getDoctorProfileByUserId(userId: number): Promise<DoctorProfile | undefined> {
    return Array.from(this.doctorProfiles.values()).find(
      (profile) => profile.userId === userId,
    );
  }
  
  async createDoctorProfile(profile: InsertDoctorProfile): Promise<DoctorProfile> {
    const id = this.currentDoctorProfileId++;
    const doctorProfile: DoctorProfile = { ...profile, id };
    this.doctorProfiles.set(id, doctorProfile);
    return doctorProfile;
  }
  
  async getDoctors(): Promise<DoctorWithProfile[]> {
    const doctors: DoctorWithProfile[] = [];
    
    for (const user of this.users.values()) {
      if (user.role === "doctor") {
        const profile = await this.getDoctorProfileByUserId(user.id);
        if (profile) {
          doctors.push({ ...user, profile });
        }
      }
    }
    
    return doctors;
  }
  
  async getDoctorById(id: number): Promise<DoctorWithProfile | undefined> {
    const user = await this.getUser(id);
    if (!user || user.role !== "doctor") return undefined;
    
    const profile = await this.getDoctorProfileByUserId(id);
    if (!profile) return undefined;
    
    return { ...user, profile };
  }
  
  // Patient Profiles
  async getPatientProfileByUserId(userId: number): Promise<PatientProfile | undefined> {
    return Array.from(this.patientProfiles.values()).find(
      (profile) => profile.userId === userId,
    );
  }
  
  async createPatientProfile(profile: InsertPatientProfile): Promise<PatientProfile> {
    const id = this.currentPatientProfileId++;
    const patientProfile: PatientProfile = { ...profile, id };
    this.patientProfiles.set(id, patientProfile);
    return patientProfile;
  }
  
  async getPatientById(id: number): Promise<PatientWithProfile | undefined> {
    const user = await this.getUser(id);
    if (!user || user.role !== "patient") return undefined;
    
    const profile = await this.getPatientProfileByUserId(id);
    if (!profile) return undefined;
    
    return { ...user, profile };
  }
  
  // Posts
  async getAllPosts(): Promise<Post[]> {
    return Array.from(this.posts.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
  
  async getPostsByUserId(userId: number): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createPost(post: InsertPost): Promise<Post> {
    const id = this.currentPostId++;
    const createdAt = new Date();
    const newPost: Post = { 
      ...post, 
      id, 
      createdAt,
      likes: 0,
      commentCount: 0
    };
    this.posts.set(id, newPost);
    this.postLikes.set(id, new Set());
    return newPost;
  }
  
  async likePost(postId: number, userId: number): Promise<void> {
    const post = this.posts.get(postId);
    if (!post) throw new Error("Post not found");
    
    let likeSet = this.postLikes.get(postId);
    if (!likeSet) {
      likeSet = new Set();
      this.postLikes.set(postId, likeSet);
    }
    
    if (likeSet.has(userId)) {
      // Unlike
      likeSet.delete(userId);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      // Like
      likeSet.add(userId);
      post.likes += 1;
    }
    
    this.posts.set(postId, post);
  }
  
  // Comments
  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async createComment(comment: InsertComment): Promise<Comment> {
    const id = this.currentCommentId++;
    const createdAt = new Date();
    const newComment: Comment = { 
      ...comment, 
      id, 
      createdAt,
      likes: 0
    };
    this.comments.set(id, newComment);
    
    // Update post comment count
    const post = this.posts.get(comment.postId);
    if (post) {
      post.commentCount += 1;
      this.posts.set(comment.postId, post);
    }
    
    return newComment;
  }
  
  // Connections
  async getConnectionsByUserId(userId: number): Promise<Connection[]> {
    return Array.from(this.connections.values())
      .filter(conn => conn.followerId === userId || conn.followingId === userId);
  }
  
  async createConnection(connection: InsertConnection): Promise<Connection> {
    const id = this.currentConnectionId++;
    const createdAt = new Date();
    const newConnection: Connection = { 
      ...connection, 
      id, 
      createdAt,
      status: "pending"
    };
    this.connections.set(id, newConnection);
    return newConnection;
  }
  
  async updateConnectionStatus(connectionId: number, status: string): Promise<Connection> {
    const connection = this.connections.get(connectionId);
    if (!connection) throw new Error("Connection not found");
    
    connection.status = status as any;
    this.connections.set(connectionId, connection);
    return connection;
  }
  
  // Messages
  async getMessagesByUserId(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.senderId === userId || msg.receiverId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const createdAt = new Date();
    const newMessage: Message = { 
      ...message, 
      id, 
      createdAt,
      isRead: false
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }
  
  async markMessageAsRead(messageId: number): Promise<Message> {
    const message = this.messages.get(messageId);
    if (!message) throw new Error("Message not found");
    
    message.isRead = true;
    this.messages.set(messageId, message);
    return message;
  }
  
  // Appointments
  async getAppointmentsByDoctorId(doctorId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(appt => appt.doctorId === doctorId)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  
  async getAppointmentsByPatientId(patientId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(appt => appt.patientId === patientId)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentAppointmentId++;
    const createdAt = new Date();
    const newAppointment: Appointment = { 
      ...appointment, 
      id, 
      createdAt,
      status: "scheduled"
    };
    this.appointments.set(id, newAppointment);
    return newAppointment;
  }
  
  async updateAppointmentStatus(appointmentId: number, status: string): Promise<Appointment> {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) throw new Error("Appointment not found");
    
    appointment.status = status as any;
    this.appointments.set(appointmentId, appointment);
    return appointment;
  }
  
  // Health Topics
  async getHealthTopics(): Promise<HealthTopic[]> {
    return Array.from(this.healthTopics.values())
      .filter(topic => topic.isActive)
      .sort((a, b) => b.count - a.count);
  }
  
  async createHealthTopic(topic: InsertHealthTopic): Promise<HealthTopic> {
    const id = this.currentHealthTopicId++;
    const newTopic: HealthTopic = { 
      ...topic, 
      id,
      count: 0,
      isActive: true
    };
    this.healthTopics.set(id, newTopic);
    return newTopic;
  }
  
  // Seed initial health topics
  private seedHealthTopics() {
    const topics = [
      { title: "COVID-19 Booster Shots", count: 3200 },
      { title: "Mental Health Awareness", count: 2800 },
      { title: "Diabetes Management", count: 1900 },
      { title: "Heart Disease Prevention", count: 1700 },
      { title: "Women's Health Issues", count: 1500 }
    ];
    
    topics.forEach(topic => {
      const id = this.currentHealthTopicId++;
      this.healthTopics.set(id, {
        id,
        title: topic.title,
        count: topic.count,
        isActive: true
      });
    });
  }
}

export class PostgresStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
  }
  
  // User Management
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...user,
      createdAt: new Date()
    }).returning();
    return result[0];
  }
  
  // Doctor Profiles
  async getDoctorProfileByUserId(userId: number): Promise<DoctorProfile | undefined> {
    const result = await db.select().from(doctorProfiles).where(eq(doctorProfiles.userId, userId));
    return result[0];
  }
  
  async createDoctorProfile(profile: InsertDoctorProfile): Promise<DoctorProfile> {
    const result = await db.insert(doctorProfiles).values(profile).returning();
    return result[0];
  }
  
  async getDoctors(): Promise<DoctorWithProfile[]> {
    const doctors = await db.select()
      .from(users)
      .where(eq(users.role, "doctor"));
    
    const result: DoctorWithProfile[] = [];
    
    for (const doctor of doctors) {
      const profile = await this.getDoctorProfileByUserId(doctor.id);
      if (profile) {
        result.push({ ...doctor, profile });
      }
    }
    
    return result;
  }
  
  async getDoctorById(id: number): Promise<DoctorWithProfile | undefined> {
    const user = await this.getUser(id);
    if (!user || user.role !== "doctor") return undefined;
    
    const profile = await this.getDoctorProfileByUserId(id);
    if (!profile) return undefined;
    
    return { ...user, profile };
  }
  
  // Patient Profiles
  async getPatientProfileByUserId(userId: number): Promise<PatientProfile | undefined> {
    const result = await db.select().from(patientProfiles).where(eq(patientProfiles.userId, userId));
    return result[0];
  }
  
  async createPatientProfile(profile: InsertPatientProfile): Promise<PatientProfile> {
    const result = await db.insert(patientProfiles).values(profile).returning();
    return result[0];
  }
  
  async getPatientById(id: number): Promise<PatientWithProfile | undefined> {
    const user = await this.getUser(id);
    if (!user || user.role !== "patient") return undefined;
    
    const profile = await this.getPatientProfileByUserId(id);
    if (!profile) return undefined;
    
    return { ...user, profile };
  }
  
  // Posts
  async getAllPosts(): Promise<Post[]> {
    return await db.select().from(posts).orderBy(desc(posts.createdAt));
  }
  
  async getPostsByUserId(userId: number): Promise<Post[]> {
    return await db.select().from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
  }
  
  async createPost(post: InsertPost): Promise<Post> {
    const result = await db.insert(posts).values({
      ...post,
      createdAt: new Date(),
      likes: 0,
      commentCount: 0
    }).returning();
    return result[0];
  }
  
  async likePost(postId: number, userId: number): Promise<void> {
    // This would be better with a post_likes junction table in a real app
    // For simplicity, we'll just increment the likes count
    await db.update(posts)
      .set({ likes: sql`${posts.likes} + 1` })
      .where(eq(posts.id, postId));
  }
  
  // Comments
  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return await db.select().from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt);
  }
  
  async createComment(comment: InsertComment): Promise<Comment> {
    // Create comment
    const result = await db.insert(comments).values({
      ...comment,
      createdAt: new Date(),
      likes: 0
    }).returning();
    
    // Update post comment count
    await db.update(posts)
      .set({ commentCount: sql`${posts.commentCount} + 1` })
      .where(eq(posts.id, comment.postId));
    
    return result[0];
  }
  
  // Connections
  async getConnectionsByUserId(userId: number): Promise<Connection[]> {
    return await db.select().from(connections)
      .where(
        sql`${connections.followerId} = ${userId} OR ${connections.followingId} = ${userId}`
      );
  }
  
  async createConnection(connection: InsertConnection): Promise<Connection> {
    const result = await db.insert(connections).values({
      ...connection,
      createdAt: new Date(),
      status: "pending"
    }).returning();
    return result[0];
  }
  
  async updateConnectionStatus(connectionId: number, status: string): Promise<Connection> {
    const result = await db.update(connections)
      .set({ status: status as any })
      .where(eq(connections.id, connectionId))
      .returning();
    return result[0];
  }
  
  // Messages
  async getMessagesByUserId(userId: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(
        sql`${messages.senderId} = ${userId} OR ${messages.receiverId} = ${userId}`
      )
      .orderBy(desc(messages.createdAt));
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values({
      ...message,
      createdAt: new Date(),
      isRead: false
    }).returning();
    return result[0];
  }
  
  async markMessageAsRead(messageId: number): Promise<Message> {
    const result = await db.update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId))
      .returning();
    return result[0];
  }
  
  // Appointments
  async getAppointmentsByDoctorId(doctorId: number): Promise<Appointment[]> {
    return await db.select().from(appointments)
      .where(eq(appointments.doctorId, doctorId))
      .orderBy(appointments.date);
  }
  
  async getAppointmentsByPatientId(patientId: number): Promise<Appointment[]> {
    return await db.select().from(appointments)
      .where(eq(appointments.patientId, patientId))
      .orderBy(appointments.date);
  }
  
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const result = await db.insert(appointments).values({
      ...appointment,
      createdAt: new Date(),
      status: "scheduled"
    }).returning();
    return result[0];
  }
  
  async updateAppointmentStatus(appointmentId: number, status: string): Promise<Appointment> {
    const result = await db.update(appointments)
      .set({ status: status as any })
      .where(eq(appointments.id, appointmentId))
      .returning();
    return result[0];
  }
  
  // Health Topics
  async getHealthTopics(): Promise<HealthTopic[]> {
    return await db.select().from(healthTopics)
      .where(eq(healthTopics.isActive, true))
      .orderBy(desc(healthTopics.count));
  }
  
  async createHealthTopic(topic: InsertHealthTopic): Promise<HealthTopic> {
    const result = await db.insert(healthTopics).values({
      ...topic,
      count: 0,
      isActive: true
    }).returning();
    return result[0];
  }
}

// Set storage implementation based on environment
export const storage = process.env.DATABASE_URL 
  ? new PostgresStorage() 
  : new MemStorage();
