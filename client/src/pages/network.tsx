import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Avatar as AvatarGroup } from "@/components/ui/avatar-group";
import { Badge } from "@/components/ui/badge";
import { StarIcon, Search, MapPin, Filter, UserPlus, Check, Clock, X, Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import BookAppointmentModal from "@/components/appointments/book-appointment-modal";
import { DoctorWithProfile, PatientWithProfile, Connection, InsertConnection } from "@shared/schema";

export default function Network() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("doctors");
  const [searchQuery, setSearchQuery] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number>();
  
  // Fetch doctors
  const { data: doctors = [], isLoading: isLoadingDoctors } = useQuery<DoctorWithProfile[]>({
    queryKey: ["/api/doctors"],
  });
  
  // Fetch patients (if user is a doctor)
  const { data: patients = [], isLoading: isLoadingPatients } = useQuery<PatientWithProfile[]>({
    queryKey: ["/api/patients"],
    enabled: user?.role === "doctor",
  });
  
  // Fetch connections
  const { data: connections = [], isLoading: isLoadingConnections } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
  });
  
  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async (userId: number) => {
      const connection: InsertConnection = {
        followerId: user!.id,
        followingId: userId,
      };
      const res = await apiRequest("POST", "/api/connections", connection);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection Request Sent",
        description: "Your connection request has been sent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send connection request: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Accept connection mutation
  const acceptConnectionMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      const res = await apiRequest("PUT", `/api/connections/${connectionId}`, { status: "accepted" });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection Accepted",
        description: "You've successfully connected with this user",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to accept connection: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Filter doctors/patients based on search query and specialty
  const filterProfessionals = (items: DoctorWithProfile[] | PatientWithProfile[]) => {
    return items.filter(item => {
      const matchesSearch = searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.bio && item.bio.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // For doctors, also check specialty
      if ('profile' in item && 'specialty' in item.profile) {
        const doctorProfile = item as DoctorWithProfile;
        const matchesSpecialty = specialty === "" || 
          doctorProfile.profile.specialty.toLowerCase().includes(specialty.toLowerCase());
        
        return matchesSearch && matchesSpecialty;
      }
      
      return matchesSearch;
    });
  };
  
  // Get connection status between current user and another user
  const getConnectionStatus = (userId: number) => {
    const sentConnection = connections.find(c => 
      c.followerId === user?.id && c.followingId === userId
    );
    
    const receivedConnection = connections.find(c => 
      c.followerId === userId && c.followingId === user?.id
    );
    
    if (sentConnection) {
      return {
        status: sentConnection.status,
        id: sentConnection.id,
        type: 'sent'
      };
    }
    
    if (receivedConnection) {
      return {
        status: receivedConnection.status,
        id: receivedConnection.id,
        type: 'received'
      };
    }
    
    return { status: 'none', id: 0, type: 'none' };
  };
  
  // Get pending connection requests
  const getPendingRequests = () => {
    return connections.filter(c => 
      c.followingId === user?.id && c.status === "pending"
    );
  };
  
  // Get accepted connections
  const getConnections = () => {
    return connections.filter(c => 
      (c.followerId === user?.id || c.followingId === user?.id) && 
      c.status === "accepted"
    );
  };
  
  const filteredDoctors = filterProfessionals(doctors);
  const filteredPatients = user?.role === "doctor" ? filterProfessionals(patients) : [];
  const pendingRequests = getPendingRequests();
  const myConnections = getConnections();
  
  // Get user details by id
  const getUserById = (userId: number) => {
    return doctors.find(d => d.id === userId) || patients.find(p => p.id === userId);
  };
  
  // Get unique specialties for filter
  const specialties = [...new Set(doctors.map(d => d.profile.specialty))].filter(Boolean);
  
  // Handle connection action
  const handleConnect = (userId: number) => {
    connectMutation.mutate(userId);
  };
  
  // Handle accepting connection
  const handleAcceptConnection = (connectionId: number) => {
    acceptConnectionMutation.mutate(connectionId);
  };
  
  // Handle booking appointment
  const handleBookAppointment = (doctorId: number) => {
    setSelectedDoctorId(doctorId);
    setShowBookModal(true);
  };
  
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Network</h1>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Network Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Connections</p>
                      <p className="text-2xl font-bold">{myConnections.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pending Requests</p>
                      <p className="text-2xl font-bold">{pendingRequests.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {pendingRequests.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Connection Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingRequests.map(request => {
                        const requester = getUserById(request.followerId);
                        
                        return requester ? (
                          <div key={request.id} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarImage src={requester.profileImage} />
                                <AvatarFallback>{requester.name?.[0] || "U"}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-medium">{requester.name}</h4>
                                <p className="text-xs text-gray-500 capitalize">{requester.role}</p>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="w-8 h-8 p-0 text-red-500"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="w-8 h-8 p-0 text-green-500"
                                onClick={() => handleAcceptConnection(request.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {user?.role === "patient" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Find by Specialty</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div 
                        className={`px-3 py-2 rounded-md cursor-pointer ${specialty === "" ? "bg-primary/10 text-primary" : "hover:bg-gray-100"}`}
                        onClick={() => setSpecialty("")}
                      >
                        All Specialties
                      </div>
                      {specialties.map((s, index) => (
                        <div 
                          key={index} 
                          className={`px-3 py-2 rounded-md cursor-pointer ${specialty === s ? "bg-primary/10 text-primary" : "hover:bg-gray-100"}`}
                          onClick={() => setSpecialty(s)}
                        >
                          {s}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center md:space-y-0">
                    <CardTitle>Find Connections</CardTitle>
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Search..." 
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <Tabs defaultValue="doctors" value={activeTab} onValueChange={setActiveTab}>
                  <div className="px-4">
                    <TabsList className="w-full max-w-md">
                      <TabsTrigger value="doctors" className="flex-1">Doctors</TabsTrigger>
                      {user?.role === "doctor" && (
                        <TabsTrigger value="patients" className="flex-1">Patients</TabsTrigger>
                      )}
                      <TabsTrigger value="connections" className="flex-1">My Connections</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <CardContent className="pt-6">
                    <TabsContent value="doctors" className="mt-0">
                      {isLoadingDoctors ? (
                        <div className="flex justify-center py-12">
                          <div className="animate-pulse text-primary">Loading doctors...</div>
                        </div>
                      ) : filteredDoctors.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                            <Search className="h-8 w-8 text-primary" />
                          </div>
                          <h3 className="text-xl font-medium text-gray-900 mb-2">No Doctors Found</h3>
                          <p className="text-gray-500 max-w-md mx-auto">
                            {searchQuery 
                              ? `No doctors match "${searchQuery}"` 
                              : specialty 
                                ? `No doctors with specialty "${specialty}" found` 
                                : "No doctors available at the moment."}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {filteredDoctors.map(doctor => {
                            if (doctor.id === user?.id) return null; // Don't show current user
                            
                            const connectionStatus = getConnectionStatus(doctor.id);
                            
                            return (
                              <Card key={doctor.id} className="border">
                                <CardContent className="p-4">
                                  <div className="flex">
                                    <Avatar className="h-16 w-16 mr-4">
                                      <AvatarImage src={doctor.profileImage} />
                                      <AvatarFallback>{doctor.name?.[0] || "D"}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <h3 className="font-medium text-lg">{doctor.name}</h3>
                                      <p className="text-sm text-gray-600">{doctor.profile.specialty}</p>
                                      <div className="flex items-center text-sm mt-1">
                                        {renderStars(doctor.profile.rating || 4.5)}
                                        <span className="ml-1 text-gray-500">
                                          ({doctor.profile.reviewCount || 0})
                                        </span>
                                      </div>
                                      {doctor.profile.hospital && (
                                        <div className="flex items-center text-sm text-gray-500 mt-1">
                                          <MapPin className="h-3 w-3 mr-1" />
                                          <span>{doctor.profile.hospital}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="mt-4 flex space-x-2">
                                    {connectionStatus.status === "none" ? (
                                      <Button 
                                        className="flex-1" 
                                        size="sm"
                                        onClick={() => handleConnect(doctor.id)}
                                        disabled={connectMutation.isPending}
                                      >
                                        <UserPlus className="h-4 w-4 mr-1" /> Connect
                                      </Button>
                                    ) : connectionStatus.status === "pending" ? (
                                      connectionStatus.type === "sent" ? (
                                        <Button 
                                          className="flex-1" 
                                          size="sm" 
                                          variant="outline" 
                                          disabled
                                        >
                                          <Clock className="h-4 w-4 mr-1" /> Request Sent
                                        </Button>
                                      ) : (
                                        <Button 
                                          className="flex-1" 
                                          size="sm"
                                          onClick={() => handleAcceptConnection(connectionStatus.id)}
                                        >
                                          <Check className="h-4 w-4 mr-1" /> Accept
                                        </Button>
                                      )
                                    ) : (
                                      <Button className="flex-1" size="sm" variant="outline">
                                        <Check className="h-4 w-4 mr-1" /> Connected
                                      </Button>
                                    )}
                                    
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="flex-1"
                                      onClick={() => handleBookAppointment(doctor.id)}
                                    >
                                      Book Appointment
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="patients" className="mt-0">
                      {isLoadingPatients ? (
                        <div className="flex justify-center py-12">
                          <div className="animate-pulse text-primary">Loading patients...</div>
                        </div>
                      ) : filteredPatients.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                            <Search className="h-8 w-8 text-primary" />
                          </div>
                          <h3 className="text-xl font-medium text-gray-900 mb-2">No Patients Found</h3>
                          <p className="text-gray-500 max-w-md mx-auto">
                            {searchQuery ? `No patients match "${searchQuery}"` : "No patients available at the moment."}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {filteredPatients.map(patient => {
                            if (patient.id === user?.id) return null; // Don't show current user
                            
                            const connectionStatus = getConnectionStatus(patient.id);
                            
                            return (
                              <Card key={patient.id} className="border">
                                <CardContent className="p-4">
                                  <div className="flex">
                                    <Avatar className="h-16 w-16 mr-4">
                                      <AvatarImage src={patient.profileImage} />
                                      <AvatarFallback>{patient.name?.[0] || "P"}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <h3 className="font-medium text-lg">{patient.name}</h3>
                                      <p className="text-sm text-gray-600">Patient</p>
                                      
                                      {patient.profile.conditions && patient.profile.conditions.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {patient.profile.conditions.map((condition, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                              {condition}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="mt-4 flex">
                                    {connectionStatus.status === "none" ? (
                                      <Button 
                                        className="flex-1" 
                                        size="sm"
                                        onClick={() => handleConnect(patient.id)}
                                        disabled={connectMutation.isPending}
                                      >
                                        <UserPlus className="h-4 w-4 mr-1" /> Connect
                                      </Button>
                                    ) : connectionStatus.status === "pending" ? (
                                      connectionStatus.type === "sent" ? (
                                        <Button 
                                          className="flex-1" 
                                          size="sm" 
                                          variant="outline" 
                                          disabled
                                        >
                                          <Clock className="h-4 w-4 mr-1" /> Request Sent
                                        </Button>
                                      ) : (
                                        <Button 
                                          className="flex-1" 
                                          size="sm"
                                          onClick={() => handleAcceptConnection(connectionStatus.id)}
                                        >
                                          <Check className="h-4 w-4 mr-1" /> Accept
                                        </Button>
                                      )
                                    ) : (
                                      <Button className="flex-1" size="sm" variant="outline">
                                        <Check className="h-4 w-4 mr-1" /> Connected
                                      </Button>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="connections" className="mt-0">
                      {isLoadingConnections ? (
                        <div className="flex justify-center py-12">
                          <div className="animate-pulse text-primary">Loading connections...</div>
                        </div>
                      ) : myConnections.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                            <UserPlus className="h-8 w-8 text-primary" />
                          </div>
                          <h3 className="text-xl font-medium text-gray-900 mb-2">No Connections Yet</h3>
                          <p className="text-gray-500 max-w-md mx-auto mb-6">
                            Start building your network by connecting with doctors and patients.
                          </p>
                          <Button onClick={() => setActiveTab("doctors")}>
                            Find Connections
                          </Button>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-medium text-gray-900 mb-4">Your Connections ({myConnections.length})</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {myConnections.map(connection => {
                              const partnerId = connection.followerId === user?.id 
                                ? connection.followingId 
                                : connection.followerId;
                              const partner = getUserById(partnerId);
                              
                              if (!partner) return null;
                              
                              return (
                                <Card key={connection.id} className="border">
                                  <CardContent className="p-4 text-center">
                                    <Avatar className="h-16 w-16 mx-auto mb-3">
                                      <AvatarImage src={partner.profileImage} />
                                      <AvatarFallback>{partner.name?.[0] || "U"}</AvatarFallback>
                                    </Avatar>
                                    <h3 className="font-medium">{partner.name}</h3>
                                    <p className="text-sm text-gray-500 capitalize">
                                      {partner.role === "doctor" 
                                        ? (partner as DoctorWithProfile).profile.specialty 
                                        : "Patient"}
                                    </p>
                                    <div className="mt-3 flex justify-center space-x-2">
                                      <Button size="sm" variant="outline">
                                        View Profile
                                      </Button>
                                      <Button size="sm" variant="outline">
                                        Message
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
      
      <BookAppointmentModal 
        isOpen={showBookModal} 
        onClose={() => setShowBookModal(false)}
        selectedDoctorId={selectedDoctorId}
      />
    </div>
  );
}
