import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Message, InsertMessage, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Send, Clock } from "lucide-react";

interface MessageCardProps {
  messages: Message[];
  receivers: User[];
  onViewAllMessages?: () => void;
}

interface MessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId: number | null;
  receivers: User[];
}

function MessageDialog({ isOpen, onClose, receiverId, receivers }: MessageDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  
  const receiver = receivers.find(r => r.id === receiverId);

  const messageMutation = useMutation({
    mutationFn: async (messageData: InsertMessage) => {
      const res = await apiRequest("POST", "/api/messages", messageData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({
        title: "Message sent",
        description: "Your message was sent successfully.",
      });
      setMessage("");
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = () => {
    if (!message.trim() || !receiverId || !user) return;
    
    const messageData: InsertMessage = {
      content: message,
      senderId: user.id,
      receiverId: receiverId,
    };
    
    messageMutation.mutate(messageData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Message to {receiver?.name}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            className="min-h-[120px]"
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSendMessage} 
            disabled={messageMutation.isPending || !message.trim()}
          >
            {messageMutation.isPending ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" /> 
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" /> 
                Send
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MessageCard({ messages, receivers, onViewAllMessages }: MessageCardProps) {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedReceiverId, setSelectedReceiverId] = useState<number | null>(null);
  
  // Filter messages related to the current user
  const userMessages = messages
    .filter(msg => msg.senderId === user?.id || msg.receiverId === user?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
  
  const openMessageDialog = (receiverId: number) => {
    setSelectedReceiverId(receiverId);
    setIsDialogOpen(true);
  };

  const closeMessageDialog = () => {
    setIsDialogOpen(false);
  };

  // Get user data for a message
  const getMessageParticipant = (message: Message) => {
    const participantId = message.senderId === user?.id ? message.receiverId : message.senderId;
    return receivers.find(r => r.id === participantId);
  };

  // Format message time
  const formatMessageTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl flex justify-between items-center">
            <span>Messages</span>
            {onViewAllMessages && (
              <Button 
                variant="link" 
                size="sm" 
                className="text-primary"
                onClick={onViewAllMessages}
              >
                View All
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {userMessages.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No messages yet</p>
          ) : (
            userMessages.map(message => {
              const participant = getMessageParticipant(message);
              const isOutgoing = message.senderId === user?.id;
              
              return (
                <div key={message.id} className="flex items-start space-x-4 pb-4 border-b last:border-0">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden">
                    {participant?.profileImage ? (
                      <img 
                        src={participant.profileImage} 
                        alt={participant?.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-semibold">
                        {participant?.name?.substring(0, 2) || ""}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">{participant?.name}</h4>
                      <span className="text-xs text-gray-400">
                        {formatMessageTime(message.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      {isOutgoing && <span className="text-blue-500 mr-1">You:</span>}
                      {message.content.length > 60 
                        ? `${message.content.substring(0, 60)}...` 
                        : message.content}
                    </p>
                    
                    <div className="mt-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-xs"
                        onClick={() => openMessageDialog(participant?.id || 0)}
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
        
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => onViewAllMessages?.()}
          >
            {userMessages.length === 0 ? "Start a Conversation" : "See All Messages"}
          </Button>
        </CardFooter>
      </Card>
      
      <MessageDialog 
        isOpen={isDialogOpen}
        onClose={closeMessageDialog}
        receiverId={selectedReceiverId}
        receivers={receivers}
      />
    </>
  );
}