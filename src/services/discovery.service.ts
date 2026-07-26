import { db, handleFirestoreError, OperationType } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  onSnapshot,
} from "firebase/firestore";
import { UserProfile } from "../types";
import { Design } from "./design.service";

export interface DesignComment {
  id: string;
  designId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export interface SwipeRecord {
  id: string;
  userId: string;
  designId: string;
  action: "left" | "right" | "save";
  createdAt: string;
}

export interface UserFeedHistory {
  userId: string;
  viewedDesignIds: string[];
  lastSeen: string;
  sessionId: string;
}

export interface CreatorMetrics {
  totalReviews: number;
  rightSwipes: number;
  saves: number;
  currentScore: number;
  reviewVelocity: number; // calculated as reviews per day or a score of activity
}

export const discoveryService = {
  /**
   * Fetches the user's feed history from Firestore to know what has been viewed.
   */
  async getUserFeedHistory(userId: string): Promise<UserFeedHistory | null> {
    try {
      const docRef = doc(db, "userFeedHistory", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserFeedHistory;
      }
      return null;
    } catch (err) {
      console.warn("Failed to fetch user feed history:", err);
      return null;
    }
  },

  /**
   * Appends a viewed design ID to the user's feed history.
   */
  async addToFeedHistory(userId: string, designId: string): Promise<void> {
    try {
      const docRef = doc(db, "userFeedHistory", userId);
      const history = await this.getUserFeedHistory(userId);

      const viewedDesignIds = history ? [...history.viewedDesignIds] : [];
      if (!viewedDesignIds.includes(designId)) {
        viewedDesignIds.push(designId);
      }

      await setDoc(
        docRef,
        {
          userId,
          viewedDesignIds,
          lastSeen: new Date().toISOString(),
          sessionId: history?.sessionId || Math.random().toString(36).substring(7),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("Failed to update user feed history:", err);
    }
  },

  /**
   * Fetches a batch of candidate designs for the discovery feed.
   * Leverages startAfter for cursor-pagination.
   * Then filters out: own posts, already viewed posts.
   * Finally, ranks them by matching categories, tags, styles, formats, cold-start windows, and quality.
   */
  async getDiscoveryFeed(
    user: UserProfile,
    lastVisibleDoc: DocumentSnapshot | null = null,
    batchSize: number = 20
  ): Promise<{ designs: Design[]; lastDoc: DocumentSnapshot | null }> {
    try {
      // 1. Fetch user's history of swiped designs
      const history = await this.getUserFeedHistory(user.id);
      const viewedSet = new Set(history?.viewedDesignIds || []);

      // 1.5. Fetch creators followed by the user
      const followedCreatorIds = new Set<string>();
      try {
        const followsQuery = query(
          collection(db, "follows"),
          where("followerId", "==", user.id)
        );
        const followsSnap = await getDocs(followsQuery);
        followsSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.followedId) {
            followedCreatorIds.add(data.followedId);
          }
        });
      } catch (err) {
        console.warn("Failed to fetch followed creators for feed curation:", err);
      }

      // 2. Query designs collection (No orderBy constraint to avoid requiring a composite index)
      let q = query(
        collection(db, "designs"),
        where("status", "==", "published"),
        limit(150) // fetch a larger candidate pool to filter on client
      );

      const snapshot = await getDocs(q);
      let candidates: Design[] = [];
      let lastDoc: DocumentSnapshot | null = null;

      if (!snapshot.empty) {
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        snapshot.forEach((docSnap) => {
          candidates.push({ id: docSnap.id, ...docSnap.data() } as Design);
        });
      }

      // Sort candidate designs by publishedAt descending in-memory
      candidates.sort((a, b) => {
        const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return timeB - timeA;
      });

      // 3. Filter candidates
      const filtered = candidates.filter((design) => {
        // Exclude own posts
        if (design.userId === user.id) return false;
        // Exclude already viewed/swiped/saved
        if (viewedSet.has(design.id)) return false;
        return true;
      });

      // 4. Rank candidates
      const ranked = filtered.map((design) => {
        let rankScore = 0;

        // Followed creators boost: massive weight to ensure they appear in the feed
        if (followedCreatorIds.has(design.userId)) {
          rankScore += 100;
        }

        // Ensure safe stats object structure
        const stats = (design.stats || {}) as any;
        const totalInteractions =
          (stats.leftSwipes || 0) + (stats.rightSwipes || 0) + (stats.saves || 0);

        // Cold Start Distribution:
        // Newly published designs with under 50 total reviews get a massive exposure boost
        if (totalInteractions < 50) {
          rankScore += 25; // Massive boost for cold-start exploration
        }

        // Onboarding preferences alignment
        // Matching styles
        if (design.styles && Array.isArray(design.styles)) {
          const matchingStyles = design.styles.filter((s) =>
            user.inspirationStyles?.includes(s)
          ).length;
          rankScore += matchingStyles * 4;
        }

        // Matching formats
        if (design.format && user.preferredFormats?.includes(design.format)) {
          rankScore += 6;
        }

        // Matching category with onboarding role alignment (e.g., UI/UX matches UI/UX category)
        if (design.category && user.role) {
          const normalizedRole = user.role.toLowerCase();
          const normalizedCategory = design.category.toLowerCase();
          if (
            normalizedRole.includes(normalizedCategory) ||
            normalizedCategory.includes(normalizedRole)
          ) {
            rankScore += 5;
          }
        }

        // Design quality / score (Designs with high scores get higher weight)
        const designScore = stats.score || 0;
        rankScore += designScore * 10;

        // Recency boost (Designs posted in the last 48 hours get a boost)
        const ageMs = Date.now() - new Date(design.publishedAt || design.createdAt).getTime();
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        if (ageDays <= 2) {
          rankScore += 12;
        } else if (ageDays <= 7) {
          rankScore += 6;
        }

        // Slight randomization (0 to 3 points) to keep the feed fresh
        rankScore += Math.random() * 3;

        return { design, rankScore };
      });

      // Sort by rankScore descending
      ranked.sort((a, b) => b.rankScore - a.rankScore);

      // Take only up to batchSize
      const resultDesigns = ranked.slice(0, batchSize).map((item) => item.design);

      return {
        designs: resultDesigns,
        lastDoc,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "discovery_feed");
      return { designs: [], lastDoc: null };
    }
  },

  /**
   * Tracks and increments total views for a design.
   */
  async incrementDesignView(designId: string): Promise<void> {
    try {
      const designRef = doc(db, "designs", designId);
      const designSnap = await getDoc(designRef);
      if (designSnap.exists()) {
        const data = designSnap.data() as Design;
        const stats = (data.stats || {}) as any;

        const totalViews = (stats.totalViews || 0) + 1;
        const totalInteractions =
          (stats.leftSwipes || 0) + (stats.rightSwipes || 0) + (stats.saves || 0);
        const engagementRate = totalViews > 0 ? totalInteractions / totalViews : 0;

        try {
          await updateDoc(designRef, {
            "stats.totalViews": totalViews,
            "stats.engagementRate": engagementRate,
            "stats.updatedAt": new Date().toISOString(),
          });
        } catch (updateErr: any) {
          if (updateErr?.code !== "permission-denied" && !updateErr?.message?.includes("permission")) {
            console.warn(`Failed to update design view stats for ${designId}:`, updateErr);
          }
        }
      }
    } catch (err: any) {
      if (err?.code !== "permission-denied" && !err?.message?.includes("permission")) {
        console.warn(`Failed to increment views on design ${designId}:`, err);
      }
    }
  },

  /**
   * Records a user swipe interaction ("left", "right", "save") in Firestore swipes collection,
   * updates the design's aggregate stats, and appends the design ID to user feed history.
   */
  async recordInteraction(
    userId: string,
    designId: string,
    action: "left" | "right" | "save"
  ): Promise<void> {
    try {
      // 1. Save Swipe document using specific id to avoid duplicates
      const swipeId = `${userId}_${designId}`;
      const swipeRef = doc(db, "swipes", swipeId);
      const swipeDoc = await getDoc(swipeRef);
      
      if (swipeDoc.exists()) {
        return; // No duplicate swipes allowed
      }

      await setDoc(swipeRef, {
        id: swipeId,
        userId,
        designId,
        action,
        createdAt: new Date().toISOString(),
      });

      // 2. Update designs stats collection
      const designRef = doc(db, "designs", designId);
      const designSnap = await getDoc(designRef);
      if (designSnap.exists()) {
        const designData = designSnap.data() as Design;
        const stats = (designData.stats || {}) as any;

        let leftSwipes = stats.leftSwipes || 0;
        let rightSwipes = stats.rightSwipes || 0;
        let saves = stats.saves || 0;

        if (action === "left") leftSwipes += 1;
        if (action === "right") rightSwipes += 1;
        if (action === "save") saves += 1;

        const totalInteractions = leftSwipes + rightSwipes + saves;
        const totalViews = Math.max(totalInteractions, stats.totalViews || 0);

        // Score Algorithm Version 1:
        // WeightedScore = (Right * 1 + Save * 3) / TotalInteractions
        const score = totalInteractions > 0 ? (rightSwipes * 1 + saves * 3) / totalInteractions : 0;
        const engagementRate = totalViews > 0 ? (rightSwipes + saves) / totalViews : 0;
        
        // Simple statistical confidence metric (converges to 1.0 as interactions hit 50 reviews)
        const confidence = Math.min(1.0, totalInteractions / 50);

        try {
          await updateDoc(designRef, {
            stats: {
              leftSwipes,
              rightSwipes,
              saves,
              totalInteractions,
              totalViews,
              score,
              engagementRate,
              confidence,
              updatedAt: new Date().toISOString(),
            },
          });
        } catch (statsErr: any) {
          if (statsErr?.code !== "permission-denied" && !statsErr?.message?.includes("permission")) {
            console.warn(`Failed to update aggregate design stats for ${designId}:`, statsErr);
          }
        }
      }

      // 3. Append to User Feed History so the card is never suggested again
      await this.addToFeedHistory(userId, designId);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `swipes/${userId}_${designId}`);
    }
  },

  /**
   * Checks if a user has liked a specific design.
   */
  async checkIfUserLikedDesign(userId: string, designId: string): Promise<boolean> {
    if (!userId || !designId) return false;
    try {
      const likeId = `${userId}_${designId}`;
      const likeRef = doc(db, "likes", likeId);
      const likeSnap = await getDoc(likeRef);
      if (likeSnap.exists()) return true;

      // Fallback check in swipes collection for right swipe
      const swipeRef = doc(db, "swipes", likeId);
      const swipeSnap = await getDoc(swipeRef);
      if (swipeSnap.exists() && swipeSnap.data().action === "right") {
        return true;
      }
      return false;
    } catch (err) {
      console.warn("checkIfUserLikedDesign check error:", err);
      return false;
    }
  },

  /**
   * Toggles like status for a design by the current user.
   */
  async toggleLikeDesign(userId: string, designId: string): Promise<{ liked: boolean; newCount: number }> {
    if (!userId || !designId) throw new Error("User ID and Design ID are required");
    try {
      const likeId = `${userId}_${designId}`;
      const likeRef = doc(db, "likes", likeId);
      const likeSnap = await getDoc(likeRef);
      
      const designRef = doc(db, "designs", designId);
      const designSnap = await getDoc(designRef);

      let isLiked = false;
      let newCount = 0;

      if (designSnap.exists()) {
        const data = designSnap.data() as Design;
        const stats = (data.stats || {}) as any;
        const currentLikes = stats.likes || stats.rightSwipes || 0;

        if (likeSnap.exists()) {
          // Remove like
          await deleteDoc(likeRef);
          newCount = Math.max(0, currentLikes - 1);
          isLiked = false;
        } else {
          // Add like
          await setDoc(likeRef, {
            id: likeId,
            userId,
            designId,
            createdAt: new Date().toISOString(),
          });
          newCount = currentLikes + 1;
          isLiked = true;
        }

        try {
          await updateDoc(designRef, {
            "stats.likes": newCount,
            "stats.rightSwipes": newCount,
            "stats.updatedAt": new Date().toISOString(),
          });
        } catch (updateErr) {
          console.warn("Failed to update design likes count:", updateErr);
        }
      }

      return { liked: isLiked, newCount };
    } catch (err) {
      console.error("Failed to toggle like on design:", err);
      throw err;
    }
  },

  /**
   * Computes creator portfolio metrics from their designs.
   */
  async getCreatorMetrics(userId: string): Promise<CreatorMetrics> {
    try {
      const q = query(
        collection(db, "designs"),
        where("userId", "==", userId),
        where("status", "==", "published")
      );
      const snapshot = await getDocs(q);

      let totalReviews = 0;
      let rightSwipes = 0;
      let saves = 0;
      let scoreSum = 0;
      let designsCount = 0;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const stats = data.stats || {};
        totalReviews += (stats.leftSwipes || 0) + (stats.rightSwipes || 0) + (stats.saves || 0);
        rightSwipes += stats.rightSwipes || 0;
        saves += stats.saves || 0;
        scoreSum += stats.score || 0;
        designsCount += 1;
      });

      // Simple activity metric for velocity
      const averageScore = designsCount > 0 ? scoreSum / designsCount : 0;
      const reviewVelocity = designsCount > 0 ? totalReviews / designsCount : 0;

      return {
        totalReviews,
        rightSwipes,
        saves,
        currentScore: parseFloat(averageScore.toFixed(2)),
        reviewVelocity: parseFloat(reviewVelocity.toFixed(1)),
      };
    } catch (err) {
      console.warn("Failed to compute creator metrics:", err);
      return {
        totalReviews: 0,
        rightSwipes: 0,
        saves: 0,
        currentScore: 0,
        reviewVelocity: 0,
      };
    }
  },

  /**
   * Fetches all designs swiped as 'save' by the specified user.
   */
  async getUserSavedDesigns(userId: string): Promise<Design[]> {
    try {
      const q = query(
        collection(db, "swipes"),
        where("userId", "==", userId),
        where("action", "==", "save")
      );
      const snapshot = await getDocs(q);
      const designIds = snapshot.docs.map((docSnap) => docSnap.data().designId as string);
      
      if (designIds.length === 0) return [];
      
      const designs: Design[] = [];
      const chunks: string[][] = [];
      for (let i = 0; i < designIds.length; i += 30) {
        chunks.push(designIds.slice(i, i + 30));
      }
      
      for (const chunk of chunks) {
        const designsQuery = query(
          collection(db, "designs"),
          where("id", "in", chunk)
        );
        const designsSnap = await getDocs(designsQuery);
        designsSnap.forEach((docSnap) => {
          designs.push({ id: docSnap.id, ...docSnap.data() } as Design);
        });
      }
      
      return designs;
    } catch (err) {
      console.warn("Failed to fetch user saved designs:", err);
      return [];
    }
  },

  /**
   * Deletes a user's swipe record to unsave/remove from inspirations archive.
   */
  async unsaveDesign(userId: string, designId: string): Promise<void> {
    try {
      const swipeId = `${userId}_${designId}`;
      const swipeRef = doc(db, "swipes", swipeId);
      await deleteDoc(swipeRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `swipes/${userId}_${designId}`);
    }
  },

  /**
   * Listens to real-time changes in the user's saved designs.
   */
  subscribeUserSavedDesigns(userId: string, callback: (designs: Design[]) => void): () => void {
    const q = query(
      collection(db, "swipes"),
      where("userId", "==", userId),
      where("action", "==", "save")
    );

    return onSnapshot(q, async (snapshot) => {
      const designIds = snapshot.docs.map((docSnap) => docSnap.data().designId as string);
      if (designIds.length === 0) {
        callback([]);
        return;
      }

      try {
        const designs: Design[] = [];
        const chunks: string[][] = [];
        for (let i = 0; i < designIds.length; i += 30) {
          chunks.push(designIds.slice(i, i + 30));
        }
        
        for (const chunk of chunks) {
          const designsQuery = query(
            collection(db, "designs"),
            where("id", "in", chunk)
          );
          const designsSnap = await getDocs(designsQuery);
          designsSnap.forEach((docSnap) => {
            designs.push({ id: docSnap.id, ...docSnap.data() } as Design);
          });
        }
        callback(designs);
      } catch (err) {
        console.warn("Failed to update saved designs subscription:", err);
      }
    }, (err) => {
      console.warn("Saved designs onSnapshot failed:", err);
    });
  },

  /**
   * Subscribes to real-time creator metrics based on their published designs.
   */
  subscribeCreatorMetrics(userId: string, callback: (metrics: CreatorMetrics) => void): () => void {
    const q = query(
      collection(db, "designs"),
      where("userId", "==", userId),
      where("status", "==", "published")
    );

    return onSnapshot(q, (snapshot) => {
      let totalReviews = 0;
      let rightSwipes = 0;
      let saves = 0;
      let scoreSum = 0;
      let designsCount = 0;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const stats = data.stats || {};
        totalReviews += (stats.leftSwipes || 0) + (stats.rightSwipes || 0) + (stats.saves || 0);
        rightSwipes += stats.rightSwipes || 0;
        saves += stats.saves || 0;
        scoreSum += stats.score || 0;
        designsCount += 1;
      });

      const averageScore = designsCount > 0 ? scoreSum / designsCount : 0;
      const reviewVelocity = designsCount > 0 ? totalReviews / designsCount : 0;

      callback({
        totalReviews,
        rightSwipes,
        saves,
        currentScore: parseFloat(averageScore.toFixed(2)),
        reviewVelocity: parseFloat(reviewVelocity.toFixed(1)),
      });
    }, (err) => {
      console.warn("subscribeCreatorMetrics onSnapshot error:", err);
    });
  },

  /**
   * Creates a new moodboard in Firestore.
   */
  async createMoodboard(
    userId: string,
    name: string,
    privacy: "public" | "private" | "shared",
    creatorName: string,
    collaboratorIds: string[] = [],
    description: string = "",
    coverUrl: string = ""
  ): Promise<any> {
    try {
      const id = "moodboard_" + Math.random().toString(36).substring(2, 15);
      const moodboardRef = doc(db, "moodboards", id);
      const newMoodboard = {
        id,
        name,
        description,
        coverUrl,
        creatorId: userId,
        creatorName,
        privacy,
        designIds: [],
        collaboratorIds,
        createdAt: new Date().toISOString(),
      };
      await setDoc(moodboardRef, newMoodboard);
      return newMoodboard;
    } catch (err) {
      console.error("Failed to create moodboard:", err);
      throw err;
    }
  },

  /**
   * Subscribes to moodboards for the user (created by them OR shared with them as collaborator).
   */
  subscribeUserMoodboards(userId: string, callback: (moodboards: any[]) => void): () => void {
    const q = query(
      collection(db, "moodboards")
    );

    return onSnapshot(q, (snapshot) => {
      const moodboards: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (
          data.creatorId === userId || 
          (data.privacy === "shared" && data.collaboratorIds?.includes(userId))
        ) {
          moodboards.push(data);
        }
      });
      moodboards.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(moodboards);
    }, (err) => {
      console.warn("subscribeUserMoodboards onSnapshot error:", err);
    });
  },

  /**
   * Adds or removes a design to/from a moodboard.
   */
  async toggleDesignInMoodboard(moodboardId: string, designId: string): Promise<boolean> {
    try {
      const docRef = doc(db, "moodboards", moodboardId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const designIds = data.designIds || [];
        const exists = designIds.includes(designId);
        let updatedIds: string[];
        if (exists) {
          updatedIds = designIds.filter((id: string) => id !== designId);
        } else {
          updatedIds = [...designIds, designId];
        }
        await updateDoc(docRef, { designIds: updatedIds });
        return !exists; // returns true if added, false if removed
      }
      return false;
    } catch (err) {
      console.error("Failed to toggle design in moodboard:", err);
      throw err;
    }
  },

  /**
   * Deletes a moodboard.
   */
  async deleteMoodboard(moodboardId: string): Promise<void> {
    try {
      const docRef = doc(db, "moodboards", moodboardId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Failed to delete moodboard:", err);
      throw err;
    }
  },

  /**
   * Updates moodboard details.
   */
  async updateMoodboardPrivacy(moodboardId: string, privacy: "public" | "private" | "shared", collaboratorIds: string[] = []): Promise<void> {
    try {
      const docRef = doc(db, "moodboards", moodboardId);
      await updateDoc(docRef, { privacy, collaboratorIds });
    } catch (err) {
      console.error("Failed to update moodboard privacy:", err);
      throw err;
    }
  },

  /**
   * Updates any custom moodboard details.
   */
  async updateMoodboard(
    moodboardId: string,
    updates: {
      name?: string;
      description?: string;
      privacy?: "public" | "private" | "shared";
      collaboratorIds?: string[];
      coverUrl?: string;
    }
  ): Promise<void> {
    try {
      const docRef = doc(db, "moodboards", moodboardId);
      await updateDoc(docRef, updates);
    } catch (err) {
      console.error("Failed to update moodboard:", err);
      throw err;
    }
  },

  /**
   * Set a design's primary style.
   */
  async setDesignPrimaryStyle(designId: string, style: string): Promise<void> {
    try {
      const docRef = doc(db, "designs", designId);
      await updateDoc(docRef, { primaryStyle: style });
    } catch (err) {
      console.error("Failed to set design primary style:", err);
      throw err;
    }
  },

  /**
   * Adds a text comment to a design and updates its commentsCount.
   */
  async addDesignComment(
    designId: string,
    userId: string,
    userName: string,
    userAvatar: string,
    content: string
  ): Promise<DesignComment> {
    try {
      const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const commentRef = doc(db, "design_comments", commentId);
      const newComment: DesignComment = {
        id: commentId,
        designId,
        userId,
        userName: userName || "Anonymous Designer",
        userAvatar: userAvatar || "",
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };

      await setDoc(commentRef, newComment);

      // Increment commentsCount in design stats
      const designRef = doc(db, "designs", designId);
      const designSnap = await getDoc(designRef);
      if (designSnap.exists()) {
        const designData = designSnap.data() as Design;
        const stats = (designData.stats || {}) as any;
        const commentsCount = (stats.commentsCount || 0) + 1;
        
        await updateDoc(designRef, {
          "stats.commentsCount": commentsCount,
          "stats.updatedAt": new Date().toISOString(),
        });
      }

      return newComment;
    } catch (err) {
      console.error("Failed to post comment:", err);
      throw err;
    }
  },

  /**
   * Subscribes to real-time comments for a given design.
   */
  subscribeDesignComments(
    designId: string,
    callback: (comments: DesignComment[]) => void
  ) {
    try {
      const q = query(
        collection(db, "design_comments"),
        where("designId", "==", designId),
        orderBy("createdAt", "asc")
      );
      return onSnapshot(
        q,
        (snapshot) => {
          const comments: DesignComment[] = snapshot.docs.map((d) => d.data() as DesignComment);
          callback(comments);
        },
        (err) => {
          console.warn("Realtime comments error, falling back to empty array:", err);
          callback([]);
        }
      );
    } catch (err) {
      console.warn("Failed to subscribe to design comments:", err);
      callback([]);
      return () => {};
    }
  },
};
