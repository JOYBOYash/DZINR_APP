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
  }
};
