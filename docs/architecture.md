# ARCHITECTURAL DESIGNS & SYSTEM DIRECTORIES

Dzinr utilizes a modular separation of concerns following our strict architecture directives:

## Folder Organization

- `public/`: Standalone PWA configurations, manifest files, icon bundles, and the background Service Worker thread.
- `src/components/`: Pure functional visual building blocks (such as `Button`, `Input`, and `LoadingState`).
- `src/services/`: Isolated infrastructure adapters:
  - `firebase.ts`: Database configuration and client hooks.
  - `auth.service.ts`: Sign up/in routines.
  - `user.service.ts`: Query triggers for Firestore users collections.
- `src/stores/`: Zustand client-side triggers (like active log indices, dialog controls, and transient auth sessions).
- `src/types/`: Base interfaces (such as `UserProfile`).

## State Management Flow

1. **Session State**: Held in `useAuthStore` to control application view shells.
2. **Persistence State**: Synced using standard client-server handlers (via Firebase onAuthStateChanged).
3. **Database Caching**: Ready to compile complex queries via TanStack React Query inside Layer 2.
