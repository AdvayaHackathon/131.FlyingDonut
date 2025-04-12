import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, User, Heart, Stethoscope } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface PostFilterProps {
  onFilterChange: (filter: string) => void;
}

export default function PostFilter({ onFilterChange }: PostFilterProps) {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("all");

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    onFilterChange(filter);
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <Tabs 
          value={activeFilter} 
          onValueChange={handleFilterChange}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all" className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">All Posts</span>
              <span className="sm:hidden">All</span>
            </TabsTrigger>
            
            <TabsTrigger value="doctors" className="flex items-center">
              <Stethoscope className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Doctors</span>
              <span className="sm:hidden">Docs</span>
            </TabsTrigger>
            
            <TabsTrigger value="patients" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Patients</span>
              <span className="sm:hidden">Pats</span>
            </TabsTrigger>
            
            <TabsTrigger value="conditions" className="flex items-center">
              <Heart className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">For You</span>
              <span className="sm:hidden">You</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardContent>
    </Card>
  );
}