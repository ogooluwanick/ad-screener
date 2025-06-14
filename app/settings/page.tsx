"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Bell, Lock, Download, Eye, EyeOff, Filter, Shield, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"

export default function UnifiedSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const userRole = session?.user?.role

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Unified Notifications State
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    // Reviewer specific
    newSubmissions: true,
    urgentReviews: true,
    systemUpdates: true, // Common, but also in reviewer
    weeklyReports: true, // Reviewer: weekly summary of review activity
    teamUpdates: false,
    // Submitter specific
    adApproved: true,
    adRejected: true,
    paymentConfirmation: true,
    weeklyDigest: false, // Submitter: weekly summary of your activity
    marketingEmails: false,
    submissionStatus: true, // from submitter API
    feedbackReceived: true, // from submitter API
    promotionalEmails: false, // from submitter API
  })

  // Reviewer Specific State
  const [reviewPreferences, setReviewPreferences] = useState({
    autoAssignment: true,
    maxDailyReviews: [25],
    preferredCategories: ["all"],
    reviewReminders: true,
    bulkActions: true,
    advancedFilters: true,
  })

  // Submitter Specific State
  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
    showEmail: false,
    showPhone: false,
    dataCollection: true,
  })
  const [submitterPreferences, setSubmitterPreferences] = useState({
    defaultCampaignDuration: 30,
    autoSaveDrafts: true,
    preferredAdFormats: ["banner", "video"],
  });


  // Common Security State
  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false, // Default, can be fetched if API supports
    sessionTimeout: "4", // Reviewer had this, can be common or conditional
  })

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !userRole) {
      router.push("/login"); // Redirect if not authenticated or role not found
      return;
    }

    const fetchSettings = async () => {
      setIsLoading(true)
      const apiUrl = userRole === "reviewer" ? "/api/reviewer/settings" : "/api/submitter/settings"
      try {
        const response = await fetch(apiUrl)
        if (!response.ok) {
          throw new Error("Failed to fetch settings")
        }
        const data = await response.json()

        if (data.notifications) {
          setNotifications(prev => ({ ...prev, ...data.notifications }))
        }
        if (userRole === "reviewer" && data.reviewPreferences) {
          setReviewPreferences(data.reviewPreferences)
        }
        if (userRole === "submitter") {
          if (data.privacy) {
            setPrivacy(data.privacy)
          }
          if (data.preferences) {
            setSubmitterPreferences(data.preferences);
          }
        }
        // Potentially fetch common security settings if an endpoint exists
        // For now, sessionTimeout is reviewer-specific in UI but could be common
        if (userRole === "reviewer" && data.security?.sessionTimeout) {
            setSecurity(prev => ({...prev, sessionTimeout: data.security.sessionTimeout}));
        }


      } catch (error) {
        console.error("Error fetching settings:", error)
        toast({
          title: "Error",
          description: "Could not load your settings. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [session, status, userRole, router])

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }))
  }

  const handleReviewPreferenceChange = (key: string, value: any) => {
    setReviewPreferences((prev) => ({ ...prev, [key]: value }))
  }

  const handlePrivacyChange = (key: string, value: string | boolean) => {
    setPrivacy((prev) => ({ ...prev, [key]: value }))
  }
  
  // const handleSubmitterPreferenceChange = (key: string, value: any) => {
  //   setSubmitterPreferences((prev) => ({ ...prev, [key]: value }));
  // };

  const handleSecurityChange = (key: string, value: string | boolean) => {
    setSecurity((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveSettings = async () => {
    if (!userRole) return;
    setIsSaving(true)
    const apiUrl = userRole === "reviewer" ? "/api/reviewer/settings" : "/api/submitter/settings"
    let payload: any = { notifications }

    if (userRole === "reviewer") {
      payload.reviewPreferences = reviewPreferences
      // Include sessionTimeout if it's managed for reviewers
      // payload.security = { sessionTimeout: security.sessionTimeout }; 
    } else if (userRole === "submitter") {
      payload.privacy = privacy
      payload.preferences = submitterPreferences;
    }

    try {
      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to save settings")
      }

      toast({
        title: "Settings Saved",
        description: "Your settings have been successfully updated.",
      })
    } catch (error: any) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: error.message || "Could not save your settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (security.newPassword !== security.confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" })
      return
    }
    if (security.newPassword.length < 8) {
      toast({ title: "Error", description: "New password must be at least 8 characters long.", variant: "destructive" })
      return
    }
    if (!security.currentPassword) {
      toast({ title: "Error", description: "Current password is required.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: security.currentPassword,
          newPassword: security.newPassword,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Failed to change password")
      toast({ title: "Password Changed", description: "Your password has been successfully updated." })
      setSecurity((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }))
    } catch (error: any) {
      console.error("Error changing password:", error)
      toast({ title: "Error", description: error.message || "Could not change your password.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportData = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/user/export-data")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to export data")
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const contentDisposition = response.headers.get('content-disposition');
      let fileName = `user_data_${userRole}.json`;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
      }
      a.download = fileName;
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast({ title: "Data Exported", description: "Your data has been downloaded." })
    } catch (error: any) {
      console.error("Error exporting data:", error)
      toast({ title: "Export Error", description: error.message || "Could not export your data.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (userRole !== "submitter") return;
    const confirmDelete = window.confirm("Are you sure you want to delete your account? This action cannot be undone.")
    if (!confirmDelete) return

    setIsSaving(true)
    try {
      const response = await fetch("/api/submitter/delete-account", { method: "POST" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Failed to delete account")
      toast({ title: "Account Deleted", description: "Your account has been successfully deleted. You will be logged out." })
      await signOut({ redirect: false })
      router.push("/")
    } catch (error: any) {
      console.error("Error deleting account:", error)
      toast({ title: "Deletion Error", description: error.message || "Could not delete your account.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || status === "loading") {
    return <div className="flex justify-center items-center h-64"><p>Loading settings...</p></div>
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return <div className="flex justify-center items-center h-64"><p>Redirecting to login...</p></div>;
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-600">Manage your {userRole} account settings and preferences</p>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Bell className="h-5 w-5 mr-2" />Notification Preferences</CardTitle>
          <CardDescription>Choose how you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><Label htmlFor="emailNotifications">Email Notifications</Label><p className="text-sm text-gray-500">Receive notifications via email</p></div>
              <Switch id="emailNotifications" checked={notifications.emailNotifications} onCheckedChange={(c) => handleNotificationChange("emailNotifications", c)} />
            </div>
            <div className="flex items-center justify-between">
              <div><Label htmlFor="pushNotifications">Push Notifications</Label><p className="text-sm text-gray-500">Receive browser push notifications</p></div>
              <Switch id="pushNotifications" checked={notifications.pushNotifications} onCheckedChange={(c) => handleNotificationChange("pushNotifications", c)} />
            </div>
            <Separator />
            {userRole === "reviewer" && (
              <>
                <div className="flex items-center justify-between">
                  <div><Label htmlFor="newSubmissions">New Submissions</Label><p className="text-sm text-gray-500">When new ads are submitted for review</p></div>
                  <Switch id="newSubmissions" checked={notifications.newSubmissions} onCheckedChange={(c) => handleNotificationChange("newSubmissions", c)} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label htmlFor="urgentReviews">Urgent Reviews</Label><p className="text-sm text-gray-500">High-priority reviews requiring immediate attention</p></div>
                  <Switch id="urgentReviews" checked={notifications.urgentReviews} onCheckedChange={(c) => handleNotificationChange("urgentReviews", c)} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label htmlFor="weeklyReports">Weekly Reports</Label><p className="text-sm text-gray-500">Weekly summary of your review activity</p></div>
                  <Switch id="weeklyReports" checked={notifications.weeklyReports} onCheckedChange={(c) => handleNotificationChange("weeklyReports", c)} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label htmlFor="teamUpdates">Team Updates</Label><p className="text-sm text-gray-500">Updates from your review team</p></div>
                  <Switch id="teamUpdates" checked={notifications.teamUpdates} onCheckedChange={(c) => handleNotificationChange("teamUpdates", c)} />
                </div>
              </>
            )}
            {userRole === "submitter" && (
              <>
                <div className="flex items-center justify-between">
                  <div><Label htmlFor="adApproved">Ad Approved</Label><p className="text-sm text-gray-500">When your ad gets approved</p></div>
                  <Switch id="adApproved" checked={notifications.adApproved} onCheckedChange={(c) => handleNotificationChange("adApproved", c)} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label htmlFor="adRejected">Ad Rejected</Label><p className="text-sm text-gray-500">When your ad gets rejected</p></div>
                  <Switch id="adRejected" checked={notifications.adRejected} onCheckedChange={(c) => handleNotificationChange("adRejected", c)} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label htmlFor="paymentConfirmation">Payment Confirmation</Label><p className="text-sm text-gray-500">Payment and billing notifications</p></div>
                  <Switch id="paymentConfirmation" checked={notifications.paymentConfirmation} onCheckedChange={(c) => handleNotificationChange("paymentConfirmation", c)} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label htmlFor="weeklyDigest">Weekly Digest</Label><p className="text-sm text-gray-500">Weekly summary of your activity</p></div>
                  <Switch id="weeklyDigest" checked={notifications.weeklyDigest} onCheckedChange={(c) => handleNotificationChange("weeklyDigest", c)} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label htmlFor="marketingEmails">Marketing Emails</Label><p className="text-sm text-gray-500">Product updates and promotional content</p></div>
                  <Switch id="marketingEmails" checked={notifications.marketingEmails} onCheckedChange={(c) => handleNotificationChange("marketingEmails", c)} />
                </div>
              </>
            )}
             <div className="flex items-center justify-between"> {/* Common system updates */}
              <div><Label htmlFor="systemUpdates">System Updates</Label><p className="text-sm text-gray-500">Platform updates and maintenance notifications</p></div>
              <Switch id="systemUpdates" checked={notifications.systemUpdates} onCheckedChange={(c) => handleNotificationChange("systemUpdates", c)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviewer: Review Preferences */}
      {userRole === "reviewer" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Filter className="h-5 w-5 mr-2" />Review Preferences</CardTitle>
            <CardDescription>Customize your review workflow and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div><Label htmlFor="autoAssignment">Auto-Assignment</Label><p className="text-sm text-gray-500">Automatically assign new reviews to you</p></div>
                <Switch id="autoAssignment" checked={reviewPreferences.autoAssignment} onCheckedChange={(c) => handleReviewPreferenceChange("autoAssignment", c)} />
              </div>
              <div className="space-y-2">
                <Label>Maximum Daily Reviews: {reviewPreferences.maxDailyReviews[0]}</Label>
                <Slider value={reviewPreferences.maxDailyReviews} onValueChange={(v) => handleReviewPreferenceChange("maxDailyReviews", v)} max={50} min={5} step={5} className="w-full" />
                <p className="text-sm text-gray-500">Set your daily review capacity</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredCategories">Preferred Categories</Label>
                <Select value={reviewPreferences.preferredCategories[0]} onValueChange={(v) => handleReviewPreferenceChange("preferredCategories", [v])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <div><Label htmlFor="reviewReminders">Review Reminders</Label><p className="text-sm text-gray-500">Remind me of pending reviews</p></div>
                <Switch id="reviewReminders" checked={reviewPreferences.reviewReminders} onCheckedChange={(c) => handleReviewPreferenceChange("reviewReminders", c)} />
              </div>
              <div className="flex items-center justify-between">
                <div><Label htmlFor="bulkActions">Bulk Actions</Label><p className="text-sm text-gray-500">Enable bulk review actions</p></div>
                <Switch id="bulkActions" checked={reviewPreferences.bulkActions} onCheckedChange={(c) => handleReviewPreferenceChange("bulkActions", c)} />
              </div>
              <div className="flex items-center justify-between">
                <div><Label htmlFor="advancedFilters">Advanced Filters</Label><p className="text-sm text-gray-500">Show advanced filtering options</p></div>
                <Switch id="advancedFilters" checked={reviewPreferences.advancedFilters} onCheckedChange={(c) => handleReviewPreferenceChange("advancedFilters", c)} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submitter: Privacy Settings */}
      {userRole === "submitter" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Shield className="h-5 w-5 mr-2" />Privacy Settings</CardTitle>
            <CardDescription>Control your privacy and data sharing preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profileVisibility">Profile Visibility</Label>
                <Select value={privacy.profileVisibility} onValueChange={(v) => handlePrivacyChange("profileVisibility", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private (Not visible to anyone)</SelectItem>
                    <SelectItem value="reviewers-only">Reviewers Only (Visible only to reviewers)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div><Label htmlFor="showEmail">Show Email in Profile</Label><p className="text-sm text-gray-500">Display your email address on your public profile</p></div>
                <Switch id="showEmail" checked={privacy.showEmail} onCheckedChange={(c) => handlePrivacyChange("showEmail", c)} />
              </div>
              <div className="flex items-center justify-between">
                <div><Label htmlFor="showPhone">Show Phone in Profile</Label><p className="text-sm text-gray-500">Display your phone number on your public profile</p></div>
                <Switch id="showPhone" checked={privacy.showPhone} onCheckedChange={(c) => handlePrivacyChange("showPhone", c)} />
              </div>
              <div className="flex items-center justify-between">
                <div><Label htmlFor="dataCollection">Analytics Data Collection</Label><p className="text-sm text-gray-500">Help us improve by sharing anonymous usage data</p></div>
                <Switch id="dataCollection" checked={privacy.dataCollection} onCheckedChange={(c) => handlePrivacyChange("dataCollection", c)} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Lock className="h-5 w-5 mr-2" />Security Settings</CardTitle>
          <CardDescription>Manage your account security and password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input id="currentPassword" type={showCurrentPassword ? "text" : "password"} value={security.currentPassword} onChange={(e) => handleSecurityChange("currentPassword", e.target.value)} placeholder="Enter current password" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>{showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input id="newPassword" type={showNewPassword ? "text" : "password"} value={security.newPassword} onChange={(e) => handleSecurityChange("newPassword", e.target.value)} placeholder="Enter new password" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowNewPassword(!showNewPassword)}>{showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={security.confirmPassword} onChange={(e) => handleSecurityChange("confirmPassword", e.target.value)} placeholder="Confirm new password" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
              </div>
            </div>
            <Button onClick={handleChangePassword} variant="outline" disabled={isSaving && !!security.currentPassword}>{isSaving && !!security.currentPassword ? "Changing..." : "Change Password"}</Button>
            
            {/* Session Timeout - originally reviewer specific, can be made common if API supports */}
            {userRole === "reviewer" && (
              <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout</Label>
                <Select value={security.sessionTimeout} onValueChange={(v) => handleSecurityChange("sessionTimeout", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="4">4 hours</SelectItem>
                    <SelectItem value="8">8 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Download className="h-5 w-5 mr-2" />Data Management</CardTitle>
          <CardDescription>Export your data {userRole === "submitter" && "or delete your account"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><Label>Export Data</Label><p className="text-sm text-gray-500">Download a copy of all your data</p></div>
              <Button variant="outline" onClick={handleExportData} disabled={isSaving}><Download className="h-4 w-4 mr-2" />Export</Button>
            </div>
            {userRole === "submitter" && (
              <>
                <Separator />
                <Alert className="border-red-200 bg-red-50">
                  <Trash2 className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800"><strong>Delete Account:</strong> This action cannot be undone. All your data will be permanently removed.</AlertDescription>
                </Alert>
                <Button variant="destructive" onClick={handleDeleteAccount} disabled={isSaving}><Trash2 className="h-4 w-4 mr-2" />{isSaving ? "Deleting..." : "Delete Account"}</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
          {isSaving ? "Saving..." : "Save All Settings"}
        </Button>
      </div>
    </div>
  )
}
