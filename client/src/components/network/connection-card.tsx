import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, Mail, CalendarPlus, Check, Clock, X } from "lucide-react";
import { User, Connection, InsertConnection } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ConnectionCardProps {
  doctors: User[];
  connections: Connection[];
  onBookAppointment: (doctorId: number) => void;
  onSendMessage: (userId: number) => void;
}

export default function ConnectionCard({ 
  doctors, 
  connections, 
  onBookAppointment,
  onSendMessage
}: ConnectionCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState<Record<number, boolean>>({});

  // Get all connections for the current user
  const connectionMap = new Map<number, Connection>();
  connections.forEach(conn => {
    if (conn.followerId === user?.id) {
      connectionMap.set(conn.followingId, conn);
    }
  });

  // Function to determine connection status
  const getConnectionStatus = (doctorId: number) => {
    const connection = connectionMap.get(doctorId);
    if (!connection) return "not_connected";
    return connection.status;
  };

  // Function to get connection id
  const getConnectionId = (doctorId: number) => {
    const connection = connectionMap.get(doctorId);
    return connection?.id;
  };

  // Mutation for creating a connection request
  const connectionMutation = useMutation({
    mutationFn: async (connection: InsertConnection) => {
      setIsLoading(prev => ({ ...prev, [connection.followingId]: true }));
      const res = await apiRequest("POST", "/api/connections", connection);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      toast({
        title: "Connection request sent",
        description: "Your connection request was sent successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send connection request",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: (_, __, variables) => {
      setIsLoading(prev => ({ ...prev, [variables.followingId]: false }));
    }
  });

  // Mutation for updating a connection status
  const updateConnectionMutation = useMutation({
    mutationFn: async ({ connectionId, status }: { connectionId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/connections/${connectionId}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      toast({
        title: "Connection updated",
        description: "The connection status was updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update connection",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle connection request
  const handleConnect = (doctorId: number) => {
    const connection: InsertConnection = {
      followerId: user?.id as number,
      followingId: doctorId,
    };
    
    connectionMutation.mutate(connection);
  };

  // Handle accepting or rejecting a connection
  const handleUpdateConnection = (connectionId: number, status: string) => {
    updateConnectionMutation.mutate({ connectionId, status });
  };

  // Render connection button based on status
  const renderConnectionButton = (doctor: User) => {
    const status = getConnectionStatus(doctor.id);
    const connectionId = getConnectionId(doctor.id);
    const loading = isLoading[doctor.id] || false;

    if (loading) {
      return (
        <Button variant="outline" size="sm" disabled>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Loading
        </Button>
      );
    }

    switch (status) {
      case "pending":
        return (
          <Button variant="outline" size="sm" disabled>
            <Clock className="h-4 w-4 mr-2" />
            Pending
          </Button>
        );
      case "accepted":
        return (
          <Button variant="ghost" size="sm" className="text-green-500" disabled>
            <Check className="h-4 w-4 mr-2" />
            Connected
          </Button>
        );
      case "rejected":
        return (
          <Button variant="outline" size="sm" onClick={() => handleConnect(doctor.id)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Connect Again
          </Button>
        );
      default:
        return (
          <Button variant="outline" size="sm" onClick={() => handleConnect(doctor.id)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Connect
          </Button>
        );
    }
  };

  // Filter doctors based on whether they have a profile
  const displayedDoctors = doctors.filter(doctor => 
    doctor.role === "doctor" && doctor.id !== user?.id
  ).slice(0, 5);  

  if (displayedDoctors.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Network</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No doctors found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl flex justify-between items-center">
          <span>Network</span>
          <Button variant="link" size="sm" className="text-primary">View All</Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayedDoctors.map(doctor => (
          <div key={doctor.id} className="flex items-start space-x-4 pb-4 border-b last:border-0">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden">
              {doctor.profileImage ? (
                <img 
                  src={doctor.profileImage} 
                  alt={doctor.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-semibold">
                  {doctor.name.substring(0, 2)}
                </span>
              )}
            </div>
            
            <div className="flex-1">
              <h4 className="font-semibold">{doctor.name}</h4>
              <p className="text-sm text-gray-500">
                {doctor.bio?.substring(0, 60)}
                {doctor.bio && doctor.bio.length > 60 ? "..." : ""}
              </p>
              
              <div className="mt-2 flex flex-wrap gap-2">
                {renderConnectionButton(doctor)}
                
                {getConnectionStatus(doctor.id) === "accepted" && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onSendMessage(doctor.id)}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onBookAppointment(doctor.id)}
                    >
                      <CalendarPlus className="h-4 w-4 mr-2" />
                      Book
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">See More Doctors</Button>
      </CardFooter>
    </Card>
  );
}