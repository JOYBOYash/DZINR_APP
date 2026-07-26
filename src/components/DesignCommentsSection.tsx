import React, { useState, useEffect } from "react";
import { MessageSquare, Heart, Send, Loader2, Sparkles } from "lucide-react";
import { discoveryService, DesignComment } from "../services/discovery.service";
import { Design } from "../services/design.service";
import { UserProfile } from "../types";

interface DesignCommentsSectionProps {
  design: Design;
  user: UserProfile | null;
  theme?: "light" | "dark";
  onCommentAdded?: () => void;
}

export const DesignCommentsSection: React.FC<DesignCommentsSectionProps> = ({
  design,
  user,
  theme = "dark",
  onCommentAdded,
}) => {
  const [comments, setComments] = useState<DesignComment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Subscribe to real-time comments for this design
  useEffect(() => {
    if (!design?.id) return;
    const unsubscribe = discoveryService.subscribeDesignComments(design.id, (fetchedComments) => {
      setComments(fetchedComments);
    });
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [design?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    if (!user) {
      setErrorMsg("Please sign in to post feedback.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await discoveryService.addDesignComment(
        design.id,
        user.id,
        user.displayName || user.email?.split("@")[0] || "Designer",
        user.photoURL || "",
        newCommentText
      );
      setNewCommentText("");
      onCommentAdded?.();
    } catch (err) {
      console.error(err);
      setErrorMsg("Could not post comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 30) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return "recently";
    }
  };

  const commentsCount = comments.length > 0 ? comments.length : (design.stats?.commentsCount || 0);

  return (
    <div className={`pt-4 border-t ${
      theme === "dark" ? "border-white/10 text-white" : "border-neutral-200 text-[#171717]"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-[#C90023] shrink-0" />
          <h4 className={`text-xs font-bold font-space uppercase tracking-wider ${
            theme === "dark" ? "text-white" : "text-[#171717]"
          }`}>
            Comments ({commentsCount})
          </h4>
        </div>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-5 relative">
        <div className={`rounded-2xl border p-2 flex flex-col gap-2 transition-all ${
          theme === "dark"
            ? "bg-black/30 border-white/10 focus-within:border-[#C90023]"
            : "bg-neutral-50 border-neutral-200 focus-within:border-[#C90023]"
        }`}>
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Write a comment..."
            rows={2}
            className={`w-full bg-transparent px-2 py-1 text-xs resize-none outline-none font-sans leading-relaxed ${
              theme === "dark"
                ? "text-white placeholder:text-neutral-500"
                : "text-neutral-900 placeholder:text-neutral-400"
            }`}
          />
          <div className="flex items-center justify-end pt-1 border-t border-dashed border-neutral-200 dark:border-white/10">
            <button
              type="submit"
              disabled={isSubmitting || !newCommentText.trim()}
              className="p-2 rounded-xl bg-[#C90023] hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-[#C90023] text-white transition-all cursor-pointer flex items-center justify-center"
              title="Post comment"
            >
              {isSubmitting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Send size={13} />
              )}
            </button>
          </div>
        </div>
        {errorMsg && (
          <p className="text-[11px] text-red-500 mt-1 font-mono">{errorMsg}</p>
        )}
      </form>

      {/* Comments List */}
      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <div className={`text-center py-6 px-4 rounded-2xl border border-dashed text-xs ${
            theme === "dark"
              ? "border-white/10 text-neutral-400 bg-white/[0.02]"
              : "border-neutral-200 text-neutral-500 bg-neutral-50"
          }`}>
            <p className="font-medium">No comments yet.</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">Be the first to share text feedback on this design!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-2xl border transition-colors ${
                theme === "dark"
                  ? "bg-white/5 border-white/10 hover:border-white/20 text-white"
                  : "bg-white border-neutral-200 hover:border-neutral-300 text-neutral-900 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#C90023]/20 border border-[#C90023]/40 flex items-center justify-center text-[10px] font-bold text-[#C90023] font-space uppercase shrink-0">
                    {comment.userName.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold font-space truncate">
                    {comment.userName}
                  </span>
                </div>
                <span className={`text-[10px] font-mono shrink-0 ${
                  theme === "dark" ? "text-neutral-400" : "text-neutral-500"
                }`}>
                  {formatRelativeTime(comment.createdAt)}
                </span>
              </div>
              <p className={`text-xs leading-relaxed whitespace-pre-wrap pl-7 ${
                theme === "dark" ? "text-neutral-300" : "text-neutral-700"
              }`}>
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
