# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev      # Start development server (typically runs on port 3000 or 3001)
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint for code quality checks
```

## Architecture Overview

This is a **Next.js 15 App Router** application using **React 19** and **TypeScript**. The app follows a client-server architecture with **Appwrite** as the Backend-as-a-Service.

### Key Architectural Decisions

1. **App Router with Route Groups**: Uses Next.js 15's app directory with route groups `(auth)` for public auth pages and `(root)` for protected pages.

2. **Server Actions Pattern**: All database operations are handled through server actions in `src/lib/actions/` rather than API routes. This includes:
   - `user.actions.ts`: Authentication and user management
   - `file.actions.ts`: File upload, retrieval, and deletion

3. **Client-Side State Management**: Uses React hooks and component state. No global state management library is used - data is fetched on-demand.

4. **Authentication Flow**:
   - Middleware (`src/middleware.ts`) handles route protection
   - Appwrite manages sessions and tokens
   - User data stored in both Appwrite Auth and custom database collection

### Component Architecture

- **UI Components**: ShadCN/UI components in `src/components/ui/` (imported via `npx shadcn@latest add`)
- **Feature Components**: Custom components like `FileUpload.tsx` handle specific features
- **Form Handling**: React Hook Form with Zod validation for type-safe forms

## Appwrite Integration

The app uses Appwrite for:
- **Authentication**: Email/password auth with session management
- **Database**: Two collections - `users` and `files`
- **Storage**: File uploads stored in Appwrite buckets

### Key Integration Points

1. **Client Initialization**: `src/lib/appwrite/index.ts`
2. **Configuration**: Environment variables in `.env.local`
3. **File URLs**: Use `.toString()` method on Appwrite URL objects (not `.href`)

## Critical Implementation Details

### File Upload Flow
1. Upload file to Appwrite storage bucket
2. Get file URL using `storage.getFileView()`
3. Store metadata in database with URL reference
4. Handle progress callbacks during upload

### Authentication State
- Check auth state with `getCurrentUser()` in server actions
- Redirect to `/sign-in` if not authenticated
- User document linked to Appwrite account via `accountId`

### Error Handling Patterns
- Server actions throw errors that are caught in components
- UI shows loading states during async operations
- Form errors displayed inline using React Hook Form

## Environment Configuration

Required environment variables (see `.env.local.example`):
```
NEXT_PUBLIC_APPWRITE_ENDPOINT
NEXT_PUBLIC_APPWRITE_PROJECT_ID
NEXT_PUBLIC_APPWRITE_DATABASE_ID
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID
NEXT_PUBLIC_APPWRITE_FILES_COLLECTION_ID
NEXT_PUBLIC_APPWRITE_BUCKET_ID
```

## Database Schema

### Users Collection
- `accountId` (String) - Links to Appwrite Auth
- `email` (Email)
- `fullName` (String)
- `avatar` (URL)

### Files Collection
- `userId` (String) - Owner reference
- `fileName` (String)
- `fileSize` (Integer)
- `fileType` (String) - MIME type
- `fileUrl` (URL) - Storage view URL
- `bucketFileId` (String) - Storage reference

## Common Development Tasks

### Adding New ShadCN Components
```bash
npx shadcn@latest add [component-name]
```

### Creating New Protected Pages
1. Add page in `src/app/(root)/[page-name]/page.tsx`
2. Update navigation in `src/app/(root)/layout.tsx`
3. Page will automatically be protected by middleware

### Adding New Server Actions
1. Create new file in `src/lib/actions/`
2. Export async functions that interact with Appwrite
3. Import and use in client components with error handling

## Known Gotchas

1. **Hydration Errors**: Browser extensions (like Grammarly) can cause hydration mismatches in development
2. **Port Conflicts**: Dev server tries port 3000 first, then 3001
3. **Appwrite URLs**: Must use `.toString()` method, not `.href`
4. **File Permissions**: Ensure Appwrite collections and buckets have correct permissions set