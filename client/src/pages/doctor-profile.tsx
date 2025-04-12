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
import { Calendar, MapPin, Award, Briefcase, Stethoscope, Users, Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { DoctorWithProfile, Post } from "@shared/schema";

export default function DoctorProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("posts");
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  
  // Fetch doctor profile
  const { data: doctor, isLoading: isLoadingDoctor } = useQuery<DoctorWithProfile>({
    queryKey: [`/api/doctors/${id}`],
  });
  
  // Fetch doctor's posts
  const { data: posts = [], isLoading: isLoadingPosts } = useQuery<Post[]>({
    queryKey: [`/api/posts`],
    select: (data) => data.filter(post => post.userId === parseInt(id)),
    enabled: !!id,
  });
  
  const isOwnProfile = user?.id === parseInt(id);
  
  const handleBookAppointment = () => {
    setShowAppointmentModal(true);
  };
  
  if (isLoadingDoctor) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-pulse text-primary">Loading doctor profile...</div>
        </div>
        <Footer />
      </div>
    );
  }
  
  if (!doctor) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Doctor Not Found</h2>
            <p className="text-gray-600 mb-4">The doctor profile you're looking for doesn't exist or has been removed.</p>
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
              <ProfileCard user={doctor} profile={doctor.profile} />
              
              {!isOwnProfile && (
                <Card className="mt-4">
                  <CardContent className="p-4">
                    <Button 
                      className="w-full mb-2" 
                      onClick={handleBookAppointment}
                    >
                      Book Appointment
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                    >
                      Send Message
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Main Content */}
            <div className="lg:col-span-9">
              {/* Doctor Info Card */}
              <Card className="mb-6">
                <CardHeader className="pb-0">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-2xl font-bold">Dr. {doctor.name}</CardTitle>
                        {doctor.profile.verified && (
                          <Badge className="bg-green-500">Verified</Badge>
                        )}
                      </div>
                      <p className="text-gray-500 font-medium">{doctor.profile.specialty}</p>
                    </div>
                    {isOwnProfile && (
                      <Button className="mt-4 md:mt-0">Edit Profile</Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <span className="text-gray-700">
                        {doctor.profile.experience} years of experience
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span className="text-gray-700">
                        {doctor.profile.hospital || "No hospital specified"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      <span className="text-gray-700">
                        {doctor.profile.qualifications || "Qualifications not specified"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-amber-500" />
                      <span className="text-gray-700">
                        {doctor.profile.rating || "4.8"} rating ({doctor.profile.reviewCount || "0"} reviews)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <span className="text-gray-700">
                        Available for appointments
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <span className="text-gray-700">
                        {Math.floor(Math.random() * 100) + 50} connections
                      </span>
                    </div>
                  </div>
                  
                  {doctor.bio && (
                    <div className="mt-6">
                      <h3 className="font-medium mb-2">About</h3>
                      <p className="text-gray-700">{doctor.bio}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Content Tabs */}
              <Card>
                <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab}>
                  <CardHeader className="pb-0">
                    <TabsList className="grid grid-cols-3 w-full max-w-md">
                      <TabsTrigger value="posts">Posts</TabsTrigger>
                      <TabsTrigger value="articles">Articles</TabsTrigger>
                      <TabsTrigger value="achievements">Achievements</TabsTrigger>
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
                          <Stethoscope className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-xl font-medium text-gray-700 mb-2">No Posts Yet</h3>
                          <p className="text-gray-500 max-w-md mx-auto mb-6">
                            Dr. {doctor.name} hasn't shared any posts or medical updates yet.
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
                            post={{...post, author: doctor}} 
                            onBookAppointment={handleBookAppointment}
                          />
                        ))
                      )}
                    </TabsContent>
                    
                    <TabsContent value="articles" className="pt-4">
                      <div className="text-center py-12">
                        <Stethoscope className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-700 mb-2">No Articles Yet</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-6">
                          Dr. {doctor.name} hasn't published any medical articles yet.
                        </p>
                        {isOwnProfile && (
                          <Button>Publish an Article</Button>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="achievements" className="pt-4">
                      <div className="text-center py-12">
                        <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-700 mb-2">No Achievements Listed</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-6">
                          Dr. {doctor.name} hasn't added any professional achievements or certifications yet.
                        </p>
                        {isOwnProfile && (
                          <Button>Add Achievements</Button>
                        )}
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
      <BookAppointmentModal 
        isOpen={showAppointmentModal} 
        onClose={() => setShowAppointmentModal(false)} 
        selectedDoctorId={parseInt(id)}
      />
    </div>
  );
}
