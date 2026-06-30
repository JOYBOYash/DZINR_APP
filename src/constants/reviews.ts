export interface UserReview {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  comment: string;
  rating: number;
}

export const USER_REVIEWS: UserReview[] = [
  {
    id: "review-1",
    name: "Sarah Jenkins",
    role: "Lead UI/UX Designer at Figma Studio",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    comment: "Dzinr transformed our design feedback loops. Instead of long, unfocused meetings, we get high-signal, micro-feedback on layouts within minutes. The gamified scoring keeps our designers inspired.",
    rating: 5,
  },
  {
    id: "review-2",
    name: "Marcus Aurelius",
    role: "Senior Product Designer",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    comment: "I love how easy it is to upload and instantly benchmark my concepts against top-tier aesthetic tastes. Having a mobile-first swipe feed makes reviewing UI incredibly fast and satisfying.",
    rating: 5,
  },
  {
    id: "review-3",
    name: "Eléna Rostova",
    role: "Independent Creative Director",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    comment: "The precision in Dzinr's focus on layouts, spacing, and styling helps us fine-tune before handoff. It's a goldmine of clean design references and constructive feedback.",
    rating: 5,
  },
  {
    id: "review-4",
    name: "Alexei Novak",
    role: "Freelance UI Developer",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    comment: "The community here has the sharpest eyes. I get honest, actionable critiques that push my designs to the next level.",
    rating: 5,
  },
  {
    id: "review-5",
    name: "Chloe Chen",
    role: "Visual Designer",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
    comment: "Finally, an app that gets it. The swiping mechanism is brilliant for quickly reviewing and gathering inspiration from top creators.",
    rating: 5,
  },
  {
    id: "review-6",
    name: "David Kim",
    role: "Product Manager",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
    comment: "As a PM, Dzinr helps me understand what makes a good layout. The scores provide a quantitative measure for subjective aesthetics.",
    rating: 4,
  },
  {
    id: "review-7",
    name: "Mia Patel",
    role: "UX Researcher",
    avatarUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&q=80",
    comment: "The insights I glean from the community's reactions to different design patterns are invaluable for our product development.",
    rating: 5,
  }
];

export const DESIGN_QUOTES = [
  {
    quote: "Design is not just what it looks like and feels like. Design is how it works under the scrutiny of visual rhythm.",
    author: "Dzinr Philosophy"
  },
  {
    quote: "Benchmark your layouts, build your visual confidence, and master the art of pixel-perfect alignment.",
    author: "Dzinr Mindset"
  }
];
