"use client"

import { useState, useEffect } from "react"
import { Bell, Lock, Shield, Trash2, Download, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"

export default function SubmitterSettings() {
  const [userEmail, setUserEmail] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    adApproved: true,
    adRejected: true,
    paymentConfirmation: true,
    weeklyDigest: false,
    marketingEmails: false,
  })

  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
    showEmail: false,
    showPhone: false,
    dataCollection: true,
  })

  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
  })

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || ""
    setUserEmail(email)
  }, [])

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }))
  }

  const handlePrivacyChange = (key: string, value: string | boolean) => {
    setPrivacy((prev) => ({ ...prev, [key]: value }))
  }

  const handleSecurityChange = (key: string, value: string | boolean) => {
    setSecurity((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveSettings = () => {
    setIsSaving(true)

    // Mock save operation
    setTimeout(() => {
      setIsSaving(false)
      toast({
        title: "Settings Saved",
        description: "Your settings have been successfully updated.",
      })
    }, 1000)
  }

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
      description: "Your data export will be emailed to you within 24 hours.",
    })
  }

  const handleDeleteAccount = () => {
    toast({
      title: "Account Deletion",
      description: "Please contact support to delete your account.",
      variant: "destructive",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose how you want to be notified about your ads and account activity</CardDescription>
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
                <Label htmlFor="adApproved">Ad Approved</Label>
                <p className="text-sm text-gray-500">When your ad gets approved</p>
              </div>
              <Switch
                id="adApproved"
                checked={notifications.adApproved}
                onCheckedChange={(checked) => handleNotificationChange("adApproved", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="adRejected">Ad Rejected</Label>
                <p className="text-sm text-gray-500">When your ad gets rejected</p>
              </div>
              <Switch
                id="adRejected"
                checked={notifications.adRejected}
                onCheckedChange={(checked) => handleNotificationChange("adRejected", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="paymentConfirmation">Payment Confirmation</Label>
                <p className="text-sm text-gray-500">Payment and billing notifications</p>
              </div>
              <Switch
                id="paymentConfirmation"
                checked={notifications.paymentConfirmation}
                onCheckedChange={(checked) => handleNotificationChange("paymentConfirmation", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weeklyDigest">Weekly Digest</Label>
                <p className="text-sm text-gray-500">Weekly summary of your activity</p>
              </div>
              <Switch
                id="weeklyDigest"
                checked={notifications.weeklyDigest}
                onCheckedChange={(checked) => handleNotificationChange("weeklyDigest", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="marketingEmails">Marketing Emails</Label>
                <p className="text-sm text-gray-500">Product updates and promotional content</p>
              </div>
              <Switch
                id="marketingEmails"
                checked={notifications.marketingEmails}
                onCheckedChange={(checked) => handleNotificationChange("marketingEmails", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Privacy Settings
          </CardTitle>
          <CardDescription>Control your privacy and data sharing preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profileVisibility">Profile Visibility</Label>
              <Select
                value={privacy.profileVisibility}
                onValueChange={(value) => handlePrivacyChange("profileVisibility", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="reviewers-only">Reviewers Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="showEmail">Show Email in Profile</Label>
                <p className="text-sm text-gray-500">Display your email address on your public profile</p>
              </div>
              <Switch
                id="showEmail"
                checked={privacy.showEmail}
                onCheckedChange={(checked) => handlePrivacyChange("showEmail", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="showPhone">Show Phone in Profile</Label>
                <p className="text-sm text-gray-500">Display your phone number on your public profile</p>
              </div>
              <Switch
                id="showPhone"
                checked={privacy.showPhone}
                onCheckedChange={(checked) => handlePrivacyChange("showPhone", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dataCollection">Analytics Data Collection</Label>
                <p className="text-sm text-gray-500">Help us improve by sharing anonymous usage data</p>
              </div>
              <Switch
                id="dataCollection"
                checked={privacy.dataCollection}
                onCheckedChange={(checked) => handlePrivacyChange("dataCollection", checked)}
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
          <CardDescription>Export or delete your account data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Export Data</Label>
                <p className="text-sm text-gray-500">Download a copy of all your data</p>
              </div>
              <Button variant="outline" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            <Separator />

            <Alert className="border-red-200 bg-red-50">
              <Trash2 className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Delete Account:</strong> This action cannot be undone. All your data will be permanently
                removed.
              </AlertDescription>
            </Alert>

            <Button variant="destructive" onClick={handleDeleteAccount}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
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
