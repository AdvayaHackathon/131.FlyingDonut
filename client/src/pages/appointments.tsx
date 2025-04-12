import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, isAfter, isBefore, isPast } from "date-fns";
import { Calendar, Clock, MapPin, Video, BookOpen, CalendarX, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import BookAppointmentModal from "@/components/appointments/book-appointment-modal";
import { Appointment, User, DoctorWithProfile } from "@shared/schema";

export default function Appointments() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [showBookModal, setShowBookModal] = useState(false);
  
  // Fetch appointments
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });
  
  // Fetch doctors for doctor names
  const { data: doctors = [] } = useQuery<DoctorWithProfile[]>({
    queryKey: ["/api/doctors"],
  });
  
  // Fetch patients for patient names (only needed if user is a doctor)
  const { data: patients = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    select: (data) => data.filter(u => u.role === "patient"),
    enabled: user?.role === "doctor",
  });
  
  // Filter appointments based on the active tab
  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.date);
    
    if (activeTab === "upcoming") {
      return isAfter(appointmentDate, new Date()) && appointment.status !== "cancelled";
    } else if (activeTab === "past") {
      return isBefore(appointmentDate, new Date()) || appointment.status === "completed";
    } else if (activeTab === "cancelled") {
      return appointment.status === "cancelled";
    }
    
    return true;
  });
  
  // Sort appointments by date
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    if (activeTab === "past") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  
  // Get partner details for an appointment
  const getPartnerDetails = (appointment: Appointment) => {
    if (user?.role === "doctor") {
      return patients.find(p => p.id === appointment.patientId);
    } else {
      return doctors.find(d => d.id === appointment.doctorId);
    }
  };
  
  // Format appointment date
  const formatAppointmentDate = (date: Date) => {
    return format(new Date(date), "EEEE, MMMM d, yyyy");
  };
  
  // Format appointment time
  const formatAppointmentTime = (date: Date) => {
    return format(new Date(date), "h:mm a");
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
            <Button onClick={() => setShowBookModal(true)}>
              Book New Appointment
            </Button>
          </div>
          
          <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
            <div className="mb-6">
              <TabsList className="w-full max-w-md">
                <TabsTrigger value="upcoming" className="flex-1">Upcoming</TabsTrigger>
                <TabsTrigger value="past" className="flex-1">Past</TabsTrigger>
                <TabsTrigger value="cancelled" className="flex-1">Cancelled</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="upcoming" className="mt-0">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-pulse text-primary">Loading appointments...</div>
                </div>
              ) : sortedAppointments.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                      <Calendar className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No Upcoming Appointments</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      You don't have any upcoming appointments scheduled at the moment.
                    </p>
                    <Button onClick={() => setShowBookModal(true)}>
                      Book an Appointment
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {sortedAppointments.map(appointment => {
                    const partner = getPartnerDetails(appointment);
                    
                    return (
                      <Card key={appointment.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarImage src={partner?.profileImage} />
                                <AvatarFallback>{partner?.name?.[0] || "U"}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-medium">
                                  {partner?.name || (user?.role === "doctor" ? "Patient" : "Doctor")}
                                </h3>
                                <p className="text-xs text-gray-500 capitalize">
                                  {user?.role === "doctor" ? "Patient" : partner?.role === "doctor" ? 
                                   (doctors.find(d => d.id === partner.id)?.profile.specialty || "Doctor") : "Unknown"}
                                </p>
                              </div>
                            </div>
                            <div>
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(appointment.status)}`}>
                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center text-sm">
                              <Calendar className="h-4 w-4 text-primary mr-2" />
                              <span>{formatAppointmentDate(appointment.date)}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <Clock className="h-4 w-4 text-primary mr-2" />
                              <span>{formatAppointmentTime(appointment.date)}</span>
                            </div>
                            {appointment.location && (
                              <div className="flex items-center text-sm">
                                <MapPin className="h-4 w-4 text-primary mr-2" />
                                <span>{appointment.location}</span>
                              </div>
                            )}
                            {appointment.reason && (
                              <div className="flex items-center text-sm">
                                <BookOpen className="h-4 w-4 text-primary mr-2" />
                                <span>{appointment.reason}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4 flex space-x-2">
                            {appointment.isVirtual ? (
                              <Button className="flex-1">
                                <Video className="h-4 w-4 mr-1" /> Join Virtual
                              </Button>
                            ) : (
                              <Button variant="outline" className="flex-1">
                                View Details
                              </Button>
                            )}
                            <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">
                              Reschedule
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="past" className="mt-0">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-pulse text-primary">Loading appointments...</div>
                </div>
              ) : sortedAppointments.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No Past Appointments</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      You don't have any past or completed appointments.
                    </p>
                    <Button onClick={() => setShowBookModal(true)}>
                      Book an Appointment
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {sortedAppointments.map(appointment => {
                    const partner = getPartnerDetails(appointment);
                    
                    return (
                      <Card key={appointment.id} className="opacity-90">
                        <CardContent className="p-4">
                          <div className="flex items-start md:items-center flex-col md:flex-row md:justify-between">
                            <div className="flex items-center mb-3 md:mb-0">
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarImage src={partner?.profileImage} />
                                <AvatarFallback>{partner?.name?.[0] || "U"}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-medium">
                                  {partner?.name || (user?.role === "doctor" ? "Patient" : "Doctor")}
                                </h3>
                                <div className="flex items-center text-xs text-gray-500">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>{formatAppointmentDate(appointment.date)} at {formatAppointmentTime(appointment.date)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2 w-full md:w-auto">
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(appointment.status)}`}>
                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              </span>
                              <Button size="sm" variant="outline" className="ml-auto md:ml-2">
                                Book Again
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="cancelled" className="mt-0">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-pulse text-primary">Loading appointments...</div>
                </div>
              ) : sortedAppointments.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                      <CalendarX className="h-8 w-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No Cancelled Appointments</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      You don't have any cancelled appointments.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {sortedAppointments.map(appointment => {
                    const partner = getPartnerDetails(appointment);
                    
                    return (
                      <Card key={appointment.id} className="opacity-80">
                        <CardContent className="p-4">
                          <div className="flex items-start md:items-center flex-col md:flex-row md:justify-between">
                            <div className="flex items-center mb-3 md:mb-0">
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarImage src={partner?.profileImage} />
                                <AvatarFallback>{partner?.name?.[0] || "U"}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-medium">
                                  {partner?.name || (user?.role === "doctor" ? "Patient" : "Doctor")}
                                </h3>
                                <div className="flex items-center text-xs text-gray-500">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>{formatAppointmentDate(appointment.date)} at {formatAppointmentTime(appointment.date)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2 w-full md:w-auto">
                              <Button size="sm" variant="outline" className="ml-auto md:ml-2">
                                Reschedule
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
      
      <BookAppointmentModal 
        isOpen={showBookModal} 
        onClose={() => setShowBookModal(false)}
      />
    </div>
  );
}
