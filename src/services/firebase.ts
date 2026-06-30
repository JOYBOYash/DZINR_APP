import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const cleanEnv = (value: any): string | undefined => {
  if (!value) return undefined;
  let cleanValue = String(value).trim();
  if (cleanValue.endsWith(',')) {
    cleanValue = cleanValue.slice(0, -1).trim();
  }
  if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) || 
      (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
    cleanValue = cleanValue.slice(1, -1).trim();
  }
  return cleanValue || undefined;
};

const customApiKey = cleanEnv((import.meta as any).env.NEXT_PUBLIC_API_KEY);
const customAuthDomain = cleanEnv((import.meta as any).env.NEXT_PUBLIC_AUTH_DOMAIN);
const customProjectId = cleanEnv((import.meta as any).env.NEXT_PUBLIC_PROJECT_ID);
const customStorageBucket = cleanEnv((import.meta as any).env.NEXT_PUBLIC_STORAGE_BUCKET);
const customMessagingSenderId = cleanEnv((import.meta as any).env.NEXT_PUBLIC_MESSAGING_SENDER_ID);
const customAppId = cleanEnv((import.meta as any).env.NEXT_PUBLIC_APP_ID);

const firebaseConfig = {
  apiKey: customApiKey,
  authDomain: customAuthDomain,
  projectId: customProjectId,
  storageBucket: customStorageBucket,
  messagingSenderId: customMessagingSenderId,
  appId: customAppId
};

// Initialize app instance
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Determine Firestore Database ID
const customDbId = cleanEnv((import.meta as any).env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID);

export const db = customDbId ? getFirestore(app, customDbId) : getFirestore(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Firestore Error [${operationType}] at ${path}: ${errorMessage}`);
  throw new Error(errorMessage);
}

