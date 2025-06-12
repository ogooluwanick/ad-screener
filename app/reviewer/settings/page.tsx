"use client"

import { useState, useEffect } from "react"
import { Bell, Lock, Download, Eye, EyeOff, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { toast } from "@/hooks/use-toast"

export default function ReviewerSettings() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true) // To show loading state

  // Default states, will be overwritten by fetched data
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    newSubmissions: true,
    urgentReviews: true,
    systemUpdates: true,
    weeklyReports: true,
    teamUpdates: false,
  })

  const [reviewPreferences, setReviewPreferences] = useState({
    autoAssignment: true,
    maxDailyReviews: [25],
    preferredCategories: ["all"],
    reviewReminders: true,
    bulkActions: true,
    advancedFilters: true,
  })

  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: true,
    sessionTimeout: "4",
  })

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/reviewer/settings");
        if (!response.ok) {
          throw new Error("Failed to fetch settings");
        }
        const data = await response.json();
        if (data.notifications) {
          setNotifications(data.notifications);
        }
        if (data.reviewPreferences) {
          setReviewPreferences(data.reviewPreferences);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast({
          title: "Error",
          description: "Could not load your settings. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }))
  }

  const handleReviewPreferenceChange = (key: string, value: any) => {
    setReviewPreferences((prev) => ({ ...prev, [key]: value }))
  }

  const handleSecurityChange = (key: string, value: string | boolean) => {
    setSecurity((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/reviewer/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notifications, reviewPreferences }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save settings");
      }

      toast({
        title: "Settings Saved",
        description: "Your settings have been successfully updated.",
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: error.message || "Could not save your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = () => {
    if (security.newPassword !== security.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      })
      return
    }

    if (security.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      })
      return
    }

    // Mock password change
    toast({
      title: "Password Changed",
      description: "Your password has been successfully updated.",
    })

    setSecurity((prev) => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }))
  }

  const handleExportData = () => {
    toast({
      title: "Data Export Started",
      description: "Your review data export will be emailed to you within 24 hours.",
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading settings...</p> {/* Replace with a proper spinner/skeleton loader if available */}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-600">Manage your reviewer account settings and preferences</p>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose how you want to be notified about review activities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <Switch
                id="emailNotifications"
                checked={notifications.emailNotifications}
                onCheckedChange={(checked) => handleNotificationChange("emailNotifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="pushNotifications">Push Notifications</Label>
                <p className="text-sm text-gray-500">Receive browser push notifications</p>
              </div>
              <Switch
                id="pushNotifications"
                checked={notifications.pushNotifications}
                onCheckedChange={(checked) => handleNotificationChange("pushNotifications", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="newSubmissions">New Submissions</Label>
                <p className="text-sm text-gray-500">When new ads are submitted for review</p>
              </div>
              <Switch
                id="newSubmissions"
                checked={notifications.newSubmissions}
                onCheckedChange={(checked) => handleNotificationChange("newSubmissions", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="urgentReviews">Urgent Reviews</Label>
                <p className="text-sm text-gray-500">High-priority reviews requiring immediate attention</p>
              </div>
              <Switch
                id="urgentReviews"
                checked={notifications.urgentReviews}
                onCheckedChange={(checked) => handleNotificationChange("urgentReviews", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="systemUpdates">System Updates</Label>
                <p className="text-sm text-gray-500">Platform updates and maintenance notifications</p>
              </div>
              <Switch
                id="systemUpdates"
                checked={notifications.systemUpdates}
                onCheckedChange={(checked) => handleNotificationChange("systemUpdates", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weeklyReports">Weekly Reports</Label>
                <p className="text-sm text-gray-500">Weekly summary of your review activity</p>
              </div>
              <Switch
                id="weeklyReports"
                checked={notifications.weeklyReports}
                onCheckedChange={(checked) => handleNotificationChange("weeklyReports", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="teamUpdates">Team Updates</Label>
                <p className="text-sm text-gray-500">Updates from your review team</p>
              </div>
              <Switch
                id="teamUpdates"
                checked={notifications.teamUpdates}
                onCheckedChange={(checked) => handleNotificationChange("teamUpdates", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Review Preferences
          </CardTitle>
          <CardDescription>Customize your review workflow and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoAssignment">Auto-Assignment</Label>
                <p className="text-sm text-gray-500">Automatically assign new reviews to you</p>
              </div>
              <Switch
                id="autoAssignment"
                checked={reviewPreferences.autoAssignment}
                onCheckedChange={(checked) => handleReviewPreferenceChange("autoAssignment", checked)}
              />
            </div>

            <div className="space-y-2">
              <Label>Maximum Daily Reviews: {reviewPreferences.maxDailyReviews[0]}</Label>
              <Slider
                value={reviewPreferences.maxDailyReviews}
                onValueChange={(value) => handleReviewPreferenceChange("maxDailyReviews", value)}
                max={50}
                min={5}
                step={5}
                className="w-full"
              />
              <p className="text-sm text-gray-500">Set your daily review capacity</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredCategories">Preferred Categories</Label>
              <Select
                value={reviewPreferences.preferredCategories[0]}
                onValueChange={(value) => handleReviewPreferenceChange("preferredCategories", [value])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="retail">Retail & E-commerce</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reviewReminders">Review Reminders</Label>
                <p className="text-sm text-gray-500">Remind me of pending reviews</p>
              </div>
              <Switch
                id="reviewReminders"
                checked={reviewPreferences.reviewReminders}
                onCheckedChange={(checked) => handleReviewPreferenceChange("reviewReminders", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="bulkActions">Bulk Actions</Label>
                <p className="text-sm text-gray-500">Enable bulk review actions</p>
              </div>
              <Switch
                id="bulkActions"
                checked={reviewPreferences.bulkActions}
                onCheckedChange={(checked) => handleReviewPreferenceChange("bulkActions", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="advancedFilters">Advanced Filters</Label>
                <p className="text-sm text-gray-500">Show advanced filtering options</p>
              </div>
              <Switch
                id="advancedFilters"
                checked={reviewPreferences.advancedFilters}
                onCheckedChange={(checked) => handleReviewPreferenceChange("advancedFilters", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            Security Settings
          </CardTitle>
          <CardDescription>Manage your account security and password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={security.currentPassword}
                  onChange={(e) => handleSecurityChange("currentPassword", e.target.value)}
                  placeholder="Enter current password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={security.newPassword}
                  onChange={(e) => handleSecurityChange("newPassword", e.target.value)}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={security.confirmPassword}
                  onChange={(e) => handleSecurityChange("confirmPassword", e.target.value)}
                  placeholder="Confirm new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button onClick={handleChangePassword} variant="outline">
              Change Password
            </Button>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
              </div>
              <Switch
                id="twoFactor"
                checked={security.twoFactorEnabled}
                onCheckedChange={(checked) => handleSecurityChange("twoFactorEnabled", checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout</Label>
              <Select
                value={security.sessionTimeout}
                onValueChange={(value) => handleSecurityChange("sessionTimeout", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                  <SelectItem value="8">8 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Data Management
          </CardTitle>
          <CardDescription>Export your review data and activity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Export Review Data</Label>
                <p className="text-sm text-gray-500">Download a copy of all your review activity</p>
              </div>
              <Button variant="outline" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
          {isSaving ? "Saving..." : "Save All Settings"}
        </Button>
      </div>
    </div>
  )
}
