import { db, handleFirestoreError, OperationType } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  updateDoc
} from "firebase/firestore";

export interface BadgeTier {
  level: number;
  name: string;
  thresholdValue: number;
  description: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  thresholdType: "comments" | "swipes" | "saves" | "follows" | "uploads";
  tiers: BadgeTier[];
}

export interface UserBadgeProgress {
  badge: Badge;
  currentValue: number;
  unlockedTiers: BadgeTier[];
  nextTier: BadgeTier | null;
  highestUnlockedTier: BadgeTier | null;
}

const DEFAULT_BADGES: Badge[] = [
  {
    id: "frequent_contributor",
    name: "Frequent Contributor",
    description: "Upload pristine design mockups and layout drafts.",
    icon: "Layers",
    color: "emerald",
    thresholdType: "uploads",
    tiers: [
      { level: 1, name: "Bronze Contributor", thresholdValue: 1, description: "Uploaded 1 design asset." },
      { level: 2, name: "Silver Contributor", thresholdValue: 3, description: "Uploaded 3 design assets." },
      { level: 3, name: "Gold Contributor", thresholdValue: 8, description: "Uploaded 8 design assets." },
      { level: 4, name: "Platinum Contributor", thresholdValue: 15, description: "Uploaded 15 design assets." }
    ]
  },
  {
    id: "top_reviewer",
    name: "Top Reviewer",
    description: "Provide constructive aesthetic criticism.",
    icon: "MessageSquare",
    color: "indigo",
    thresholdType: "comments",
    tiers: [
      { level: 1, name: "Bronze Reviewer", thresholdValue: 1, description: "Left 1 design comment." },
      { level: 2, name: "Silver Reviewer", thresholdValue: 3, description: "Left 3 design comments." },
      { level: 3, name: "Gold Reviewer", thresholdValue: 7, description: "Left 7 design comments." },
      { level: 4, name: "Platinum Reviewer", thresholdValue: 12, description: "Left 12 design comments." }
    ]
  },
  {
    id: "aesthetic_curator",
    name: "Aesthetic Curator",
    description: "Swipe to curate inspiration on the live feed.",
    icon: "Sparkles",
    color: "rose",
    thresholdType: "swipes",
    tiers: [
      { level: 1, name: "Bronze Curator", thresholdValue: 5, description: "Swiped 5 designs." },
      { level: 2, name: "Silver Curator", thresholdValue: 15, description: "Swiped 15 designs." },
      { level: 3, name: "Gold Curator", thresholdValue: 40, description: "Swiped 40 designs." },
      { level: 4, name: "Platinum Curator", thresholdValue: 100, description: "Swiped 100 designs." }
    ]
  },
  {
    id: "inspiration_collector",
    name: "Inspiration Collector",
    description: "Save designs to build custom creative directories.",
    icon: "Bookmark",
    color: "amber",
    thresholdType: "saves",
    tiers: [
      { level: 1, name: "Bronze Collector", thresholdValue: 2, description: "Saved 2 designs." },
      { level: 2, name: "Silver Collector", thresholdValue: 5, description: "Saved 5 designs." },
      { level: 3, name: "Gold Collector", thresholdValue: 12, description: "Saved 12 designs." },
      { level: 4, name: "Platinum Collector", thresholdValue: 30, description: "Saved 30 designs." }
    ]
  },
  {
    id: "style_connector",
    name: "Style Connector",
    description: "Follow creative minds across the platform.",
    icon: "Smile",
    color: "cyan",
    thresholdType: "follows",
    tiers: [
      { level: 1, name: "Bronze Connector", thresholdValue: 1, description: "Followed 1 fellow designer." },
      { level: 2, name: "Silver Connector", thresholdValue: 2, description: "Followed 2 fellow designers." },
      { level: 3, name: "Gold Connector", thresholdValue: 5, description: "Followed 5 fellow designers." },
      { level: 4, name: "Platinum Connector", thresholdValue: 10, description: "Followed 10 fellow designers." }
    ]
  }
];

export const badgeService = {
  /**
   * Seeds default badges into Firestore if they don't exist yet.
   */
  async seedBadges(): Promise<void> {
    try {
      const badgesCol = collection(db, "badges");
      const snap = await getDocs(badgesCol);
      if (snap.empty) {
        console.log("Seeding default badges with tiers...");
        for (const badge of DEFAULT_BADGES) {
          await setDoc(doc(db, "badges", badge.id), badge);
        }
      }
    } catch (err) {
      console.warn("Could not seed badges automatically (maybe offline or permissions issue):", err);
    }
  },

  /**
   * Fetches all badge definitions from the Firestore badges collection.
   */
  async getBadges(): Promise<Badge[]> {
    try {
      await this.seedBadges(); // Auto-seed if empty
      const badgesCol = collection(db, "badges");
      const snap = await getDocs(badgesCol);
      if (snap.empty) {
        return DEFAULT_BADGES; // Fallback
      }
      return snap.docs.map(doc => doc.data() as Badge);
    } catch (err) {
      console.warn("Failed to get badges from DB, using memory fallback:", err);
      return DEFAULT_BADGES;
    }
  },

  /**
   * Calculates dynamic tiered badge progress for a user based on real activity counts.
   */
  async calculateUserBadges(userId: string, userProfile: any): Promise<UserBadgeProgress[]> {
    if (!userId) return [];
    try {
      const badges = await this.getBadges();
      
      // 1. Fetch live metrics from real collections
      let uploadsCount = 0;
      try {
        const designsSnap = await getDocs(
          query(collection(db, "designs"), where("userId", "==", userId))
        );
        uploadsCount = designsSnap.size;
      } catch (e) {
        uploadsCount = userProfile?.stats?.uploadsCount || 0;
      }

      let commentsCount = 0;
      try {
        const commentsSnap = await getDocs(
          query(collection(db, "design_comments"), where("userId", "==", userId))
        );
        commentsCount = commentsSnap.size;
      } catch (e) {
        console.warn("Error fetching comments count for badges:", e);
      }

      let swipesCount = 0;
      try {
        const swipesSnap = await getDocs(
          query(collection(db, "swipes"), where("userId", "==", userId))
        );
        swipesCount = swipesSnap.size;
      } catch (e) {
        console.warn("Error fetching swipes count for badges:", e);
      }

      let savesCount = 0;
      try {
        const savesSnap = await getDocs(
          query(
            collection(db, "swipes"),
            where("userId", "==", userId),
            where("action", "==", "save")
          )
        );
        savesCount = savesSnap.size;
      } catch (e) {
        console.warn("Error fetching saves count for badges:", e);
      }

      let followsCount = 0;
      try {
        const followsSnap = await getDocs(
          query(collection(db, "follows"), where("followerId", "==", userId))
        );
        followsCount = followsSnap.size;
      } catch (e) {
        console.warn("Error fetching follows count for badges:", e);
      }

      // Map tiered progress
      const progressList: UserBadgeProgress[] = badges.map(badge => {
        let currentValue = 0;
        switch (badge.thresholdType) {
          case "uploads":
            currentValue = uploadsCount;
            break;
          case "comments":
            currentValue = commentsCount;
            break;
          case "swipes":
            currentValue = swipesCount;
            break;
          case "saves":
            currentValue = savesCount;
            break;
          case "follows":
            currentValue = followsCount;
            break;
        }

        // Sort tiers just in case
        const sortedTiers = [...badge.tiers].sort((a, b) => a.thresholdValue - b.thresholdValue);
        
        const unlockedTiers = sortedTiers.filter(t => currentValue >= t.thresholdValue);
        const highestUnlockedTier = unlockedTiers.length > 0 ? unlockedTiers[unlockedTiers.length - 1] : null;
        const nextTier = sortedTiers.find(t => currentValue < t.thresholdValue) || null;

        return {
          badge,
          currentValue,
          unlockedTiers,
          highestUnlockedTier,
          nextTier
        };
      });

      // 2. Cache highest tier names back to user's earnedBadges array
      const earnedBadgeIds = progressList
        .filter(p => p.highestUnlockedTier !== null)
        .map(p => `${p.badge.id}:${p.highestUnlockedTier!.level}`);

      const cachedEarnedBadges = userProfile?.earnedBadges || [];
      const hasChanges =
        earnedBadgeIds.length !== cachedEarnedBadges.length ||
        earnedBadgeIds.some(id => !cachedEarnedBadges.includes(id));

      if (hasChanges) {
        try {
          const userRef = doc(db, "users", userId);
          await updateDoc(userRef, { earnedBadges: earnedBadgeIds });
        } catch (updateErr) {
          console.warn("Failed to update cached earnedBadges on user doc:", updateErr);
        }
      }

      return progressList;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `badges_calculation/${userId}`);
      return [];
    }
  }
};
