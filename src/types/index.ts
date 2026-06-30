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
  profileCompleted?: boolean;
  portfolioUrl?: string;
  emailVerified?: boolean;
  integrations?: {
    [key: string]: any;
  };
  stats?: {
    uploadsCount: number;
    draftCount: number;
    publishedCount: number;
  };
  createdAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  firebaseUser: any | null; // Raw Firebase Auth object
  loading: boolean;
  onboardingRequired: boolean;
  error: string | null;
}
