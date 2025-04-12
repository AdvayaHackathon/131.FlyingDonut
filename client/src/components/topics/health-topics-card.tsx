import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { HealthTopic } from "@shared/schema";
import { ChevronRight } from "lucide-react";

export default function HealthTopicsCard() {
  const { data: topics = [] } = useQuery<HealthTopic[]>({
    queryKey: ["/api/health-topics"],
  });

  return (
    <Card>
      <CardHeader className="px-4 py-3 border-b border-gray-200">
        <CardTitle className="text-base font-semibold">Trending Health Topics</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        {topics.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">No trending topics available</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {topics.map((topic) => (
              <li key={topic.id}>
                <a href="#" className="flex items-center hover:text-primary">
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mr-2"></span>
                  <span>{topic.title}</span>
                  <span className="ml-auto text-xs text-gray-500">
                    {topic.count >= 1000 
                      ? `${(topic.count / 1000).toFixed(1)}k` 
                      : topic.count}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button variant="link" className="p-0 text-primary font-medium flex items-center">
            Explore All Topics <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
