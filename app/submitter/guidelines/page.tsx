"use client"

import { CheckCircle, XCircle, AlertTriangle, FileText, ImageIcon, Link, DollarSign, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function SubmitterGuidelines() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Submission Guidelines</h1>
        <p className="text-gray-600">Follow these guidelines to ensure your ads get approved quickly</p>
      </div>

      {/* Quick Overview */}
      <Alert className="border-green-200 bg-green-50">
        <AlertTriangle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Important Notice</AlertTitle>
        <AlertDescription className="text-green-700">
          All advertisements must comply with our guidelines to be approved. Violations may result in rejection or
          account suspension.
        </AlertDescription>
      </Alert>

      {/* Content Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Content Guidelines
          </CardTitle>
          <CardDescription>Requirements for ad content and messaging</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-green-600 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Allowed Content
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Clear, honest, and accurate product descriptions
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Professional and family-friendly language
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Legitimate business promotions and offers
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Educational and informational content
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Proper grammar and spelling
              </li>
            </ul>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-red-600 flex items-center">
              <XCircle className="h-4 w-4 mr-2" />
              Prohibited Content
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                Misleading or false claims about products/services
              </li>
              <li className="flex items-start">
                <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                Adult content, violence, or inappropriate material
              </li>
              <li className="flex items-start">
                <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                Hate speech, discrimination, or offensive language
              </li>
              <li className="flex items-start">
                <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                Illegal products or services
              </li>
              <li className="flex items-start">
                <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                Spam, excessive capitalization, or clickbait
              </li>
              <li className="flex items-start">
                <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                Copyright infringement or unauthorized use of trademarks
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Image Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ImageIcon className="h-5 w-5 mr-2" />
            Image Requirements
          </CardTitle>
          <CardDescription>Technical and content requirements for ad images</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-semibold">Technical Requirements</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <Badge variant="outline" className="mr-2">
                    Format
                  </Badge>
                  JPEG, PNG, GIF, or WebP
                </li>
                <li className="flex items-center">
                  <Badge variant="outline" className="mr-2">
                    Size
                  </Badge>
                  Maximum 5MB file size
                </li>
                <li className="flex items-center">
                  <Badge variant="outline" className="mr-2">
                    Resolution
                  </Badge>
                  Minimum 600x300 pixels
                </li>
                <li className="flex items-center">
                  <Badge variant="outline" className="mr-2">
                    Aspect Ratio
                  </Badge>
                  16:9 or 2:1 recommended
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Quality Standards</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  High resolution and clear imagery
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Professional appearance
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Relevant to the advertised product
                </li>
                <li className="flex items-start">
                  <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  No watermarks or logos from other companies
                </li>
                <li className="flex items-start">
                  <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  No blurry or pixelated images
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* URL Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Link className="h-5 w-5 mr-2" />
            Target URL Requirements
          </CardTitle>
          <CardDescription>Guidelines for destination URLs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-green-600 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Acceptable URLs
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                HTTPS secure websites only
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Working links that load properly
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Landing pages relevant to the ad content
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Professional websites with clear navigation
              </li>
            </ul>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-red-600 flex items-center">
              <XCircle className="h-4 w-4 mr-2" />
              Prohibited URLs
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                Broken or non-functional links
              </li>
              <li className="flex items-start">
                <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                Redirect chains or suspicious URLs
              </li>
              <li className="flex items-start">
                <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                Malware or phishing websites
              </li>
              <li className="flex items-start">
                <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                Adult content or gambling sites
              </li>
              <li className="flex items-start">
                <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                Social media profiles (unless business pages)
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Pricing and Payment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Pricing and Payment Guidelines
          </CardTitle>
          <CardDescription>Information about submission fees and pricing claims</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Submission Fee</h3>
            <p className="text-sm text-green-700">
              A $50.00 submission fee is required for each ad submission. This fee covers the review process and
              platform maintenance.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Pricing Claims</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Accurate pricing information
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Clear terms and conditions for offers
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Valid expiration dates for promotions
              </li>
              <li className="flex items-start">
                <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                "Too good to be true" offers
              </li>
              <li className="flex items-start">
                <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                Hidden fees or misleading pricing
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Review Process */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Review Process
          </CardTitle>
          <CardDescription>What happens after you submit your ad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">
                1
              </div>
              <h3 className="font-semibold mb-2">Submission</h3>
              <p className="text-sm text-gray-600">Your ad is submitted and payment is processed</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">
                2
              </div>
              <h3 className="font-semibold mb-2">Review</h3>
              <p className="text-sm text-gray-600">Our team reviews your ad against guidelines (24-48 hours)</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">
                3
              </div>
              <h3 className="font-semibold mb-2">Decision</h3>
              <p className="text-sm text-gray-600">You receive approval or feedback for improvements</p>
            </div>
          </div>

          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Review Time:</strong> Most ads are reviewed within 24-48 hours. Complex submissions may take
              longer.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Common Rejection Reasons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Common Rejection Reasons</CardTitle>
          <CardDescription>Avoid these common mistakes to improve approval chances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="font-semibold">Content Issues</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  Misleading or exaggerated claims
                </li>
                <li className="flex items-start">
                  <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  Poor grammar or spelling errors
                </li>
                <li className="flex items-start">
                  <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  Inappropriate or offensive content
                </li>
                <li className="flex items-start">
                  <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  Vague or unclear descriptions
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold">Technical Issues</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  Low-quality or blurry images
                </li>
                <li className="flex items-start">
                  <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  Broken or invalid URLs
                </li>
                <li className="flex items-start">
                  <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  Incorrect image dimensions
                </li>
                <li className="flex items-start">
                  <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  Non-responsive landing pages
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
