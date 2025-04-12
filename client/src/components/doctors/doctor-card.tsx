import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DoctorWithProfile, InsertConnection } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Star, StarHalf } from "lucide-react";

interface DoctorCardProps {
  doctors: DoctorWithProfile[];
  onBookAppointment: (doctorId: number) => void;
}

export default function DoctorCard({ doctors, onBookAppointment }: DoctorCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const connectMutation = useMutation({
    mutationFn: async (followingId: number) => {
      const connection: InsertConnection = {
        followerId: user!.id,
        followingId
      };
      const res = await apiRequest("POST", "/api/connections", connection);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection request sent",
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
    }
  });
  
  const handleConnect = (doctorId: number) => {
    connectMutation.mutate(doctorId);
  };
  
  // Display star rating
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={i} className="h-4 w-4 text-amber-500 fill-amber-500" />
        ))}
        {hasHalfStar && <StarHalf className="h-4 w-4 text-amber-500 fill-amber-500" />}
        {Array.from({ length: 5 - fullStars - (hasHalfStar ? 1 : 0) }).map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-amber-500" />
        ))}
      </div>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader className="px-4 py-3 border-b border-gray-200">
        <CardTitle className="text-base font-semibold">Recommended Doctors</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        {doctors.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">No doctors found</p>
          </div>
        ) : (
          <>
            {doctors.map((doctor, index) => (
              <div 
                key={doctor.id} 
                className={`${index > 0 ? "mb-4 pb-4 border-b border-gray-200 last:border-b-0 last:pb-0 last:mb-0" : ""}`}
              >
                <div className="flex items-center">
                  <Avatar className="h-12 w-12 mr-3">
                    <AvatarImage src={doctor.profileImage} />
                    <AvatarFallback>{doctor.name?.[0] || "D"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center">
                      <Link href={`/doctors/${doctor.id}`}>
                        <a className="font-medium hover:text-primary">
                          {doctor.name}
                        </a>
                      </Link>
                      {doctor.profile.verified && (
                        <Badge className="ml-2 bg-green-500">Verified</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{doctor.profile.specialty}</p>
                    <div className="flex items-center text-xs mt-1">
                      {renderStars(doctor.profile.rating || 4.5)}
                      <span className="ml-1 text-gray-500">
                        ({doctor.profile.reviewCount || 0} reviews)
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 flex justify-between">
                  <Button
                    className="flex-1 mr-2"
                    size="sm"
                    onClick={() => handleConnect(doctor.id)}
                    disabled={connectMutation.isPending}
                  >
                    Connect
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    size="sm"
                    onClick={() => onBookAppointment(doctor.id)}
                  >
                    Book Appointment
                  </Button>
                </div>
              </div>
            ))}
            
            {doctors.length > 0 && (
              <Button 
                className="mt-2 w-full" 
                variant="link"
              >
                View All Recommendations
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
