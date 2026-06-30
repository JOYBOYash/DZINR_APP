# Dzinr App Specification & Architecture Document

This document provides a highly detailed, comprehensive architectural and functional breakdown of **Dzinr**, a mobile-first design feedback and portfolio hub. It reflects the application's precise structure, logic flow, API endpoints, state management, storage systems, and interactive UI states as of the current phase of development.

---

## 1. Directory & File Structure Breakdown

The codebase is organized as a clean, feature-based, full-stack application. The structure strictly enforces separation of concerns: state management is kept in Zustand stores, business logic is isolated in services, and views are composed of modular components.

```text
├── .env.example                     # Reference declaration for environment variables
├── .gitignore                       # Ignored build outputs, dependencies, and environment files
├── metadata.json                    # Application metadata and system-level capabilities
├── package.json                     # Main dependencies, build and development scripts
├── server.ts                        # Full-stack Express server acting as an API gateway & Vite asset host
├── vite.config.ts                   # Bundling configuration with React support and Tailwind v4.x integration
├── public/                          # Static assets and PWA assets
│   ├── favicon.ico                  # Dynamic Vector Logo as an XML Favicon
│   ├── avatar-d.svg                 # Fallback dark avatar icon
│   ├── avatar-l.svg                 # Fallback light avatar icon
│   ├── no-data-found-d.svg          # Empty projects / items fallback (dark theme)
│   ├── no-data-found-l.svg          # Empty projects / items fallback (light theme)
│   ├── logo-and-loader.svg          # Integrated brand asset and loading indicator
│   └── pwa-app-icon.png             # Android/iOS launcher app icon
├── docs/
│   └── APP_SPECIFICATION.md         # This specification document
└── src/
    ├── main.tsx                     # Main client-side entry point
    ├── index.css                    # Tailwind v4.theme variables, fonts, and scrollbar modifications
    ├── App.tsx                      # Root component, handles layout, state tracking, and central routing
    ├── types/
    │   └── index.ts                 # Strongly-typed TypeScript interfaces and shared data schemas
    ├── utils/
    │   ├── auth-errors.ts           # Unified map of Firebase Authentication error handlers
    │   └── image.ts                 # In-browser client-side image compression helpers
    ├── stores/                      # Zustand State Management Stores
    │   ├── auth.store.ts            # Firebase session and profile metadata store
    │   ├── onboarding.store.ts      # Multi-step state machine for onboarding selections
    │   ├── toast.store.ts           # Floating notification dispatch and control store
    │   └── upload.store.ts          # Central state representing file uploads and drag/drop progress
    ├── services/                    # API Services & Firebase Interactions
    │   ├── firebase.ts              # Firebase Client SDK setup, database mapping, and error wrappers
    │   ├── auth.service.ts          # Client-side user authentication actions
    │   ├── user.service.ts          # User profile Firestore operations & subcollection secret handlers
    │   ├── project.service.ts       # Main CRUD logic for user designs and Express proxy Behance synchronization
    │   ├── design.service.ts        # Extended design collections and user publishing status updates
    │   ├── imageCompression.service.ts # File compression prior to Cloudinary transmission
    │   └── zipImport.service.ts     # Client-side ZIP extractor, thumbnail generation, and metadata mapping
    └── components/                  # Modular User Interface Components
        ├── Button.tsx               # Reusable stylized button component
        ├── NavBar.tsx               # Interactive mobile bottom navigation bar (Profile ↔ Projects)
        ├── Header.tsx               # Sidebar/Topbar with profile summary and theme controller
        ├── OnboardingFlow.tsx       # Six-step visual questionnaires prior to sign up
        ├── AuthWrapper.tsx          # Login, Sign Up, and Google Auth routing gates
        ├── ProfileSetupFlow.tsx     # Mandatory post-login avatar, bio, and portfolio link completing setup
        ├── DashboardView.tsx        # High-performance design cockpit featuring stats and integrations
        ├── ProjectsView.tsx         # Drag-and-drop projects canvas with live categorization filters
        ├── EditProfileModal.tsx     # Popup modal to edit biography, portfolio links, and connect Behance
        ├── LogoutConfirmModal.tsx   # Elegant popup modal to confirm active session destruction
        ├── PWAInstallPopup.tsx      # Post-login slide-up popup promoting Progressive Web App installations
        ├── SplashScreen.tsx         # Cinematic 6.5s brand intro sequence
        ├── LoadingState.tsx         # Unified visual preloader with pulsing states
        └── Toast.tsx                # Contextual floating notification alerts (Success, Error, Info)
```

---

## 2. Deep-Down Functional Module Specifications

### A. Core Navigation & Layout Engine (`src/App.tsx`)
The `App` component acts as the main orchestrator, managing high-level application state, system themes, and PWA prompts.

*   **Initialization Sequence:**
    1.  **Splash Screen (Cinematic Phase):** Rendered for **6.5 seconds** on initial visit using a pulsing SVG logo and an entrance sequence to simulate native mobile apps.
    2.  **Auth State Change Observer:** Once the splash completes, `onAuthStateChanged` listens to Firebase Auth.
        *   If **Authenticated**, it fetches the corresponding document in the `users` Firestore collection.
        *   If the user document doesn't exist, it uses the onboarding store results to compile and write a new profile in real-time.
        *   If the profile document is missing essential elements (`profileCompleted === false`), they are guided into the `ProfileSetupFlow`.
        *   If the profile is fully set, the user is navigated directly to the **Dashboard** (`currentPage === "profile"`).
        *   If **Unauthenticated**, they are sent to the `OnboardingFlow` coupled with `AuthWrapper`.
*   **Dual-View Routing Framework:**
    *   **Dashboard View ("profile"):** Houses profile details, user stats, Figma connection cards, Behance integration setup, and profile completion tracking.
    *   **Projects Canvas ("projects"):** Full-screen grid view showcasing uploaded creative designs, including draft states, publishing toggles, file detail expanders, and visual deletions.
*   **Responsive Desktop Sidebar & Mobile Bottom Nav:**
    *   **Mobile Mode:** Interactive `NavBar` mounts fixed at the bottom of the viewport with responsive touch-optimized layout (touch targets $\ge$ 48px).
    *   **Desktop Mode:** The layout automatically stretches via a persistent side navigation drawer handled within the `Header` layout.

---

### B. User Onboarding & Personalization State Machine (`src/components/OnboardingFlow.tsx`)
The onboarding flow is designed as a cinematic, multi-step slider sequence that captures the user's specific context before account creation.

*   **Step 1: Brand Greeting & Value Proposition:** Displays the responsive vector logo, quick features explanation, and a "Continue as @[LastUser]" shortcut if a local cache exists.
*   **Step 2: Professional Role Alignment:** Captures user profile classification:
    *   *Options:* UI Designer, UX Designer, Brand Designer, Graphic Designer, Product Designer, Developer, Student, Other.
*   **Step 3: Aesthetic Style Inspiration:** Multi-select visual layout requiring the user to select **between 3 and 10 visual cards**.
    *   *Styles:* Minimal, Brutalist, Neo Brutalist, Luxury, Editorial, Glassmorphism, Dark UI, Futuristic, Experimental, Corporate. Each option features a high-fidelity representative Unsplash thumbnail, title, and descriptive detail.
*   **Step 4: Design Formats Focus:** Selects interest categories (UI/UX, Posters, Banners, Packaging, Landing Pages, Dashboards, logos, etc.) to customize their target stream.
*   **Step 5: Goals Identification:** Objective-based selections (Get Feedback, Find Inspiration, Learn Design, Build Portfolio, Improve Skills).
*   **Step 6: Discovery Attribution:** Asks the user how they discovered Dzinr (Twitter/X, Behance, LinkedIn, Google, Discord, Friend, etc.).
*   **Step 7: Unified Auth Gateway:** Once Step 6 is filled, the "Get Started" button unlocks Step 7 inside the `AuthWrapper` allowing final account creation.

---

### C. Authentication & Access Gates (`src/components/AuthWrapper.tsx`)
The `AuthWrapper` encapsulates the login and registration UI, ensuring standard email/password inputs and federated Google single sign-on are securely handled.

*   **Slide-to-Switch Forms:** Fluid animations managed via `AnimatePresence` to toggle between registration and login forms.
*   **Last Logged In Memory Cache:** Read from `localStorage` under `dzinr_last_user`. If found, a dedicated quick-login button displays the user's cached custom avatar, full username, and auth provider icon. Clicking this triggers password input fields directly or runs automatic Google auth redirects.
*   **OAuth Integration Support:**
    *   **Google Sign-In:** Utilizes Firebase's `signInWithRedirect` and `GoogleAuthProvider`. Redirect callbacks are verified during app boot via `getRedirectResult`.
*   **Robust Input Validation & Error Diagnostics:**
    *   Enforces standard criteria (minimum 6 characters for passwords, valid email structures).
    *   Inputs show real-time error styles using the custom `#ff2d51` accent.
    *   Translates complex Firebase Auth raw codes (such as `auth/user-not-found` or `auth/wrong-password`) into clear, actionable human text via the `getFriendlyAuthError` utility.

---

### D. Comprehensive Profile Completion & Figma Integration (`src/components/ProfileSetupFlow.tsx`)
Upon initial account creation, the user must go through an interactive checklist screen if their profile is incomplete.

*   **Profile Completion Tracker:**
    *   Calculates completion score dynamically:
        *   `+20%` for basic account credentials (baseline).
        *   `+25%` for uploading a custom profile avatar.
        *   `+20%` for filling out a bio.
        *   `+35%` for linking a personal website or portfolio url.
    *   Provides a beautiful SVG progress ring on the left side of the dashboard displaying current completeness status.
*   **Figma Access Token Keychain Collection:**
    *   A restricted subcollection `user_secrets` is created inside Firestore to store third-party developer secrets securely.
    *   Security rules enforce that `user_secrets/{userId}` documents are only readable/writable by the authenticated user matching `{userId}`.
    *   Users can input their Figma Personal Access Token inside the integrations panel, or trigger the dedicated **Figma OAuth Flow** popup.

---

### E. Projects Canvas & Advanced File Handlers (`src/components/ProjectsView.tsx`)
This view provides the primary workshop where designers organize their portfolios, featuring custom drag-and-drop actions.

*   **Drag & Drop File Upload Deck:**
    *   Detects standard drops over the container, setting an active drag-over state.
    *   Validates files: accepts `.zip` archives, `.jpg`, `.jpeg`, `.png`, and `.webp` formats.
*   **Client-Side Image Compression Service:**
    *   For standard images, files are processed on-thread using the `imageCompression` helper.
    *   Compresses images exceeding 2MB down to efficient WebP formats with a maximum width of 2560px, balancing high-fidelity with fast load times.
*   **Frictionless ZIP Archive Importer:**
    *   If a user drops a `.zip` archive, the `zipImportService` handles extraction completely client-side.
    *   Utilizes `JSZip` to extract image archives.
    *   Automatically extracts image assets from the directory tree (ignoring hidden files and system folder artifacts).
    *   Creates separate local records for each extracted design, generating temporary object URLs for in-browser thumbnail generation.
    *   Allows the user to review bulk uploads, customize titles, fill out individual descriptions, tag categories, select drafts, and upload them in a single batch.
*   **Cloud-Native Image Storage (Cloudinary):**
    *   All validated and compressed images are uploaded directly to **Cloudinary** using an unauthenticated upload preset retrieved from environment variables.
    *   The service extracts the resulting Cloudinary payload. It splits the secure URL on the `/upload/` delimiter and injects optimization tags (`c_fill,w_600,h_600,q_auto,f_auto`) to generate a lightweight thumbnail URL automatically.
    *   Saves ONLY the final transformed URLs to Firestore documents.

---

### F. Real-Time Analytics & Portfolio Synchronization Dashboard (`src/components/DashboardView.tsx`)
The primary desktop view provides high-level control over the user's designer profile and connected platforms.

*   **Behance Live Sync Engine:**
    *   Allows designers to input their Behance username.
    *   Triggering the Behance Sync button calls the custom backend Express route: `/api/sync/behance?username={username}`.
    *   The server scrapes and parses the user's Behance RSS portfolio XML stream, extracting project titles, external links, categories, and direct thumbnail image paths.
    *   If direct scraping is blocked, it automatically falls back to an RSS-to-JSON public proxy parser.
    *   The frontend service receives the parsed JSON array of Behance items. It performs in-memory duplicate matching against existing Firestore documents. If any item is new, it automatically registers it inside the user's Firestore project directory.
*   **Interactive Modal Sheets:**
    *   **Edit Profile Modal:** Allows users to modify details (avatar uploads, bios, portfolio websites).
    *   **Logout Confirmation Modal:** Elegant high-contrast dialog displaying an overlay to prevent accidental session termination.

---

## 3. Full-Stack Server & OAuth Handlers (`server.ts`)

Since the AI Studio environment restricts CORS and client-side secrets, a dedicated Node.js Express server is built to handle third-party integrations.

### A. Endpoint Registry

| Method | Route | Description | Secure Secrets Used |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | Active health check route returning standard `"ok"` JSON payloads. | None |
| **GET** | `/api/auth/figma/url` | Compiles the official Figma OAuth client URL redirecting the user to grant workspace access. | `NEXT_PUBLIC_FIGMA_CLIENT_ID` |
| **GET** | `/api/auth/figma/callback` | Serves as the redirect URI callback. Handles authorization code exchanges, fetches authenticated handles from `api.figma.com/v1/me`, and sends post-messages back to the parent app window before closing. | `NEXT_PUBLIC_FIGMA_CLIENT_ID`, `NEXT_PUBLIC_FIGMA_CLIENT_SECRET` |
| **GET** | `/api/sync/behance` | Backend XML portfolio scraper. Parses Behance user feeds directly, extracts images, and falls back to JSON RSS proxy translators. | None |

---

## 4. State Management and Database Models

The app utilizes a divided state architecture. Server state and caching are managed via **TanStack Query** (React Query) to ensure real-time invalidation, while local interactive UI configurations are stored in **Zustand**.

### A. State Stores (Zustand)
1.  **`useAuthStore`:**
    *   `user`: Current active UserProfile object in Firestore.
    *   `firebaseUser`: The active raw Firebase User session.
    *   `loading`: Boolean representing page authentication pre-flight states.
    *   `onboardingRequired`: Determines whether to bypass registration and show the onboarding slides.
2.  **`useOnboardingStore`:**
    *   Tracks step indexes, user-selected roles, active arrays of design styles, goals, formats, and attribution sources.
3.  **`useToastStore`:**
    *   An array representing active, stackable visual notifications. Dispatches warning, error, and success messages with slide-out timers.

### B. Database Schemas (Firestore)

#### 1. Collection: `users`
*   **Document ID:** `{userId}` (Firebase Auth UID)
```json
{
  "id": "u4oH921jD...",
  "email": "designer@dzinr.app",
  "username": "dzinr_creative",
  "bio": "Minimalist digital product designer based in Tokyo.",
  "avatarUrl": "https://res.cloudinary.com/dzinr/image/upload/v12345/avatar.png",
  "role": "Product Designer",
  "inspirationStyles": ["Minimal", "Neo Brutalist", "Dark UI"],
  "preferredFormats": ["UI/UX", "Landing Pages", "Dashboards"],
  "goals": ["Get Feedback", "Build My Portfolio"],
  "discoverySource": "Twitter/X",
  "onboardingCompleted": true,
  "profileCompleted": true,
  "portfolioUrl": "https://dzinr.creative",
  "stats": {
    "uploadsCount": 12,
    "draftCount": 4,
    "publishedCount": 8
  },
  "createdAt": "2026-06-28T00:00:00Z"
}
```

#### 2. Collection: `designs`
*   **Document ID:** `project_{userId}_{timestamp}`
```json
{
  "id": "project_u4oH921jD_1719532800",
  "userId": "u4oH921jD...",
  "source": "zip",
  "sourceId": "extracted_file_01.png",
  "title": "Cosmic Slate Dashboard",
  "description": "High-contrast dark analytical interface designed for developer consoles.",
  "imageUrl": "https://res.cloudinary.com/dzinr/image/upload/v123456/cosmic_slate.png",
  "thumbnailUrl": "https://res.cloudinary.com/dzinr/image/upload/c_fill,w_600,h_600,q_auto,f_auto/v123456/cosmic_slate.png",
  "category": "Dashboards",
  "format": "UI/UX",
  "styles": ["Dark UI", "Futuristic"],
  "tags": ["SAAS", "Console", "Tailwind"],
  "status": "published",
  "imported": true,
  "createdAt": "2026-06-28T00:05:00Z",
  "updatedAt": "2026-06-28T00:05:00Z",
  "publishedAt": "2026-06-28T00:05:00Z",
  "stats": {
    "likes": 24,
    "dislikes": 1,
    "saves": 5,
    "score": 88
  }
}
```

#### 3. Collection: `user_secrets` (Restricted)
*   **Document ID:** `{userId}`
```json
{
  "figmaAccessToken": "fig_token_abc123xyz...",
  "updatedAt": "2026-06-28T00:10:00Z"
}
```

---

## 5. Precise Interactive UI Triggers

This section details exactly **when** and **where** modals and popups appear across the user journey.

### A. Modals Summary

| Modal Name | Triggering Component | When Does It Appear? |
| :--- | :--- | :--- |
| **Edit Profile Modal** | `DashboardView.tsx` | Appears when the user clicks the "Edit Profile" button on the dashboard cockpit. |
| **Logout Confirmation** | `App.tsx` / `DashboardView.tsx` | Appears when the user clicks the "Sign Out" button, either in the sidebar or mobile bottom nav. |
| **PWA Install Popup** | `App.tsx` | Automatically slides up from the bottom **1.5 seconds post-login** if the app is not installed and PWA installation criteria are met. |
| **Behance Sync Dialog** | `EditProfileModal.tsx` | Activates inline inside the modal when the user inputs a username and initiates a sync request. |
| **Figma OAuth Dialog** | `DashboardView.tsx` | Opens a secure external popup window when the "Connect Figma Account" integration is triggered. |

---

## 6. Theme and Visual System Setup

The visual layout of Dzinr is governed by a modern, high-contrast visual setup. It does not use generic gradients; it relies on sharp grids, deliberate negative space, and custom typography.

*   **Primary Fonts:**
    *   `Space Grotesk`: Selected for headers, titles, and branding, giving it a technical and high-signal look.
    *   `Inter`: Selected for user metadata, inputs, and descriptions to ensure maximum readability.
*   **Color Presets:**
    *   **Brand Accent Color:** `#ff2d51` (High-energy crimson pink)
    *   **Dark Theme Surface:** `#141414` (Deep neutral base) and `#1E1E1E` (Surface card backgrounds)
    *   **Light Theme Surface:** `#E5E5E5` (Light neutral base) and `#F0F0F0` (Surface card backgrounds)
    *   **Dark Neutral Background Fallback:** `#2b313f`
    *   **Light Neutral Background Fallback:** `#fcf5e2`
*   **Interactive Details:**
    *   **Accent Glow (`accent-glow`):** Custom high-contrast box-shadow highlighting selected onboarding items and primary buttons.
    *   **Bento Grid Patterns:** Custom CSS gradients creating pixel-perfect modular grid sheets (`bg-grid` and `bg-grid-light`).
    *   **Scrollbar Elimination:** Custom global style rules to clean up standard desktop scrollbars on interactive carousels, ensuring a sleek native-app feel on all devices.
