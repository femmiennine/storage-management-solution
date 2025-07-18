"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Cloud, 
  Shield, 
  Share2, 
  Folder, 
  Zap, 
  Lock,
  ArrowRight,
  CheckCircle,
  Users,
  HardDrive,
  Sparkles
} from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: Cloud,
      title: "Cloud Storage",
      description: "Access your files from anywhere, anytime with secure cloud storage"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Your data is protected with industry-standard encryption"
    },
    {
      icon: Share2,
      title: "Easy Sharing",
      description: "Share files and folders with anyone through secure links"
    },
    {
      icon: Folder,
      title: "Smart Organization",
      description: "Organize your files with folders, tags, and powerful search"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Upload and download files at blazing speeds"
    },
    {
      icon: Users,
      title: "Collaboration",
      description: "Work together with team members on shared files"
    }
  ];

  const stats = [
    { value: "99.9%", label: "Uptime" },
    { value: "256-bit", label: "Encryption" },
    { value: "Unlimited", label: "Storage" },
    { value: "24/7", label: "Support" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="fixed top-0 w-full bg-background/80 backdrop-blur-sm border-b z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button asChild variant="ghost">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-24">
        <section className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Welcome to the future of file management
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Store, Share, and Manage
              <span className="block text-primary mt-2">Your Files with Ease</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the power of seamless file management with Storease. 
              Secure cloud storage, intelligent organization, and effortless sharing - all in one place.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="gap-2">
                <Link href="/sign-up">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything you need</h2>
            <p className="text-muted-foreground">Powerful features to manage your digital life</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="bg-card p-6 rounded-lg border hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="bg-primary rounded-2xl p-12 text-center">
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl font-bold text-primary-foreground">
                Ready to take control of your files?
              </h2>
              <p className="text-primary-foreground/80">
                Join thousands of users who trust Storease for their file management needs
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button asChild size="lg" variant="secondary" className="gap-2">
                  <Link href="/sign-up">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features List */}
        <section className="container mx-auto px-6 py-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why choose Storease?</h2>
            <div className="space-y-4">
              {[
                "Unlimited file uploads with no size restrictions",
                "Advanced search and filtering capabilities",
                "Real-time collaboration and file sharing",
                "Automatic file versioning and recovery",
                "Mobile and desktop sync across all devices",
                "Enterprise-grade security and compliance"
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="container mx-auto px-6 py-20 border-t">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="flex justify-center">
              <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Lock className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h2 className="text-3xl font-bold">Your security is our priority</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We use bank-level encryption to ensure your files are always protected. 
              Your data is encrypted in transit and at rest, giving you peace of mind.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-6 py-12 border-t">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Logo showText={false} />
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Frances Femille Fogarty. All rights reserved.
              </p>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}