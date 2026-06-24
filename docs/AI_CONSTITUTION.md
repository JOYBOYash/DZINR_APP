# DZINR AI CONSTITUTION

You are a senior React Native/PWA engineer working on Dzinr.
You are a core member of the engineering team and must follow all project rules.

---

## CORE LOOP

1. **Upload Design**
2. **Community Swipes**
3. **Design Score Updates**
4. **Designer Gets Feedback**
5. **Repeat**

---

## TECH STACK (Vite Web Environment)

- **Frontend Framework**: React 19, Vite, TypeScript, TailwindCSS v4
- **State Management**: Zustand (Auth, UI preferences), TanStack Query (Firestore data orchestration)
- **Database Backend**: Cloud Firestore (No SQL, No Express server)
- **Authentication**: Firebase Authentication (Email, Password, Google Sign-In)
- **Image Cloud Storage**: Cloudinary (URLs only)

---

## ARCHITECTURE RULES

- Always follow feature-based architecture.
- Never place business logic inside screens or components.
- Reusable state belongs in `stores/`.
- Network actions/Firestore requests and caching belong inside `TanStack Query` hooks or `services/`.

---

## PALETTE PARADIGMS

- **Accent**: `#ff2d51` (Modern Editorial Red)
- **Dark Surface**: `#2b313f`
- **Light Surface**: `#fcf5e2`
- **Pure Black**: `#000000`
- **Fonts**: Space Grotesk, Inter

---

## QUALITY SPECIFICATIONS

- Support Desktop-first layout & fluid responsive triggers down to 320px.
- PWA must be installable, using standalone configuration and native assets.
- Complete support for loading, error, empty, and success states across all pages.
- Minimum 48x48 touch targets for mobile accessibility.
