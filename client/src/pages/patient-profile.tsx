import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import ProfileCard from "@/components/profile/profile-card";
import PostCard from "@/components/feed/post-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BookAppointmentModal from "@/components/appointments/book-appointment-modal";
import { MessageSquare, FileText, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { PatientWithProfile, Post } from "@shared/schema";

export default function PatientProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("posts");
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  
  // Fetch patient profile
  const { data: patient, isLoading: isLoadingPatient } = useQuery<PatientWithProfile>({
    queryKey: [`/api/patients/${id}`],
  });
  
  // Fetch patient's posts
  const { data: posts = [], isLoading: isLoadingPosts } = useQuery<Post[]>({
    queryKey: [`/api/posts`],
    select: (data) => data.filter(post => post.userId === parseInt(id) && !post.isAnonymous),
    enabled: !!id,
  });
  
  const isOwnProfile = user?.id === parseInt(id);
  
  const handleBookAppointment = (doctorId: number) => {
    setShowAppointmentModal(true);
  };
  
  if (isLoadingPatient) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-pulse text-primary">Loading patient profile...</div>
        </div>
        <Footer />
      </div>
    );
  }
  
  if (!patient) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Patient Not Found</h2>
            <p className="text-gray-600 mb-4">The patient profile you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <a href="/">Return to Home</a>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Sidebar - Profile Card */}
            <div className="lg:col-span-3">
              <ProfileCard user={patient} profile={patient.profile} />
              
              {!isOwnProfile && user?.role === "doctor" && (
                <Card className="mt-4">
                  <CardContent className="p-4">
                    <Button className="w-full mb-2">Connect</Button>
                    <Button variant="outline" className="w-full">
                      Send Message
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Main Content */}
            <div className="lg:col-span-9">
              {/* Patient Info Card */}
              <Card className="mb-6">
                <CardHeader className="pb-0">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                    <div>
                      <CardTitle className="text-2xl font-bold">{patient.name}</CardTitle>
                      <p className="text-gray-500 font-medium">Patient</p>
                    </div>
                    {isOwnProfile && (
                      <Button className="mt-4 md:mt-0">Edit Profile</Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4">
                  {patient.bio && (
                    <div className="mb-6">
                      <h3 className="font-medium mb-2">About</h3>
                      <p className="text-gray-700">{patient.bio}</p>
                    </div>
                  )}
                  
                  {patient.profile.conditions && patient.profile.conditions.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Health Conditions</h3>
                      <div className="flex flex-wrap gap-2">
                        {patient.profile.conditions.map((condition, index) => (
                          <Badge key={index} variant="outline" className="bg-gray-100 text-gray-700">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Content Tabs */}
              <Card>
                <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab}>
                  <CardHeader className="pb-0">
                    <TabsList className="grid grid-cols-2 w-full max-w-md">
                      <TabsTrigger value="posts">Public Posts</TabsTrigger>
                      <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                    </TabsList>
                  </CardHeader>
                  
                  <CardContent>
                    <TabsContent value="posts" className="space-y-6 pt-4">
                      {isLoadingPosts ? (
                        <div className="text-center py-12">
                          <div className="animate-pulse text-primary">Loading posts...</div>
                        </div>
                      ) : posts.length === 0 ? (
                        <div className="text-center py-12">
                          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-xl font-medium text-gray-700 mb-2">No Public Posts</h3>
                          <p className="text-gray-500 max-w-md mx-auto mb-6">
                            {isOwnProfile 
                              ? "You haven't shared any public posts yet."
                              : `${patient.name} hasn't shared any public posts yet.`
                            }
                          </p>
                          {isOwnProfile && (
                            <Button asChild>
                              <a href="/">Create Your First Post</a>
                            </Button>
                          )}
                        </div>
                      ) : (
                        posts.map(post => (
                          <PostCard 
                            key={post.id} 
                            post={{...post, author: patient}} 
                            onBookAppointment={handleBookAppointment}
                          />
                        ))
                      )}
                    </TabsContent>
                    
                    <TabsContent value="activity" className="pt-4">
                      <div className="text-center py-12">
                        <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-700 mb-2">No Recent Activity</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                          {isOwnProfile 
                            ? "Your recent activity will appear here."
                            : `${patient.name}'s recent activity will appear here.`
                          }
                        </p>
                      </div>
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
      
      {/* Book Appointment Modal */}
      {showAppointmentModal && (
        <BookAppointmentModal 
          isOpen={showAppointmentModal} 
          onClose={() => setShowAppointmentModal(false)}
        />
      )}
    </div>
  );
}
