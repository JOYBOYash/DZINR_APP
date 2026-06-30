# ARCHITECTURAL DESIGNS & SYSTEM DIRECTORIES

Dzinr utilizes a modular separation of concerns following our strict architecture directives:

## Folder Organization

- `public/`: Standalone PWA configurations, manifest files, icon bundles, and the background Service Worker thread.
- `src/components/`: Pure functional visual building blocks (such as `Button`, `Input`, and `LoadingState`).
- `src/services/`: Isolated infrastructure adapters:
  - `firebase.ts`: Database configuration, authentication helpers, and client hooks.
  - `auth.service.ts`: Sign up/in routines.
  - `user.service.ts`: Query triggers for Firestore users and deleted collections.
  - `design.service.ts`: Firestore CRUD operations for curated design mockups.
  - `cloudinary.service.ts`: Integration with Cloudinary CDN for optimized image storage.
  - `imageCompression.service.ts`: Client-side image compression to convert uploads to WebP under 2MB.
  - `zipImport.service.ts`: Unpacks client-side ZIP archives, filtering for JPG/PNG/WEBP files for bulk mockups.
- `src/stores/`: Zustand client-side triggers (like active log indices, dialog controls, and transient auth sessions).
- `src/types/`: Base interfaces (such as `UserProfile` and `Design`).

## State Management Flow

1. **Session State**: Held in `useAuthStore` to control application view shells.
2. **Persistence State**: Synced using standard client-server handlers (via Firebase onAuthStateChanged).
3. **Database Caching**: Ready to compile complex queries via TanStack React Query inside Layer 2.

## Key Feature Flows

### 1. Unified Onboarding & Personalization Flow
- **Interactive Wizard**: Step-by-step onboarding wizard capturing avatar customizations, user handles, and design preference presets.
- **Multimodal Design Imports**:
  - *Manual Uploads*: Upload multiple mockup screenshots simultaneously with automatic client-side WebP compression.
  - *ZIP Bulking*: Unpacks a ZIP archive, extracts images, and uploads them in bulk to Cloudinary and Firestore.
  - *URL Scraping*: Resolves design preview images directly from Behance, Pinterest, or Artstation urls, uploading them as curated starting feeds.

### 2. Full-Loop Account Deletion Survey
- **Safe Database Termination**: Cleans up Cloudinary assets, deletes user profile documents, and writes a detailed feedback survey document into the `deleted` collection for team follow-up.
- **Feedback Analysis**: Captures reason for leaving (e.g. Confusing, Missing features, Performance, etc.), text improvement logs, and optional outreach consent (saving follow-up email coordinates).
- **Client Session Wiping**: Attempts to terminate the Firebase Authentication credentials client-side and triggers a state-reset to the log-in view.

### 3. Verification Synchronizer
- **Two-Way Status Check**: Automatically synchronizes the user's Firestore profile verification state with their real Firebase Authentication status in both directions. Prevents older accounts from showing a verified status without having completed their Firebase email validation.

