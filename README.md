# 🗄️ Storage Management Solution

A modern, full-stack file storage and management platform built with Next.js and Appwrite. This application provides users with secure file upload, management, and sharing capabilities through a clean, responsive web interface.

## ✨ Features

### 🔐 Authentication System
- User registration and login
- Secure session management
- Protected routes with middleware
- Avatar generation using Appwrite's avatar service

### 📁 File Management
- **Multiple file type support**: Documents, images, videos, audio files
- **Drag & drop upload** with visual feedback
- **Progress tracking** during uploads
- **File metadata storage** (name, size, type, URL)
- **File deletion** capabilities

### 📊 Storage Analytics
- **Storage usage tracking** with visual progress
- **File type categorization** (documents, images, videos)
- **Storage quota management** (10GB limit)
- **Recent uploads display**

### 🎨 User Interface
- **Responsive design** for all device sizes
- **Modern UI components** with consistent styling
- **Dark/light mode support** (infrastructure ready)
- **Intuitive navigation** with protected routes

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest version for UI components
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS framework
- **ShadCN UI** - Modern component library built on Radix UI
- **Lucide React** - Icon library

### Backend & Database
- **Appwrite** - Backend-as-a-Service platform providing:
  - User authentication and account management
  - Database services for file metadata
  - File storage buckets
  - Real-time capabilities

### Form Handling & Validation
- **React Hook Form** - Efficient form management
- **Zod** - Schema validation
- **@hookform/resolvers** - Form validation integration

### UI Components
- **Radix UI** - Accessible component primitives
- **Class Variance Authority** - Component variant management
- **Tailwind Merge** - Tailwind class merging utility

## 🏗️ Project Structure

```
storage-management-solution/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Authentication routes
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   ├── (root)/           # Protected application routes
│   │   │   ├── dashboard/    # Main dashboard
│   │   │   ├── files/        # File management
│   │   │   ├── settings/     # User settings
│   │   │   └── upload/       # File upload
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Landing page
│   ├── components/
│   │   ├── forms/            # Form components
│   │   ├── ui/               # Reusable UI components
│   │   └── FileUpload.tsx    # File upload component
│   ├── lib/
│   │   ├── actions/          # Server actions
│   │   ├── appwrite/         # Appwrite configuration
│   │   └── utils.ts          # Utility functions
│   └── middleware.ts         # Authentication middleware
├── package.json
├── next.config.ts
├── tailwind.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn package manager
- Appwrite account and project setup

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd storage-management-solution
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   NEXT_PUBLIC_APPWRITE_ENDPOINT=your_appwrite_endpoint
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
   NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=your_storage_bucket_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Usage

### Getting Started
1. **Sign Up**: Create a new account using the registration form
2. **Sign In**: Access your dashboard with your credentials
3. **Upload Files**: Use the drag-and-drop interface or click to select files
4. **Manage Files**: View, organize, and delete your uploaded files
5. **Monitor Storage**: Track your usage and remaining storage space

### File Types Supported
- **Documents**: PDF, DOC, DOCX, TXT, etc.
- **Images**: JPG, PNG, GIF, SVG, etc.
- **Videos**: MP4, AVI, MOV, etc.
- **Audio**: MP3, WAV, etc.

## 🔧 Configuration

### Appwrite Setup
1. Create an Appwrite project
2. Configure authentication (email/password)
3. Set up a database for file metadata
4. Create a storage bucket for file uploads
5. Configure appropriate permissions

### Environment Variables
- `NEXT_PUBLIC_APPWRITE_ENDPOINT`: Your Appwrite server URL
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`: Your Appwrite project ID
- `NEXT_PUBLIC_APPWRITE_DATABASE_ID`: Database ID for file metadata
- `NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID`: Storage bucket ID for files

## 🧪 Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Type checking
npm run type-check
```

### Code Quality
- **ESLint**: Configured for Next.js and TypeScript
- **TypeScript**: Strict type checking enabled
- **TailwindCSS**: Consistent styling approach
- **Component Architecture**: Modular and reusable components

## 🔒 Security Features

- **Route Protection**: Middleware-based authentication
- **Secure File URLs**: Generated through Appwrite
- **Input Validation**: Zod schemas for form validation
- **User-Specific Access**: Files are isolated per user account
- **Environment-Based Configuration**: Sensitive data in environment variables

## 📊 Architecture Highlights

### Route Protection
- Uses Next.js middleware for authentication
- Route groups `(auth)` and `(root)` for organized routing
- Automatic redirects for unauthenticated users

### State Management
- Client-side state with React hooks
- Server actions for data fetching
- Real-time updates after file operations

### File Handling
- Secure file upload to Appwrite storage buckets
- File metadata stored in Appwrite database
- Preview generation for image files
- Progress tracking during uploads

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Acknowledgments

- **Next.js Team** for the amazing React framework
- **Appwrite Team** for the comprehensive BaaS platform
- **ShadCN** for the beautiful UI components
- **Radix UI** for accessible component primitives
- **Tailwind CSS** for the utility-first CSS framework

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Provide steps to reproduce any bugs

---

**Built with ❤️ using Next.js and Appwrite**