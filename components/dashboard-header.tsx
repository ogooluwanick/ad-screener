"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react"; 
import { Bell, LogOut, Menu, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationPanel from "@/components/notification-panel";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useNotificationContext } from "@/contexts/NotificationContext"; // Import the context hook
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast"; 

interface DashboardHeaderProps {
  role: "submitter" | "reviewer" | "admin" | "superadmin";
}

export default function DashboardHeader({ role }: DashboardHeaderProps) {
  const router = useRouter();
  const [userEmailForDisplay, setUserEmailForDisplay] = useState("");
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  const { data: userProfile } = useUserProfile();
  // Get notification data from context
  const { unreadNotificationCount } = useNotificationContext(); 

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    setUserEmailForDisplay(email);
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("userRole"); 
    localStorage.removeItem("userEmail");
    
    await signOut({ redirect: false }); 

    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });

    router.push("/"); 
  };

  const getNavItems = () => {
    switch (role) {
      case "submitter":
        return [
          { name: "Dashboard", href: "/submitter/dashboard" },
          { name: "My Ads", href: "/submitter/ads" },
          { name: "Submit New Ad", href: "/submitter/submit" },
        ];
      case "reviewer":
        return [
          { name: "Dashboard", href: "/reviewer/dashboard" },
          { name: "Pending Reviews", href: "/reviewer/pending" },
          { name: "Rejected Ads", href: "/reviewer/rejected" },
          { name: "Approved Ads", href: "/reviewer/approved" },
        ];
      case "admin":
        return [
          { name: "Dashboard", href: "/admin/dashboard" },
          { name: "Users", href: "/admin/users" },
          { name: "Ads", href: "/admin/ads" },
        ];
      case "superadmin":
        return [
          { name: "Dashboard", href: "/admin/dashboard" },
          { name: "Users", href: "/admin/users" },
          { name: "Ads", href: "/admin/ads" },
        ];
      default:
        return [];
    }
  };

  const getDashboardLink = () => {
    switch (role) {
      case "submitter":
        return "/submitter/dashboard";
      case "reviewer":
        return "/reviewer/dashboard";
      case "admin":
      case "superadmin":
        return "/admin/dashboard";
      default:
        return "/";
    }
  };

  const navItems = getNavItems();
  const dashboardLink = getDashboardLink();

  return (
    <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href={dashboardLink}
              className="flex items-center"
            >
              <Shield className="h-6 w-6 text-green-600 mr-2" />
              <span className="font-bold text-xl hidden sm:inline text-gray-800 dark:text-gray-100">AdScreener</span>
            </Link>

            <nav className="hidden md:flex ml-8 space-x-6">
              {navItems.map((item) => (
                <Link key={item.name} href={item.href} className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium">
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full h-9 w-9"
              onClick={() => setIsNotificationPanelOpen(!isNotificationPanelOpen)}
            >
              <Bell className="h-5 w-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 bg-green-600 rounded-full flex items-center justify-center text-[10px] text-white">
                  {unreadNotificationCount}
                </span>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-50">{userEmailForDisplay || userProfile?.email || "User"}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{role}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                {(role === "submitter" || role === "reviewer") && (
                  <DropdownMenuItem asChild>
                    <Link href={`/${role}/guidelines`}>Guidelines</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden rounded-full h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[320px]">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between py-4 border-b dark:border-gray-800">
                    <div className="flex items-center">
                      <Shield className="h-6 w-6 text-green-600 mr-2" />
                      <span className="font-bold text-xl text-gray-800 dark:text-gray-100">AdScreener</span>
                    </div>
                  </div>

                  <nav className="flex flex-col space-y-2 mt-6">
                    {navItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium py-2 px-3 rounded-md"
                      >
                        {item.name}
                      </Link>
                    ))}
                    <Link href="/profile" className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium py-2 px-3 rounded-md">
                      Profile
                    </Link>
                    <Link href="/settings" className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium py-2 px-3 rounded-md">
                      Settings
                    </Link>
                    {(role === "submitter" || role === "reviewer") && (
                      <Link href={`/${role}/guidelines`} className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium py-2 px-3 rounded-md">
                        Guidelines
                      </Link>
                    )}
                  </nav>

                  <div className="mt-auto border-t dark:border-gray-800 py-4">
                    <div className="flex flex-col space-y-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400 px-3">Signed in as:</div>
                      <div className="font-medium text-sm text-gray-800 dark:text-gray-100 px-3">{userEmailForDisplay || userProfile?.email || "User"}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 capitalize px-3">{role}</div>
                      <Button variant="outline" className="mt-2 w-full justify-start" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Log out
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      <NotificationPanel
        isOpen={isNotificationPanelOpen}
        onClose={() => setIsNotificationPanelOpen(false)}
      />
    </header>
  );
}
