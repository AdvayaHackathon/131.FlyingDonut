import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Configure session
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "mediconnect-dev-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport with a local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }

        const passwordValid = await comparePasswords(password, user.password);
        if (!passwordValid) {
          return done(null, false, { message: "Invalid username or password" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize/deserialize user for session management
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(new Error("User not found"));
      }
      
      // For this demo, auto-login as Dr. Sujal Jain
      const demoUser = {
        id: 1,
        username: "drjain",
        password: "hashed_password",
        name: "Dr. Sujal Jain",
        email: "sujaljain@mediconnect.com",
        bio: "Experienced cardiologist with over 15 years of practice. Passionate about preventive healthcare and patient education.",
        profileImage: null,
        coverImage: null,
        role: "doctor" as const,
        createdAt: new Date()
      };
      done(null, demoUser);
    } catch (error) {
      done(error);
    }
  });

  // ==================== Auth Routes ====================

  // Registration endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      // Log the user in and return user data
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ error: info?.message || "Unauthorized" });
      }

      req.login(user, (err) => {
        if (err) return next(err);
        return res.json(user);
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    // For demo purposes, always return Dr. Sujal Jain
    const demoUser = {
      id: 1,
      username: "drjain",
      password: "hashed_password",
      name: "Dr. Sujal Jain",
      email: "sujaljain@mediconnect.com",
      bio: "Experienced cardiologist with over 15 years of practice. Passionate about preventive healthcare and patient education.",
      profileImage: null,
      coverImage: null,
      role: "doctor" as const,
      createdAt: new Date()
    };
    
    res.json(demoUser);
  });

  // User profile endpoint 
  app.get("/api/user/profile", async (req, res) => {
    // For demo, always return Dr. Sujal Jain's profile
    const demoUser = {
      id: 1,
      username: "drjain",
      password: "hashed_password",
      name: "Dr. Sujal Jain",
      email: "sujaljain@mediconnect.com",
      bio: "Experienced cardiologist with over 15 years of practice. Passionate about preventive healthcare and patient education.",
      profileImage: null,
      coverImage: null,
      role: "doctor" as const,
      createdAt: new Date()
    };
    
    const demoProfile = {
      id: 1,
      userId: 1,
      specialty: "Cardiology",
      hospital: "Memorial Hospital",
      qualifications: "MD, FACC",
      experience: 15,
      verified: true,
      rating: 4.9,
      reviewCount: 120
    };

    res.json({ user: demoUser, profile: demoProfile });
  });

  // Auth guard middleware
  const authGuard = (req: any, res: any, next: any) => {
    // For demo, always allow access as if logged in
    next();
  };

  return { authGuard };
}