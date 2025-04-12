import { useState } from "react";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Checkbox, 
  CheckboxIndicator 
} from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { User, PatientProfile, DoctorProfile } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import type { CheckedState } from "@radix-ui/react-checkbox";

interface ProfileCardProps {
  user?: User;
  profile?: PatientProfile | DoctorProfile;
}

export default function ProfileCard({ user, profile }: ProfileCardProps) {
  const { user: currentUser } = useAuth();
  const [anonymousPosts, setAnonymousPosts] = useState(false);
  const [hideProfile, setHideProfile] = useState(false);
  
  const handleAnonymousPostsChange = (checked: CheckedState) => {
    setAnonymousPosts(checked === true);
  };
  
  const handleHideProfileChange = (checked: CheckedState) => {
    setHideProfile(checked === true);
  };
  
  const isCurrentUser = currentUser?.id === user?.id;
  const isPatientProfile = user?.role === "patient";
  
  // Fetch profile data if not provided
  const { data: fetchedProfile } = useQuery({
    queryKey: ["/api/user/profile"],
    enabled: isCurrentUser && !profile,
  });
  
  const profileData = profile || fetchedProfile;
  
  // Create statistics based on user role
  let stats = [
    { label: "Connections", value: 28 },
    { label: "Appointments", value: 14 },
    { label: "Posts", value: 5 }
  ];
  
  // Render active conditions for patients
  const renderConditions = () => {
    if (!isPatientProfile || !profileData) return null;
    
    const patientProfile = profileData as PatientProfile;
    const conditions = patientProfile.conditions || [];
    
    if (conditions.length === 0) return null;
    
    return (
      <div className="mt-4 text-left">
        <h3 className="font-medium text-sm">Active Conditions</h3>
        <div className="mt-2 flex flex-wrap gap-1">
          {conditions.map((condition, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              {condition}
            </Badge>
          ))}
        </div>
      </div>
    );
  };
  
  // Render specialties for doctors
  const renderSpecialties = () => {
    if (isPatientProfile || !profileData) return null;
    
    const doctorProfile = profileData as DoctorProfile;
    
    return (
      <div className="mt-4 text-left">
        <h3 className="font-medium text-sm">Specialty</h3>
        <p className="text-sm text-gray-500">{doctorProfile.specialty}</p>
        
        {doctorProfile.hospital && (
          <>
            <h3 className="font-medium text-sm mt-2">Hospital</h3>
            <p className="text-sm text-gray-500">{doctorProfile.hospital}</p>
          </>
        )}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden sticky top-20">
      <div className="h-24 bg-primary relative">
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <Avatar className="h-20 w-20 border-4 border-white">
            <AvatarImage src={user?.profileImage || undefined} alt={user?.name || ""} />
            <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      
      <CardContent className="pt-12 pb-4 px-4 text-center">
        <h2 className="text-xl font-semibold">{user?.name || "User"}</h2>
        <p className="text-gray-500 text-sm capitalize">{user?.role || "User"}</p>
        
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <p className="font-semibold">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        
        {renderConditions()}
        {renderSpecialties()}
        
        {isCurrentUser && (
          <Button 
            className="mt-4 w-full" 
            variant="default"
          >
            Edit Profile
          </Button>
        )}
        
        {!isCurrentUser && (
          <div className="mt-4 flex space-x-2">
            <Button 
              className="flex-1" 
              variant="default"
            >
              Connect
            </Button>
            <Button 
              className="flex-1" 
              variant="outline"
            >
              Message
            </Button>
          </div>
        )}
      </CardContent>
      
      {isCurrentUser && isPatientProfile && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <h3 className="text-sm font-medium">Privacy Settings</h3>
          <div className="mt-2 space-y-2">
            <div className="flex items-center">
              <Checkbox 
                id="privacy-posts" 
                checked={anonymousPosts} 
                onCheckedChange={handleAnonymousPostsChange}
              />
              <Label 
                htmlFor="privacy-posts" 
                className="ml-2 text-sm text-gray-500"
              >
                Make posts anonymous
              </Label>
            </div>
            <div className="flex items-center">
              <Checkbox 
                id="privacy-profile" 
                checked={hideProfile} 
                onCheckedChange={handleHideProfileChange}
              />
              <Label 
                htmlFor="privacy-profile" 
                className="ml-2 text-sm text-gray-500"
              >
                Hide profile from search
              </Label>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
