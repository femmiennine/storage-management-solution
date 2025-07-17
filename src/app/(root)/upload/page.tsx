"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileUpload } from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UploadPage() {
  const router = useRouter();
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back button */}
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        {/* Upload Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Upload Files</CardTitle>
            <CardDescription>
              Upload your documents, images, videos, and other files
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-12">
            <Upload className="h-16 w-16 text-muted-foreground mb-6" />
            <p className="text-lg mb-2">Ready to upload your files?</p>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Support for multiple file types including images, documents, videos, and more. 
              Files are securely stored and can be accessed anytime.
            </p>
            <Button size="lg" onClick={() => setShowUpload(true)} className="gap-2">
              <Upload className="h-5 w-5" />
              Choose Files to Upload
            </Button>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Secure Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your files are encrypted and stored securely in the cloud
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Easy Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Access your files from anywhere, anytime
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">File Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Organize, search, and manage all your files in one place
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* File Upload Dialog */}
      <FileUpload 
        open={showUpload} 
        onClose={() => setShowUpload(false)}
        onUploadComplete={() => {
          setShowUpload(false);
          router.push('/files');
        }}
      />
    </div>
  );
}