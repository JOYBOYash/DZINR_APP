import { auth, googleProvider } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signInWithRedirect, 
  signOut as firebaseSignOut 
} from 'firebase/auth';

export const authService = {
  /**
   * Signs up a user using Email and Password.
   */
  async signUpWithEmail(email: string, password: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (err: any) {
      console.error('Email sign up error:', err);
      throw err;
    }
  },

  /**
   * Signs in a user using Email and Password.
   */
  async signInWithEmail(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (err: any) {
      console.error('Email sign in error:', err);
      throw err;
    }
  },

  /**
   * Initiates Google Sign-In. Falling back to Redirect if Popups are restricted by the iframe sandbox.
   */
  async signInWithGoogle() {
    try {
      // First attempt popup sign-in
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err: any) {
      console.warn('Google Popup blocked or failed. Attempting Google Redirect fallback...', err);
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectErr: any) {
        console.error('Google Redirect also failed:', redirectErr);
        throw redirectErr;
      }
    }
  },

  /**
   * Signs the active user out of the active session.
   */
  async logout() {
    try {
      await firebaseSignOut(auth);
    } catch (err: any) {
      console.error('Sign out error:', err);
      throw err;
    }
  }
};
