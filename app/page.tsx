import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowRight, Shield, CheckCircle, Users, BarChart3, Zap, Eye, Bell, Star, Play } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto p-2 sm:p-4 flex justify-between items-center">
          <div className="flex items-center">
            <Shield className="h-5 sm:h-8 w-5 sm:w-8 text-green-600 mr-2" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">AdScreener</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-green-600 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-600 hover:text-green-600 transition-colors">
              How it Works
            </a>
            {/* <a href="#testimonials" className="text-gray-600 hover:text-green-600 transition-colors">
              Testimonials
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-green-600 transition-colors">
              Pricing
            </a> */}
          </nav>
          <div className="space-x-2 sm:space-x-4">
            <Link href="/login">
              <Button variant="outline" className="text-sm sm:text-base">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button className="text-sm sm:text-base bg-green-600 hover:bg-green-700">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-green-50 via-white to-indigo-50 max-w-[100vw] overflow-x-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">
                  🚀 Trusted by 100+ Companies
                </Badge>
                <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
                  Pre-Vetted, <span className="text-green-600">ARCON-Ready Ads</span> — Honest, Ethical, <span className="text-green-600">Compliant</span>, Approved.
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  AdScreener automates advertisement submission, review, and approval workflows. Reduce review time by
                  80% while maintaining quality standards.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup?role=submitter">
                  <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8 py-4">
                    Start Submitting Ads
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                {/* <Button size="lg" variant="outline" className="text-lg px-8 py-4">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button> */}
              </div>

              {/* <div className="flex items-center space-x-8 pt-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">No setup required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">Just pure feedbacks</span>
                </div>
              </div> */}
            </div>

            <div className="relative">
              <div className="relative z-10">
                <img
                  src="/hero_landing.jpg"
                  alt="AdScreener Dashboard Preview"
                  className="rounded-2xl shadow-2xl border border-gray-200"
                />
                {/* <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">Live Dashboard</span>
                  </div>
                </div> */}
              </div>
              <div className="absolute top-8 -right-8 w-32 h-32 bg-green-100 rounded-full opacity-20"></div>
              <div className="absolute -bottom-8 right-8 w-24 h-24 bg-indigo-100 rounded-full opacity-30"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-600">100+</div>
              <div className="text-gray-600 mt-2">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-600">50K+</div>
              <div className="text-gray-600 mt-2">Ads Reviewed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-600">80%</div>
              <div className="text-gray-600 mt-2">Time Saved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-600">99.9%</div>
              <div className="text-gray-600 mt-2">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {/* <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything You Need for Ad Management</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From submission to approval, AdScreener provides a complete solution for managing your advertisement
              workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Lightning Fast Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Submit ads in seconds with our intuitive form. Drag-and-drop image uploads, URL validation, and
                  instant previews.
                </p>
                <img
                  src="/placeholder.svg?height=200&width=350"
                  alt="Ad Submission Interface"
                  className="rounded-lg border border-gray-200 w-full"
                />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Smart Review System</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Reviewers can approve or reject ads with detailed feedback. Built-in guidelines ensure consistent
                  quality.
                </p>
                <img
                  src="/placeholder.svg?height=200&width=350"
                  alt="Review Interface"
                  className="rounded-lg border border-gray-200 w-full"
                />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Real-time Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Get instant updates on ad status changes. In-app notifications and email alerts keep everyone
                  informed.
                </p>
                <img
                  src="/placeholder.svg?height=200&width=350"
                  alt="Notification System"
                  className="rounded-lg border border-gray-200 w-full"
                />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Analytics & Reporting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Track submission rates, approval times, and team performance with comprehensive analytics dashboards.
                </p>
                <img
                  src="/placeholder.svg?height=200&width=350"
                  alt="Analytics Dashboard"
                  className="rounded-lg border border-gray-200 w-full"
                />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Team Collaboration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Multiple reviewers, role-based permissions, and collaborative workflows for teams of any size.
                </p>
                <img
                  src="/placeholder.svg?height=200&width=350"
                  alt="Team Dashboard"
                  className="rounded-lg border border-gray-200 w-full"
                />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-teal-600" />
                </div>
                <CardTitle>Enterprise Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  SOC 2 compliant with enterprise-grade security. GDPR ready with comprehensive audit trails.
                </p>
                <img
                  src="/placeholder.svg?height=200&width=350"
                  alt="Security Features"
                  className="rounded-lg border border-gray-200 w-full"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </section> */}

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How AdScreener Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A simple, three-step process that transforms your ad review workflow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="relative mb-8">
                <img
                  src="/m1.jpg"
                  alt="Step 1: Submit"
                  className="rounded-2xl shadow-lg mx-auto object-cover h-[35vh] aspect-video"
                />
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  1
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Submit Your Ad</h3>
              <p className="text-gray-600">
                Upload your advertisement with title, description, target URL, and creative assets. Our smart form
                validates everything automatically.
              </p>
            </div>

            <div className="text-center">
              <div className="relative mb-8">
                <img
                  src="/m2.webp"
                  alt="Step 2: Review"
                  className="rounded-2xl shadow-lg mx-auto object-cover h-[35vh] aspect-video"
                />
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  2
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Expert Review</h3>
              <p className="text-gray-600">
                Our trained reviewers evaluate your ad against quality guidelines. Get detailed feedback and suggestions
                for improvement.
              </p>
            </div>

            <div className="text-center">
              <div className="relative mb-8">
                <img
                  src="/m3.png"
                  alt="Step 3: Publish"
                  className="rounded-2xl shadow-lg mx-auto object-cover h-[35vh] aspect-video"
                />
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  3
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Go Live</h3>
              <p className="text-gray-600">
                Approved ads are ready for publication. Get instant notifications and access to performance analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      {/* <section className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Powerful Dashboards for Every Role</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tailored interfaces for submitters and reviewers with all the tools you need
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-6">Submitter Dashboard</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Track all your ad submissions in one place</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Real-time status updates and notifications</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Performance analytics and insights</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Easy resubmission for rejected ads</span>
                </div>
              </div>
            </div>
            <div>
              <img
                src="/placeholder.svg?height=400&width=600"
                alt="Submitter Dashboard"
                className="rounded-2xl shadow-2xl border border-gray-200"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mt-20">
            <div className="order-2 lg:order-1">
              <img
                src="/placeholder.svg?height=400&width=600"
                alt="Reviewer Dashboard"
                className="rounded-2xl shadow-2xl border border-gray-200"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h3 className="text-2xl font-bold mb-6">Reviewer Dashboard</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Streamlined review workflow</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Bulk actions for efficient processing</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Detailed feedback and rejection reasons</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Team performance metrics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Testimonials Section */}
      {/* <section id="testimonials" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Trusted by Industry Leaders</h2>
            <p className="text-xl text-gray-600">See what our customers say about AdScreener</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="italic text-gray-600 mb-6">
                  "AdScreener reduced our ad review time from days to hours. The interface is intuitive and the
                  notification system keeps everyone in the loop."
                </p>
                <div className="flex items-center">
                  <img
                    src="https://cdn.pixabay.com/photo/2017/05/22/07/20/woman-2333326_1280.jpg"
                    alt="Sarah Johnson"
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <p className="font-semibold">Sarah Johnson</p>
                    <p className="text-sm text-gray-500">Marketing Director, TechCorp</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="italic text-gray-600 mb-6">
                  "The analytics dashboard gives us incredible insights into our ad performance. We've improved our
                  approval rate by 40%."
                </p>
                <div className="flex items-center">
                  <img
                    src="https://cdn.pixabay.com/photo/2021/08/11/17/45/man-6539072_1280.jpg"
                    alt="Michael Chen"
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <p className="font-semibold">Michael Chen</p>
                    <p className="text-sm text-gray-500">Creative Director, AdAgency Pro</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="italic text-gray-600 mb-6">
                  "As a reviewer, AdScreener makes my job so much easier. The bulk actions and detailed feedback options
                  are game-changers."
                </p>
                <div className="flex items-center">
                  <img
                    src="https://cdn.pixabay.com/photo/2021/01/14/20/00/girl-5917784_1280.jpg"
                    alt="Emily Rodriguez"
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <p className="font-semibold">Emily Rodriguez</p>
                    <p className="text-sm text-gray-500">Senior Reviewer, MediaFlow</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-20 bg-green-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Transform Your Ad Review Process?</h2>
          <p className="text-xl text-green-100  max-w-2xl mx-auto">
            Join thousands of companies already using AdScreener to streamline their advertisement workflows.
          </p>
          {/* <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 hover:border-green-800 text-lg px-8 py-4">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-green-600 hover:bg-green-800 hover:text-white text-lg px-8 py-4"
            >
              Schedule Demo
            </Button>
          </div> */}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Shield className="h-8 w-8 text-green-400 mr-2" />
                <span className="text-xl font-bold">AdScreener</span>
              </div>
              <p className="text-gray-400 mb-4">
                The leading platform for advertisement submission and review workflows.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  X
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  LinkedIn
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  Instagam
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Features
                  </a>
                </li>
                {/* <li>
                  <a href="#" className="hover:text-white">
                    Pricing
                  </a>
                </li> */}
                {/* <li>
                  <a href="#" className="hover:text-white">
                    API
                  </a>
                </li> */}
                {/* <li>
                  <a href="#" className="hover:text-white">
                    Integrations
                  </a>
                </li> */}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    About
                  </a>
                </li>
                {/* <li>
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
                </li> */}
                {/* <li>
                  <a href="#" className="hover:text-white">
                    Careers
                  </a>
                </li> */}
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Status
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Security
                  </a>
                </li>
              </ul>
            </div> */}
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© {(new Date()).getFullYear()} AdScreener. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm">
                Terms of Service
              </a>
              {/* <a href="#" className="text-gray-400 hover:text-white text-sm">
                Cookie Policy
              </a> */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
