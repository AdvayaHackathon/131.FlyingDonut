import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, ImagePlus, Send } from "lucide-react";
import { InsertPost } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function CreatePost() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<string>("update");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [relatedConditions, setRelatedConditions] = useState<string[]>([]);
  
  const availableConditions = [
    "Hypertension", "Diabetes", "Asthma", "Arthritis", "Anxiety", 
    "Depression", "Migraine", "COPD", "Heart Disease", "Chronic Back Pain",
    "Allergies", "Cancer", "Fibromyalgia", "Multiple Sclerosis"
  ];

  const postMutation = useMutation({
    mutationFn: async (post: InsertPost) => {
      const res = await apiRequest("POST", "/api/posts", post);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setContent("");
      setPostType("update");
      setIsAnonymous(false);
      setRelatedConditions([]);
      setIsDialogOpen(false);
      
      toast({
        title: "Post created",
        description: "Your post was published successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create post",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handlePostSubmit = () => {
    if (!content.trim() || !user) return;
    
    const post: InsertPost = {
      content,
      userId: user.id,
      postType: postType as "update" | "question" | "resource" | null,
      isAnonymous,
      relatedConditions: relatedConditions.length > 0 ? relatedConditions : null,
    };
    
    postMutation.mutate(post);
  };

  const handleConditionChange = (condition: string) => {
    setRelatedConditions(prev => 
      prev.includes(condition) 
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  // If no user is logged in, don't display the create post component
  if (!user) return null;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div 
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center space-x-4 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden">
            {user.profileImage ? (
              <img 
                src={user.profileImage} 
                alt={user.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold">
                {user.name?.substring(0, 2)}
              </span>
            )}
          </div>
          
          <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-gray-500">
            What's on your mind, {user.name?.split(' ')[0]}?
          </div>
        </div>
      </CardContent>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create a Post</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Textarea
                placeholder={`What's on your mind, ${user.name?.split(' ')[0]}?`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Post Type</Label>
              <Select value={postType} onValueChange={setPostType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select post type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                  {user.role === "doctor" && (
                    <SelectItem value="resource">Resource</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {user.role === "patient" && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="anonymous" 
                  checked={isAnonymous}
                  onCheckedChange={(checked) => setIsAnonymous(!!checked)}
                />
                <Label htmlFor="anonymous">Post anonymously</Label>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Related Health Conditions (Optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                {availableConditions.map(condition => (
                  <div key={condition} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`condition-${condition}`}
                      checked={relatedConditions.includes(condition)}
                      onCheckedChange={() => handleConditionChange(condition)}
                    />
                    <Label htmlFor={`condition-${condition}`}>{condition}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center"
                disabled
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                Add Image
              </Button>
              <span className="text-xs text-gray-500 ml-2">(Coming soon)</span>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handlePostSubmit}
              disabled={!content.trim() || postMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" /> 
              {postMutation.isPending ? "Posting..." : "Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}