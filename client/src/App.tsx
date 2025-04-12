import { Switch, Route, Redirect } from "wouter";
import { createContext, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import DoctorProfile from "@/pages/doctor-profile";
import PatientProfile from "@/pages/patient-profile";
import Messages from "@/pages/messages";
import Appointments from "@/pages/appointments";
import Network from "@/pages/network";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthContext } from "./hooks/use-auth";

// Dummy user for demonstration
const dummyUser = {
  id: 1,
  name: "Dr. Sarah Johnson",
  username: "dr.sarah",
  password: "password123",
  email: "sarah@mediconnect.com",
  role: "doctor" as const,
  bio: "Cardiologist with 15 years of experience specializing in heart disease prevention and treatment.",
  profileImage: null,
  coverImage: null,
  createdAt: new Date()
};

// Simple AuthProvider implementation for demo purposes
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user] = useState(dummyUser);
  
  // Create a simplified auth context value
  const value = {
    user,
    isLoading: false,
    error: null,
    loginMutation: {
      mutate: () => {},
      isPending: false,
    },
    logoutMutation: {
      mutate: () => {},
      isPending: false,
    },
    registerMutation: {
      mutate: () => {},
      isPending: false,
    }
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Simplified router without auth protection for demo purposes
function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth">
        {() => <Redirect to="/" />}
      </Route>
      <Route path="/doctors/:id" component={DoctorProfile} />
      <Route path="/patients/:id" component={PatientProfile} />
      <Route path="/messages" component={Messages} />
      <Route path="/appointments" component={Appointments} />
      <Route path="/network" component={Network} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
