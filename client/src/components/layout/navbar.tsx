import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Bell, 
  MessageSquare, 
  Search, 
  Menu, 
  Heart 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMediaQuery } from "@/hooks/use-mobile";

export default function Navbar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out",
        });
      }
    });
  };

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/network", label: "My Network" },
    { path: "/messages", label: "Messages" },
    { path: "/appointments", label: "Appointments" },
  ];

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Heart className="h-6 w-6 text-primary mr-2" />
              <span className="text-xl font-semibold text-primary">MediConnect</span>
            </div>
            
            {/* Desktop Navigation */}
            {!isMobile && (
              <div className="ml-6 flex space-x-6">
                {navItems.map(item => (
                  <Link key={item.path} href={item.path}>
                    <a className={`border-b-2 px-1 pt-1 font-medium ${
                      isActive(item.path) 
                        ? "border-primary text-neutral-900" 
                        : "border-transparent hover:border-primary hover:text-primary text-neutral-600"
                    }`}>
                      {item.label}
                    </a>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {/* Search Bar */}
          {!isMobile && (
            <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
              <div className="w-full relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-10 w-full"
                  placeholder="Search doctors, specialties..."
                />
              </div>
            </div>
          )}
          
          {/* Right Navigation */}
          <div className="flex items-center">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5 text-gray-500" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Messages">
              <MessageSquare className="h-5 w-5 text-gray-500" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImage} alt={user?.name || ""} />
                    <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${user?.role === 'doctor' ? 'doctors' : 'patients'}/${user?.id}`}>
                    <a className="cursor-pointer w-full">Your Profile</a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <a className="cursor-pointer w-full">Settings</a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Mobile menu button */}
          {isMobile && (
            <div className="flex items-center md:hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
                <Menu className="h-6 w-6 text-gray-500" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobile && mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map(item => (
              <Link key={item.path} href={item.path}>
                <a 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.path) 
                      ? "text-primary bg-blue-50" 
                      : "text-gray-700 hover:text-primary hover:bg-blue-50"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              </Link>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Avatar>
                  <AvatarImage src={user?.profileImage} alt={user?.name || ""} />
                  <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user?.name}</div>
                <div className="text-sm font-medium text-gray-500">{user?.email}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link href={`/${user?.role === 'doctor' ? 'doctors' : 'patients'}/${user?.id}`}>
                <a 
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-blue-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Your Profile
                </a>
              </Link>
              <Link href="/settings">
                <a 
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-blue-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Settings
                </a>
              </Link>
              <button
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-blue-50"
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                disabled={logoutMutation.isPending}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
