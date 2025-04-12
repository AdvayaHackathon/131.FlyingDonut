import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { loginSchema, insertUserSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  // Extended register schema with password confirmation
  const extendedRegisterSchema = insertUserSchema.extend({
    confirmPassword: z.string().min(6, "Confirm password is required"),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

  // Register form
  const registerForm = useForm({
    // resolver: zodResolver(extendedRegisterSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
      email: "",
      role: "patient",
      bio: ""
    }
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Handle login submission
  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    console.log("Login submitted:", values);
    loginMutation.mutate(values, {
      onError: (error) => {
        toast({
          title: "Login failed",
          description: error.message || "Please check your credentials and try again",
          variant: "destructive",
        });
      }
    });
  };

  // Handle registration submission
  const onRegisterSubmit = (values: any) => {
    console.log("Registration submitted:", values);
    
    if (values.password !== values.confirmPassword) {
      toast({
        title: "Registration failed",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    // Remove confirmPassword before sending to API
    const { confirmPassword, ...registerData } = values;
    
    registerMutation.mutate(registerData, {
      onError: (error) => {
        toast({
          title: "Registration failed",
          description: error.message || "Please check your information and try again",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="py-4 border-b border-gray-200 shadow-sm">
        <div className="container flex justify-center">
          <div className="flex items-center">
            <Heart className="h-6 w-6 text-primary mr-2" />
            <span className="text-xl font-semibold text-primary">MediConnect</span>
          </div>
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col justify-center">
            <div className="mb-6 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900">Welcome to MediConnect</h1>
              <p className="mt-2 text-gray-600">
                The professional network connecting healthcare providers and patients.
              </p>
            </div>

            <Card>
              <CardHeader className="space-y-1 pb-2">
                <h3 className="text-lg font-semibold">Account Access</h3>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Enter your password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full">
                          Sign In
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Enter your email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Choose a username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Create a password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full">
                          Create Account
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Hero Section */}
          <div className="hidden md:flex flex-col justify-center">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 rounded-xl">
              <h2 className="text-3xl font-bold text-primary mb-4">Connect. Collaborate. Care.</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="bg-primary/20 p-2 rounded-full mr-3">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">For Patients</h3>
                    <p className="text-gray-600">Find and connect with verified healthcare professionals, share experiences, and book appointments with ease.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-primary/20 p-2 rounded-full mr-3">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">For Doctors</h3>
                    <p className="text-gray-600">Build your professional network, showcase your expertise, and engage with patients in a secure environment.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-primary/20 p-2 rounded-full mr-3">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Secure & Private</h3>
                    <p className="text-gray-600">HIPAA-compliant platform with robust privacy controls to protect sensitive health information.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="py-4 border-t border-gray-200 mt-auto">
        <div className="container text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} MediConnect. All rights reserved.
        </div>
      </div>
    </div>
  );
}