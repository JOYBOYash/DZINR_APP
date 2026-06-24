export interface UserProfile {
  id: string;
  email: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  role: string;
  inspirationStyles: string[];
  preferredFormats: string[];
  goals: string[];
  discoverySource: string;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  firebaseUser: any | null; // Raw Firebase Auth object
  loading: boolean;
  onboardingRequired: boolean;
  error: string | null;
}
