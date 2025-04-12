import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { SearchIcon, Send, PhoneCall, Video } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Message, User, InsertMessage } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

type MessageWithUser = Message & { sender?: User; receiver?: User };

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch messages
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<MessageWithUser[]>({
    queryKey: ["/api/messages"],
  });
  
  // Fetch users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    // In a real app, this should only fetch connected users
    select: (data) => data.filter(u => u.id !== user?.id),
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: InsertMessage) => {
      const res = await apiRequest("POST", "/api/messages", messageData);
      return await res.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest("PUT", `/api/messages/${messageId}/read`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
  });
  
  // Get all users who have sent or received messages with the current user
  const getConversationPartners = () => {
    const userIds = new Set<number>();
    
    messages.forEach(message => {
      if (message.senderId === user?.id) {
        userIds.add(message.receiverId);
      } else if (message.receiverId === user?.id) {
        userIds.add(message.senderId);
      }
    });
    
    return Array.from(userIds).map(id => {
      const partner = users.find(u => u.id === id);
      const unreadCount = messages.filter(m => m.senderId === id && m.receiverId === user?.id && !m.isRead).length;
      
      return {
        id,
        user: partner,
        unreadCount,
        lastMessage: messages
          .filter(m => (m.senderId === id && m.receiverId === user?.id) || 
                       (m.receiverId === id && m.senderId === user?.id))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      };
    }).filter(partner => {
      if (!searchQuery) return true;
      return partner.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             partner.user?.username?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  };
  
  // Get messages for the selected conversation
  const getConversationMessages = () => {
    if (!selectedConversation) return [];
    
    return messages
      .filter(m => (m.senderId === selectedConversation && m.receiverId === user?.id) || 
                   (m.receiverId === selectedConversation && m.senderId === user?.id))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };
  
  // Get the selected conversation partner
  const getSelectedPartner = () => {
    if (!selectedConversation) return null;
    return users.find(u => u.id === selectedConversation);
  };
  
  const conversationPartners = getConversationPartners();
  const conversationMessages = getConversationMessages();
  const selectedPartner = getSelectedPartner();
  
  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      senderId: user!.id,
      receiverId: selectedConversation,
      content: messageText,
    });
  };
  
  const handleSelectConversation = (partnerId: number) => {
    setSelectedConversation(partnerId);
    
    // Mark unread messages as read
    messages
      .filter(m => m.senderId === partnerId && m.receiverId === user?.id && !m.isRead)
      .forEach(m => {
        markAsReadMutation.mutate(m.id);
      });
  };
  
  const formatMessageDate = (date: Date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return format(messageDate, "h:mm a");
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return format(messageDate, "MMM d");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card className="h-[calc(100vh-200px)] min-h-[500px]">
            <div className="grid grid-cols-1 md:grid-cols-3 h-full">
              {/* Conversation List */}
              <div className="border-r border-gray-200">
                <CardHeader className="px-4 py-3">
                  <CardTitle className="text-lg font-semibold">Messages</CardTitle>
                  <div className="relative mt-2">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Search conversations" 
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </CardHeader>
                
                <div className="overflow-y-auto h-[calc(100%-80px)]">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-pulse text-primary">Loading conversations...</div>
                    </div>
                  ) : conversationPartners.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                      <p className="text-gray-500 mb-2">No conversations yet</p>
                      <p className="text-sm text-gray-400 mb-4">
                        Connect with doctors and patients to start messaging
                      </p>
                      <Button asChild size="sm">
                        <a href="/network">Find Connections</a>
                      </Button>
                    </div>
                  ) : (
                    conversationPartners.map(partner => (
                      <div 
                        key={partner.id}
                        className={`px-4 py-3 flex items-center border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                          selectedConversation === partner.id ? "bg-blue-50" : ""
                        }`}
                        onClick={() => handleSelectConversation(partner.id)}
                      >
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={partner.user?.profileImage} />
                          <AvatarFallback>{partner.user?.name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium truncate">{partner.user?.name}</h4>
                            <span className="text-xs text-gray-500">
                              {partner.lastMessage ? formatMessageDate(partner.lastMessage.createdAt) : ""}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <p className="text-sm text-gray-500 truncate flex-1">
                              {partner.lastMessage?.content || "No messages yet"}
                            </p>
                            {partner.unreadCount > 0 && (
                              <Badge className="ml-2 bg-primary">{partner.unreadCount}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Message Area */}
              <div className="col-span-2 flex flex-col h-full">
                {!selectedConversation ? (
                  <div className="flex-grow flex flex-col items-center justify-center px-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                      <Send className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-800 mb-2">Your Messages</h3>
                    <p className="text-gray-500 max-w-md">
                      Select a conversation or start a new one with your connections
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Conversation Header */}
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={selectedPartner?.profileImage} />
                          <AvatarFallback>{selectedPartner?.name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{selectedPartner?.name}</h3>
                          <p className="text-xs text-gray-500 capitalize">{selectedPartner?.role}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon">
                          <PhoneCall className="h-5 w-5 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Video className="h-5 w-5 text-gray-500" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Messages */}
                    <div className="flex-grow overflow-y-auto p-4 space-y-3">
                      {conversationMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <p className="text-gray-500 mb-2">No messages yet</p>
                          <p className="text-sm text-gray-400">
                            Start the conversation by sending a message
                          </p>
                        </div>
                      ) : (
                        conversationMessages.map(message => {
                          const isOwnMessage = message.senderId === user?.id;
                          
                          return (
                            <div 
                              key={message.id} 
                              className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                            >
                              <div 
                                className={`max-w-[70%] px-4 py-2 rounded-lg ${
                                  isOwnMessage 
                                    ? "bg-primary text-white rounded-br-none" 
                                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                                }`}
                              >
                                <p className="break-words">{message.content}</p>
                                <div 
                                  className={`text-xs mt-1 ${
                                    isOwnMessage ? "text-blue-100" : "text-gray-500"
                                  }`}
                                >
                                  {format(new Date(message.createdAt), "h:mm a")}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    
                    {/* Message Input */}
                    <div className="p-3 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Type a message..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button 
                          onClick={handleSendMessage}
                          disabled={!messageText.trim() || sendMessageMutation.isPending}
                        >
                          <Send className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
