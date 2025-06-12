"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, LogOut, Menu, Shield, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { toast } from "@/hooks/use-toast"

interface DashboardHeaderProps {
  role: "submitter" | "reviewer"
  notificationCount?: number
  onNotificationsClick?: () => void
}

export default function DashboardHeader({ role, notificationCount = 0, onNotificationsClick }: DashboardHeaderProps) {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")

  useEffect(() => {
    // Get user email from localStorage in client component
    const email = localStorage.getItem("userEmail") || ""
    setUserEmail(email)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("isLoggedIn")

    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    })

    router.push("/")
  }

  const navItems =
    role === "submitter"
      ? [
          { name: "Dashboard", href: "/submitter/dashboard" },
          { name: "My Ads", href: "/submitter/ads" },
          { name: "Submit New Ad", href: "/submitter/submit" },
        ]
      : [
          { name: "Dashboard", href: "/reviewer/dashboard" },
          { name: "Pending Reviews", href: "/reviewer/pending" },
          { name: "Approved Ads", href: "/reviewer/approved" },
        ]

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href={role === "submitter" ? "/submitter/dashboard" : "/reviewer/dashboard"}
              className="flex items-center"
            >
              <Shield className="h-6 w-6 text-blue-600 mr-2" />
              <span className="font-bold text-xl hidden sm:inline">AdScreener</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex ml-8 space-x-6">
              {navItems.map((item) => (
                <Link key={item.name} href={item.href} className="text-gray-600 hover:text-blue-600 font-medium">
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative" onClick={onNotificationsClick}>
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white">
                  {notificationCount}
                </span>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{userEmail}</span>
                    <span className="text-xs text-gray-500 capitalize">{role}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${role}/profile`}>Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${role}/settings`}>Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${role}/guidelines`}>Guidelines</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between py-4 border-b">
                    <div className="flex items-center">
                      <Shield className="h-6 w-6 text-blue-600 mr-2" />
                      <span className="font-bold text-xl">AdScreener</span>
                    </div>
                  </div>

                  <nav className="flex flex-col space-y-4 mt-6">
                    {navItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="text-gray-600 hover:text-blue-600 font-medium py-2"
                      >
                        {item.name}
                      </Link>
                    ))}
                    <Link href={`/${role}/profile`} className="text-gray-600 hover:text-blue-600 font-medium py-2">
                      Profile
                    </Link>
                    <Link href={`/${role}/settings`} className="text-gray-600 hover:text-blue-600 font-medium py-2">
                      Settings
                    </Link>
                    <Link href={`/${role}/guidelines`} className="text-gray-600 hover:text-blue-600 font-medium py-2">
                      Guidelines
                    </Link>
                  </nav>

                  <div className="mt-auto border-t py-4">
                    <div className="flex flex-col space-y-2">
                      <div className="text-sm text-gray-500">Signed in as:</div>
                      <div className="font-medium">{userEmail}</div>
                      <div className="text-sm text-gray-500 capitalize">{role}</div>
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
    </header>
  )
}
