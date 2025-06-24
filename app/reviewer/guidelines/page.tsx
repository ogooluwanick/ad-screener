"use client"

import { CheckCircle, XCircle, AlertTriangle, FileText, ImageIcon, Shield, Clock, Users, Award } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function ReviewerGuidelines() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Review Guidelines</h1>
        <p className="text-gray-600">Comprehensive guidelines for reviewing ad submissions</p>
      </div>

      {/* Quick Overview */}
      <Alert className="border-green-200 bg-green-50">
        <Shield className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Reviewer Responsibilities</AlertTitle>
        <AlertDescription className="text-green-700">
          As a reviewer, you ensure all advertisements meet our quality standards and compliance requirements. Your
          decisions directly impact user experience and platform integrity.
        </AlertDescription>
      </Alert>

      {/* Review Process */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Review Process Overview
          </CardTitle>
          <CardDescription>Step-by-step guide to reviewing advertisements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">
                1
              </div>
              <h3 className="font-semibold mb-2">Initial Review</h3>
              <p className="text-sm text-gray-600">Check basic compliance and technical requirements</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">
                2
              </div>
              <h3 className="font-semibold mb-2">Content Analysis</h3>
              <p className="text-sm text-gray-600">Evaluate content quality, accuracy, and appropriateness</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">
                3
              </div>
              <h3 className="font-semibold mb-2">Technical Check</h3>
              <p className="text-sm text-gray-600">Verify image quality, URL functionality, and formatting</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">
                4
              </div>
              <h3 className="font-semibold mb-2">Final Decision</h3>
              <p className="text-sm text-gray-600">Approve or reject with detailed feedback</p>
            </div>
          </div>

          <Alert className="border-amber-200 bg-amber-50">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Review Timeline:</strong> Complete reviews within 24-48 hours. Urgent reviews should be completed
              within 4 hours.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Content Review Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Content Review Criteria
          </CardTitle>
          <CardDescription>Standards for evaluating ad content and messaging</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-green-600 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approval Criteria
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Clear, accurate, and truthful product/service descriptions
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Professional language with proper grammar and spelling
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Appropriate and family-friendly content
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Legitimate business offers with clear terms
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Compliance with advertising standards and regulations
              </li>
            </ul>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-red-600 flex items-center">
              <XCircle className="h-4 w-4 mr-2" />
              Rejection Criteria
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                False, misleading, or exaggerated claims
              </li>
              <li className="flex items-start">
                <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                Inappropriate, offensive, or adult content
              </li>
              <li className="flex items-start">
                <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                Poor grammar, spelling errors, or unprofessional presentation
              </li>
              <li className="flex items-start">
                <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                Illegal products, services, or activities
              </li>
              <li className="flex items-start">
                <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                Copyright infringement or unauthorized trademark use
              </li>
              <li className="flex items-start">
                <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                Spam, clickbait, or manipulative content
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Technical Review Standards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ImageIcon className="h-5 w-5 mr-2" />
            Technical Review Standards
          </CardTitle>
          <CardDescription>Technical requirements and quality standards</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-semibold">Image Quality Standards</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <Badge variant="outline" className="mr-2">
                    Resolution
                  </Badge>
                  Minimum 600x300 pixels
                </li>
                <li className="flex items-center">
                  <Badge variant="outline" className="mr-2">
                    Quality
                  </Badge>
                  Clear, sharp, and professional
                </li>
                <li className="flex items-center">
                  <Badge variant="outline" className="mr-2">
                    Format
                  </Badge>
                  JPEG, PNG, GIF, WebP
                </li>
                <li className="flex items-center">
                  <Badge variant="outline" className="mr-2">
                    Size
                  </Badge>
                  Under 5MB file size
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">URL Verification</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  URL loads correctly and quickly
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  HTTPS secure connection
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Landing page matches ad content
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Mobile-responsive design
                </li>
                <li className="flex items-start">
                  <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  No malware or security warnings
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Providing Feedback
          </CardTitle>
          <CardDescription>How to write effective feedback for submitters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-green-600">Best Practices for Feedback</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Be specific about what needs to be changed
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Provide constructive suggestions for improvement
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Reference specific guideline violations
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Use professional and respectful language
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Include examples when helpful
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Example Rejection Feedback:</h4>
            <p className="text-sm text-gray-700 italic">
              "The image resolution is below our minimum requirement of 600x300 pixels. Please upload a higher quality
              image. Additionally, the product description contains several spelling errors that need to be corrected
              before approval."
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Example Approval Note:</h4>
            <p className="text-sm text-gray-700 italic">
              "Great ad! The content is clear, professional, and meets all our guidelines. The image quality is
              excellent and the landing page provides a good user experience."
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Escalation Procedures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Escalation Procedures
          </CardTitle>
          <CardDescription>When and how to escalate difficult reviews</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <h3 className="font-semibold">Escalate When:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                Content involves potential legal issues
              </li>
              <li className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                Unclear guideline interpretation
              </li>
              <li className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                Suspected fraudulent activity
              </li>
              <li className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                High-value or sensitive campaigns
              </li>
              <li className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                Submitter disputes or complaints
              </li>
            </ul>
          </div>

          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Immediate Escalation Required:</strong> Content involving illegal activities, hate speech, or
              potential harm to users must be escalated immediately to the senior review team.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Performance Standards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Performance Standards
          </CardTitle>
          <CardDescription>Quality metrics and performance expectations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">95%+</div>
              <div className="text-sm text-gray-600">Accuracy Rate</div>
              <p className="text-xs text-gray-500 mt-1">Consistent with senior reviewer decisions</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">24h</div>
              <div className="text-sm text-gray-600">Review Time</div>
              <p className="text-xs text-gray-500 mt-1">Average time to complete reviews</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">4.5+</div>
              <div className="text-sm text-gray-600">Feedback Quality</div>
              <p className="text-xs text-gray-500 mt-1">Submitter satisfaction rating</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Quality Indicators</h3>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center">
                <Badge variant="outline" className="mr-2">
                  Consistency
                </Badge>
                Similar ads receive similar decisions
              </li>
              <li className="flex items-center">
                <Badge variant="outline" className="mr-2">
                  Thoroughness
                </Badge>
                All aspects of guidelines are checked
              </li>
              <li className="flex items-center">
                <Badge variant="outline" className="mr-2">
                  Clarity
                </Badge>
                Feedback is clear and actionable
              </li>
              <li className="flex items-center">
                <Badge variant="outline" className="mr-2">
                  Timeliness
                </Badge>
                Reviews completed within target timeframes
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
