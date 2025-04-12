import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertPostSchema, 
  insertCommentSchema, 
  insertConnectionSchema,
  insertMessageSchema,
  insertAppointmentSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Post routes
  app.get("/api/posts", async (req, res) => {
    try {
      const posts = await storage.getAllPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching posts" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validatedData = insertPostSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const post = await storage.createPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      res.status(400).json({ message: "Invalid post data" });
    }
  });

  app.post("/api/posts/:postId/like", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const postId = parseInt(req.params.postId);
      const userId = req.user!.id;
      
      await storage.likePost(postId, userId);
      res.sendStatus(200);
    } catch (error) {
      res.status(500).json({ message: "Error liking post" });
    }
  });

  // Comment routes
  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const comments = await storage.getCommentsByPostId(postId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching comments" });
    }
  });

  app.post("/api/posts/:postId/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const postId = parseInt(req.params.postId);
      
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        postId,
        userId: req.user!.id
      });
      
      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      res.status(400).json({ message: "Invalid comment data" });
    }
  });

  // Connection routes
  app.get("/api/connections", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const connections = await storage.getConnectionsByUserId(userId);
      res.json(connections);
    } catch (error) {
      res.status(500).json({ message: "Error fetching connections" });
    }
  });

  app.post("/api/connections", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validatedData = insertConnectionSchema.parse({
        ...req.body,
        followerId: req.user!.id
      });
      
      const connection = await storage.createConnection(validatedData);
      res.status(201).json(connection);
    } catch (error) {
      res.status(400).json({ message: "Invalid connection data" });
    }
  });

  app.put("/api/connections/:connectionId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const connectionId = parseInt(req.params.connectionId);
      const status = req.body.status;
      
      if (!["pending", "accepted"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const connection = await storage.updateConnectionStatus(connectionId, status);
      res.json(connection);
    } catch (error) {
      res.status(500).json({ message: "Error updating connection" });
    }
  });

  // Message routes
  app.get("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const messages = await storage.getMessagesByUserId(userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user!.id
      });
      
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: "Invalid message data" });
    }
  });

  app.put("/api/messages/:messageId/read", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const messageId = parseInt(req.params.messageId);
      const message = await storage.markMessageAsRead(messageId);
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Error updating message" });
    }
  });

  // Doctor routes
  app.get("/api/doctors", async (req, res) => {
    try {
      const doctors = await storage.getDoctors();
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ message: "Error fetching doctors" });
    }
  });

  app.get("/api/doctors/:id", async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const doctor = await storage.getDoctorById(doctorId);
      
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      res.json(doctor);
    } catch (error) {
      res.status(500).json({ message: "Error fetching doctor" });
    }
  });

  // Patient routes
  app.get("/api/patients/:id", async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const patient = await storage.getPatientById(patientId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Error fetching patient" });
    }
  });

  // Appointment routes
  app.get("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const role = req.user!.role;
      
      let appointments;
      if (role === "doctor") {
        appointments = await storage.getAppointmentsByDoctorId(userId);
      } else {
        appointments = await storage.getAppointmentsByPatientId(userId);
      }
      
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching appointments" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const role = req.user!.role;
      
      // Validate that if the user is a doctor, they're booking an appointment with themselves
      // Or if the user is a patient, they're the patient in the appointment
      if ((role === "doctor" && req.body.doctorId !== userId) || 
          (role === "patient" && req.body.patientId !== userId)) {
        return res.status(403).json({ message: "Unauthorized appointment creation" });
      }
      
      const validatedData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(validatedData);
      res.status(201).json(appointment);
    } catch (error) {
      res.status(400).json({ message: "Invalid appointment data" });
    }
  });

  app.put("/api/appointments/:appointmentId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const appointmentId = parseInt(req.params.appointmentId);
      const status = req.body.status;
      
      if (!["scheduled", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const appointment = await storage.updateAppointmentStatus(appointmentId, status);
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Error updating appointment" });
    }
  });

  // Health Topics
  app.get("/api/health-topics", async (req, res) => {
    try {
      const topics = await storage.getHealthTopics();
      res.json(topics);
    } catch (error) {
      res.status(500).json({ message: "Error fetching health topics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
