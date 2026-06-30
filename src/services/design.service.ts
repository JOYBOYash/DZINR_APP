import { db, handleFirestoreError, OperationType } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

export interface DesignStats {
  likes?: number;
  dislikes?: number;
  leftSwipes?: number;
  rightSwipes?: number;
  saves: number;
  totalInteractions?: number;
  totalViews?: number;
  score: number;
  engagementRate?: number;
  confidence?: number;
  updatedAt?: string;
}

export const getSafeUserStats = (rawStats: any) => {
  const stats = rawStats || {};
  return {
    uploadsCount: typeof stats.uploadsCount === 'number' ? stats.uploadsCount : (typeof stats.uploads === 'number' ? stats.uploads : 0),
    draftCount: typeof stats.draftCount === 'number' ? stats.draftCount : 0,
    publishedCount: typeof stats.publishedCount === 'number' ? stats.publishedCount : 0,
  };
};

export interface Design {
  id: string;
  userId: string;
  source: "manual" | "portfolio" | "zip";
  sourceId: string | null;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  imageUrls?: string[]; // Support multiple photos per post
  category: string | null;
  format: string | null;
  styles: string[];
  tags: string[];
  status: "draft" | "published";
  imported: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  stats: DesignStats;
}

const deleteCloudinaryImage = async (url: string) => {
  try {
    await fetch("/api/cloudinary/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
  } catch (e) {
    console.warn("Failed to delete Cloudinary image", e);
  }
};

export const designService = {
  async getDesigns(userId: string): Promise<Design[]> {
    try {
      const q = query(collection(db, "designs"), where("userId", "==", userId));
      const snapshot = await getDocs(q);
      const designs: Design[] = [];
      snapshot.forEach((doc) =>
        designs.push({ id: doc.id, ...doc.data() } as Design),
      );
      designs.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      return designs;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "designs");
      return [];
    }
  },

  async createDesign(
    design: Omit<Design, "createdAt" | "updatedAt">,
  ): Promise<Design> {
    try {
      const now = new Date().toISOString();
      const newDesign: Design = {
        ...design,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(doc(db, "designs", design.id), newDesign);

      // Update stats
      try {
        const userRef = doc(db, "users", design.userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          const stats = getSafeUserStats(data.stats);
          await updateDoc(userRef, {
            stats: {
              ...stats,
              uploadsCount: stats.uploadsCount + 1,
              draftCount:
                design.status === "draft"
                  ? stats.draftCount + 1
                  : stats.draftCount,
              publishedCount:
                design.status === "published"
                  ? stats.publishedCount + 1
                  : stats.publishedCount,
            },
          });
        }
      } catch (e) {
        console.warn("Failed to update user stats on create", e);
      }

      return newDesign;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "designs");
      throw err;
    }
  },

  async updateDesign(id: string, updates: Partial<Design>): Promise<void> {
    try {
      const updatedData = { ...updates, updatedAt: new Date().toISOString() };
      await updateDoc(doc(db, "designs", id), updatedData);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `designs/${id}`);
      throw err;
    }
  },

  async deleteDesign(
    id: string,
    userId: string,
    status: "draft" | "published",
  ): Promise<void> {
    try {
      const designRef = doc(db, "designs", id);
      const designSnap = await getDoc(designRef);
      if (designSnap.exists()) {
        const designData = designSnap.data() as Design;
        const urlsToDelete = designData.imageUrls && designData.imageUrls.length > 0 
          ? designData.imageUrls 
          : [designData.imageUrl].filter(Boolean);
        
        for (const url of urlsToDelete) {
          if (url) await deleteCloudinaryImage(url);
        }
      }

      await deleteDoc(designRef);

      try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          const stats = getSafeUserStats(data.stats);
          await updateDoc(userRef, {
            stats: {
              ...stats,
              draftCount:
                status === "draft"
                  ? Math.max(0, stats.draftCount - 1)
                  : stats.draftCount,
              publishedCount:
                status === "published"
                  ? Math.max(0, stats.publishedCount - 1)
                  : stats.publishedCount,
              uploadsCount: Math.max(0, stats.uploadsCount - 1),
            },
          });
        }
      } catch (e) {
        console.warn("Failed to update user stats on delete", e);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `designs/${id}`);
      throw err;
    }
  },

  async deleteDesigns(ids: string[], userId: string, status: "draft" | "published"): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const id of ids) {
        const designRef = doc(db, "designs", id);
        const designSnap = await getDoc(designRef);
        if (designSnap.exists()) {
          const designData = designSnap.data() as Design;
          const urlsToDelete = designData.imageUrls && designData.imageUrls.length > 0 
            ? designData.imageUrls 
            : [designData.imageUrl].filter(Boolean);
          
          for (const url of urlsToDelete) {
            if (url) await deleteCloudinaryImage(url);
          }
        }
        batch.delete(designRef);
      }

      try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          const stats = getSafeUserStats(data.stats);
          batch.update(userRef, {
            stats: {
              ...stats,
              draftCount: status === "draft" ? Math.max(0, stats.draftCount - ids.length) : stats.draftCount,
              publishedCount: status === "published" ? Math.max(0, stats.publishedCount - ids.length) : stats.publishedCount,
              uploadsCount: Math.max(0, stats.uploadsCount - ids.length),
            }
          });
        }
      } catch (e) {
        console.warn("Failed to prepare stats update", e);
      }
      
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, "designs");
      throw err;
    }
  },

  async publishDrafts(ids: string[], userId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();
      for (const id of ids) {
        batch.update(doc(db, "designs", id), {
          status: "published",
          publishedAt: now,
          updatedAt: now,
        });
      }

      // Update stats
      try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          const stats = getSafeUserStats(data.stats);
          batch.update(userRef, {
            stats: {
              ...stats,
              draftCount: Math.max(0, stats.draftCount - ids.length),
              publishedCount: stats.publishedCount + ids.length,
            },
          });
        }
      } catch (e) {
        console.warn("Failed to prepare stats update", e);
      }

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "designs");
      throw err;
    }
  },
};
