import { auth, googleProvider } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signInWithRedirect, 
  signOut as firebaseSignOut,
  applyActionCode
} from 'firebase/auth';

export const authService = {
  async verifyEmailCode(code: string) {
    try {
      await applyActionCode(auth, code);
      return { success: true };
    } catch (err: any) {
      console.error("Email verification code error:", err);
      throw err;
    }
  },
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
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        throw err; // Re-throw so the UI can show the retry popup
      }
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
  },

  /**
   * Generates and sends a custom email verification link using our SMTP backend.
   */
  async sendCustomVerificationEmail(email: string) {
    try {
      const response = await fetch("/api/auth/send-verification-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errData;
        try {
          errData = JSON.parse(text);
        } catch (e) {
          throw new Error("Failed to parse response: " + text.substring(0, 100));
        }
        throw new Error(errData.error || "Failed to send custom verification email.");
      }

      return await response.json();
    } catch (err: any) {
      throw err;
    }
  }
};
