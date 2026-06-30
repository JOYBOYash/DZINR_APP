import { db, handleFirestoreError, OperationType } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
} from "firebase/firestore";
import { UserProfile } from "../types";
import { Design } from "./design.service";

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

      // 2. Query designs collection
      let q = query(
        collection(db, "designs"),
        where("status", "==", "published"),
        orderBy("publishedAt", "desc"),
        limit(50) // fetch a larger candidate pool to filter on client
      );

      if (lastVisibleDoc) {
        q = query(
          collection(db, "designs"),
          where("status", "==", "published"),
          orderBy("publishedAt", "desc"),
          startAfter(lastVisibleDoc),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      const candidates: Design[] = [];
      let lastDoc: DocumentSnapshot | null = null;

      if (!snapshot.empty) {
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        snapshot.forEach((docSnap) => {
          candidates.push({ id: docSnap.id, ...docSnap.data() } as Design);
        });
      }

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

        await updateDoc(designRef, {
          "stats.totalViews": totalViews,
          "stats.engagementRate": engagementRate,
          "stats.updatedAt": new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn(`Failed to increment views on design ${designId}:`, err);
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
        console.log("User already swiped on this design.");
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
      }

      // 3. Append to User Feed History so the card is never suggested again
      await this.addToFeedHistory(userId, designId);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `swipes/${userId}_${designId}`);
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
};
