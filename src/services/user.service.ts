import { db, handleFirestoreError, OperationType } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { UserProfile } from '../types';

export const userService = {
  /**
   * Fetches the user profile document from Firestore.
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${userId}`);
      return null;
    }
  },

  /**
   * Creates a new user profile document in Firestore.
   */
  async createUserProfile(profile: UserProfile): Promise<void> {
    try {
      const docRef = doc(db, 'users', profile.id);
      await setDoc(docRef, profile);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${profile.id}`);
    }
  },

  /**
   * Updates an existing user profile document in Firestore.
   */
  async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, data);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  },

  /**
   * Checks if a username is already taken.
   */
  async isUsernameTaken(username: string): Promise<boolean> {
    try {
      const normalizedUsername = username.trim().toLowerCase();
      if (!normalizedUsername) return false;

      const usersRef = collection(db, 'users');
      // Simple exact match inquiry
      const q = query(
        usersRef, 
        where('username', '==', normalizedUsername),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'users');
      return false;
    }
  },

  /**
   * Checks if a profile with the given email exists in Firestore.
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) return false;
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('email', '==', normalizedEmail),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (err) {
      console.warn("Could not check email existence in Firestore:", err);
      return false;
    }
  },

  /**
   * Saves a user secret securely in a restricted separate collection.
   */
  async saveUserSecret(userId: string, secretData: { figmaAccessToken?: string }): Promise<void> {
    try {
      const docRef = doc(db, 'user_secrets', userId);
      await setDoc(docRef, secretData, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `user_secrets/${userId}`);
    }
  },

  /**
   * Retrieves a user secret. Only readable by the authenticated owner.
   */
  async getUserSecret(userId: string): Promise<{ figmaAccessToken?: string } | null> {
    try {
      const docRef = doc(db, 'user_secrets', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as { figmaAccessToken?: string };
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `user_secrets/${userId}`);
      return null;
    }
  },

  /**
   * Deletes a user profile and stores their email in a deleted collection.
   */
  async deleteAccount(userId: string, email: string, surveyFeedback?: any): Promise<void> {
    try {
      // 1. Grab avatarUrl before deletion and delete from Cloudinary
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.avatarUrl) {
          try {
            const { cloudinaryService } = await import('./cloudinary.service');
            await cloudinaryService.deleteImage(data.avatarUrl);
          } catch (cloudErr) {
            console.warn("Could not delete avatar image from Cloudinary during account deletion:", cloudErr);
          }
        }
      }

      // 2. Add email to deleted collection
      const deletedRef = doc(db, 'deleted', userId);
      await setDoc(deletedRef, {
        email: email || "anonymous@dzinr.com",
        deletedAt: new Date().toISOString(),
        ...(surveyFeedback ? { surveyFeedback } : {})
      });

      // 3. Delete user's projects and their images from Cloudinary
      try {
        const { projectService } = await import('./project.service');
        const userProjects = await projectService.getProjects(userId);
        
        for (const project of userProjects) {
          try {
            await projectService.deleteProject(project.id);
          } catch (projErr) {
            console.warn(`Could not delete project ${project.id} during account deletion:`, projErr);
          }
        }
      } catch (projectsErr) {
        console.warn("Could not retrieve user projects during account deletion:", projectsErr);
      }

      // 4. Delete user secrets if they exist
      const secretRef = doc(db, 'user_secrets', userId);
      const { deleteDoc } = await import('firebase/firestore');
      try {
        await deleteDoc(secretRef);
      } catch (secretErr) {
        console.warn("Could not delete user secrets (they may not exist):", secretErr);
      }

      // 5. Delete the user profile document from Firestore
      await deleteDoc(userRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
    }
  }
};
