import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const getEnv = (key: string): string | undefined => {
  const value = (import.meta as any).env[`NEXT_PUBLIC_${key}`] || 
                (import.meta as any).env[`VITE_${key}`] ||
                (import.meta as any).env[`NEXT_PUBLIC_FIREBASE_${key}`] ||
                (import.meta as any).env[`VITE_FIREBASE_${key}`] ||
                (import.meta as any).env[key];
  if (!value) return undefined;
  
  // Clean up any potential copy-paste syntax artifacts (e.g. trailing commas or wrapping quotes)
  let cleanValue = value.trim();
  if (cleanValue.endsWith(',')) {
    cleanValue = cleanValue.slice(0, -1).trim();
  }
  if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) || 
      (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
    cleanValue = cleanValue.slice(1, -1).trim();
  }
  return cleanValue;
};

const customApiKey = getEnv("API_KEY");
const customAuthDomain = getEnv("AUTH_DOMAIN");
const customProjectId = getEnv("PROJECT_ID");
const customStorageBucket = getEnv("STORAGE_BUCKET");
const customMessagingSenderId = getEnv("MESSAGING_SENDER_ID");
const customAppId = getEnv("APP_ID");

const firebaseConfig = {
  apiKey: customApiKey || "",
  authDomain: customAuthDomain || "",
  projectId: customProjectId || "",
  storageBucket: customStorageBucket || "",
  messagingSenderId: customMessagingSenderId || "",
  appId: customAppId || ""
};

// Initialize app instance
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Determine Firestore Database ID
// If the user specified their own custom Firebase Project, use their standard default database.
// Otherwise, fall back to our development database ID.
const isCustomFirebase = !!customProjectId;
const customDbId = getEnv("FIREBASE_FIRESTORE_DATABASE_ID");
const defaultDevDbId = "ai-studio-32268a8c-7b51-4c92-959c-6beac9779af2";

export const db = isCustomFirebase
  ? (customDbId ? getFirestore(app, customDbId) : getFirestore(app))
  : (customDbId !== undefined
      ? (customDbId ? getFirestore(app, customDbId) : getFirestore(app))
      : getFirestore(app, defaultDevDbId)
    );

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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

