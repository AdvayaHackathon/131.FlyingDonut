import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CalendarPlus,
  Heart,
  MessageCircle,
  UserPlus,
  Clock,
  Calendar,
  User,
  ThumbsUp,
  Send
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Post, Comment, InsertComment } from "@shared/schema";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface PostCardProps {
  post: Post;
  onBookAppointment?: (doctorId: number) => void;
}

export default function PostCard({ post, onBookAppointment }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.likes || 0);

  // Fetch comments when dialog is opened
  const { data: comments = [], isLoading: isLoadingComments } = useQuery({
    queryKey: [`/api/posts/${post.id}/comments`, isCommentsOpen],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: isCommentsOpen,
  });

  // Format the post date
  const formatPostDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Like post mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/posts/${post.id}/like`, { userId: user?.id });
      return await res.json();
    },
    onSuccess: () => {
      // Optimistically update UI
      if (!hasLiked) {
        setLocalLikes(prev => prev + 1);
        setHasLiked(true);
      }
    },
    onError: (error: Error) => {
      // Revert optimistic update
      if (hasLiked) {
        setLocalLikes(prev => prev - 1);
        setHasLiked(false);
      }
      
      toast({
        title: "Failed to like post",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Create comment mutation
  const commentMutation = useMutation({
    mutationFn: async (commentData: InsertComment) => {
      const res = await apiRequest("POST", "/api/comments", commentData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}/comments`] });
      setCommentText("");
      toast({
        title: "Comment added",
        description: "Your comment was added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add comment",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleLike = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to like posts.",
        variant: "destructive",
      });
      return;
    }
    
    likeMutation.mutate();
  };

  const handleComment = () => {
    if (!commentText.trim() || !user) return;
    
    const comment: InsertComment = {
      content: commentText,
      userId: user.id,
      postId: post.id,
    };
    
    commentMutation.mutate(comment);
  };

  // Determine post tag color based on post type
  const getPostTypeColor = () => {
    switch (post.postType) {
      case "resource":
        return "bg-blue-100 text-blue-800";
      case "question":
        return "bg-amber-100 text-amber-800";
      case "update":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format post type for display
  const getPostTypeDisplay = () => {
    switch (post.postType) {
      case "resource":
        return "Resource";
      case "question":
        return "Question";
      case "update":
        return "Update";
      default:
        return "Post";
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-start space-y-0 pb-2">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden">
            {post.author?.profileImage ? (
              <img 
                src={post.author.profileImage} 
                alt={post.author.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold">
                {post.author?.name ? post.author.name.substring(0, 2) : ""}
              </span>
            )}
          </div>
          
          <div>
            <h3 className="font-semibold">
              {post.isAnonymous ? "Anonymous" : post.author?.name}
              {post.author?.role === "doctor" && (
                <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100">Doctor</Badge>
              )}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{formatPostDate(post.createdAt as Date)}</span>
              <span>•</span>
              <Badge variant="outline" className={getPostTypeColor()}>
                {getPostTypeDisplay()}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-gray-800 mb-4">{post.content}</p>
        
        {post.relatedConditions && post.relatedConditions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.relatedConditions.map(condition => (
              <Badge key={condition} variant="secondary">
                {condition}
              </Badge>
            ))}
          </div>
        )}
        
        {post.image && (
          <div className="mt-4">
            <img 
              src={post.image} 
              alt="Post image" 
              className="rounded-md max-h-80 w-auto mx-auto"
            />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col pt-0">
        <div className="flex items-center justify-between w-full text-sm text-gray-500 pb-2">
          <div className="flex items-center space-x-1">
            <ThumbsUp className="h-4 w-4" />
            <span>{localLikes}</span>
          </div>
          <span>{post.commentCount || 0} comments</span>
        </div>
        
        <Separator className="my-2" />
        
        <div className="flex justify-between w-full">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex-1 ${hasLiked ? 'text-blue-600' : ''}`}
            onClick={handleLike}
          >
            <Heart className={`h-4 w-4 mr-2 ${hasLiked ? 'fill-current' : ''}`} />
            Like
          </Button>
          
          <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="flex-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                Comment
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Comments</DialogTitle>
              </DialogHeader>
              
              <div className="py-4 space-y-4">
                {isLoadingComments ? (
                  <div className="flex justify-center">
                    <Clock className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center">No comments yet. Be the first to comment!</p>
                ) : (
                  <div className="space-y-4">
                    {(comments as Comment[]).map(comment => (
                      <div key={comment.id} className="flex space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="bg-gray-100 rounded-lg p-3">
                            <div className="font-semibold text-sm">
                              {comment.author?.name || "User"}
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 flex space-x-2">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1"
                  />
                  <Button 
                    size="sm"
                    disabled={!commentText.trim() || commentMutation.isPending}
                    onClick={handleComment}
                  >
                    {commentMutation.isPending ? (
                      <Clock className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {post.author?.role === "doctor" && onBookAppointment && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1"
              onClick={() => onBookAppointment(post.author?.id as number)}
            >
              <CalendarPlus className="h-4 w-4 mr-2" />
              Book
            </Button>
          )}
          
          {post.author?.role === "doctor" && (
            <Button variant="ghost" size="sm" className="flex-1">
              <UserPlus className="h-4 w-4 mr-2" />
              Connect
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}