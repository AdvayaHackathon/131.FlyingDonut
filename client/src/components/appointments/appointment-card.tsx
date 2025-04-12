import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Appointment, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  CalendarIcon,
  MapPinIcon,
  Video,
  Clock,
} from "lucide-react";

interface AppointmentCardProps {
  appointments: Appointment[];
  doctors?: User[];
  patients?: User[];
  userRole: "doctor" | "patient";
  onBookAppointment: () => void;
}

export default function AppointmentCard({ 
  appointments, 
  doctors = [], 
  patients = [], 
  userRole,
  onBookAppointment
}: AppointmentCardProps) {
  const { toast } = useToast();
  
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PUT", `/api/appointments/${id}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment updated",
        description: "The appointment status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update appointment: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleReschedule = (id: number) => {
    // In a real app, this would open a dialog to pick a new date
    toast({
      title: "Reschedule",
      description: "Rescheduling functionality would be implemented here",
    });
  };
  
  const handleCancel = (id: number) => {
    updateStatusMutation.mutate({ id, status: "cancelled" });
  };
  
  const formatAppointmentDate = (date: Date) => {
    const appointmentDate = new Date(date);
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (appointmentDate.toDateString() === now.toDateString()) {
      return `Today, ${format(appointmentDate, "h:mm a")}`;
    } else if (appointmentDate.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${format(appointmentDate, "h:mm a")}`;
    } else {
      return format(appointmentDate, "MMM d, h:mm a");
    }
  };
  
  const getPartnerInfo = (appointment: Appointment) => {
    if (userRole === "doctor") {
      const patient = patients.find(p => p.id === appointment.patientId);
      return patient;
    } else {
      const doctor = doctors.find(d => d.id === appointment.doctorId);
      return doctor;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="px-4 py-3 border-b border-gray-200">
        <CardTitle className="text-base font-semibold">Upcoming Appointments</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        {appointments.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">No upcoming appointments</p>
            <Button onClick={onBookAppointment}>Book an Appointment</Button>
          </div>
        ) : (
          <>
            {appointments.map((appointment, index) => {
              const partner = getPartnerInfo(appointment);
              return (
                <div key={appointment.id} className={`${index > 0 ? "border-t border-gray-200 pt-4 mt-4" : ""}`}>
                  <div className="flex items-center mb-2">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={partner?.profileImage} />
                      <AvatarFallback>{partner?.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{partner?.name}</h4>
                      <p className="text-xs text-gray-500">
                        {userRole === "patient" ? "Doctor" : "Patient"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center text-sm">
                      <CalendarIcon className="text-primary h-4 w-4 mr-2" />
                      <span>{formatAppointmentDate(appointment.date)}</span>
                    </div>
                    
                    <div className="flex items-center text-sm mt-1">
                      <MapPinIcon className="text-primary h-4 w-4 mr-2" />
                      <span>{appointment.location || "No location specified"}</span>
                    </div>
                    
                    {appointment.reason && (
                      <div className="flex items-center text-sm mt-1">
                        <Clock className="text-primary h-4 w-4 mr-2" />
                        <span>{appointment.reason}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 flex space-x-2">
                    {appointment.isVirtual ? (
                      <Button className="flex-1 text-sm" size="sm">
                        <Video className="h-4 w-4 mr-1" /> Join Virtual
                      </Button>
                    ) : (
                      <Button variant="outline" className="flex-1 text-sm" size="sm">
                        View Details
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      className="text-sm border-gray-400 text-gray-500 hover:text-red-500 hover:border-red-500" 
                      size="sm"
                      onClick={() => {
                        appointment.status === "scheduled" 
                          ? handleReschedule(appointment.id) 
                          : handleCancel(appointment.id);
                      }}
                    >
                      {appointment.status === "scheduled" ? "Reschedule" : "Cancel"}
                    </Button>
                  </div>
                </div>
              );
            })}
            
            <Button 
              className="mt-4 w-full" 
              variant="outline"
              onClick={onBookAppointment}
            >
              Book New Appointment
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
