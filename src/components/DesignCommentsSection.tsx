import React, { useState, useEffect } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { discoveryService, DesignComment } from "../services/discovery.service";
import { Design } from "../services/design.service";
import { UserProfile } from "../types";

interface DesignCommentsSectionProps {
  design: Design;
  user: UserProfile | null;
  theme?: "light" | "dark";
  onCommentAdded?: () => void;
  onOpenProfile?: (userId: string) => void;
}

export const DesignCommentsSection: React.FC<DesignCommentsSectionProps> = ({
  design,
  user,
  theme = "dark",
  onCommentAdded,
  onOpenProfile,
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
    <div className={`pt-6 border-t ${
      theme === "dark" ? "border-white/5 text-white" : "border-neutral-100 text-[#171717]"
    }`}>
      {/* Header with modern label style */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-[#C90023] shrink-0" />
          <h4 className={`text-xs font-bold font-space uppercase tracking-wider ${
            theme === "dark" ? "text-neutral-200" : "text-[#171717]"
          }`}>
            Discussion
          </h4>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
            theme === "dark" ? "bg-white/10 text-neutral-300" : "bg-[#C90023]/10 text-[#C90023]"
          }`}>
            {commentsCount}
          </span>
        </div>
      </div>

      {/* Modern Seamless Comment Form */}
      <form onSubmit={handleSubmit} className="mb-6 relative">
        <div className={`rounded-xl border p-2 flex gap-2 items-center transition-all duration-300 ${
          theme === "dark"
            ? "bg-white/[0.03] border-white/5 focus-within:border-[#C90023]/60 focus-within:ring-2 focus-within:ring-[#C90023]/10 focus-within:bg-black/20"
            : "bg-neutral-50 border-neutral-200 focus-within:border-[#C90023]/60 focus-within:ring-2 focus-within:ring-[#C90023]/10 focus-within:bg-white"
        }`}>
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Share feedback or ask a question..."
            rows={1}
            className={`flex-1 bg-transparent px-2.5 py-2 text-xs resize-none outline-none font-sans leading-relaxed ${
              theme === "dark"
                ? "text-white placeholder:text-neutral-500"
                : "text-neutral-900 placeholder:text-neutral-400"
            }`}
            style={{ minHeight: "36px", maxHeight: "120px" }}
            onKeyDown={(e) => {
              // Submit on Enter (without shift key)
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={isSubmitting || !newCommentText.trim()}
            className="w-8 h-8 rounded-lg bg-[#C90023] hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-[#C90023] text-white transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-sm hover:scale-105 active:scale-95"
            title="Post comment"
          >
            {isSubmitting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Send size={13} className="ml-0.5" />
            )}
          </button>
        </div>
        {errorMsg && (
          <p className="text-[11px] text-red-500 mt-1.5 font-mono">{errorMsg}</p>
        )}
      </form>

      {/* Premium Comments Stream */}
      <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <div className={`text-center py-8 px-4 rounded-xl border border-dashed text-xs ${
            theme === "dark"
              ? "border-white/5 text-neutral-500 bg-white/[0.01]"
              : "border-neutral-200 text-neutral-400 bg-neutral-50"
          }`}>
            <p className="font-semibold font-space">No comments yet</p>
            <p className="text-[10px] opacity-75 mt-0.5">Be the first to share feedback on this creation.</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`flex gap-3 text-left transition-opacity duration-200 pb-3.5 border-b last:border-0 ${
                theme === "dark" ? "border-white/5" : "border-neutral-100"
              }`}
            >
              {/* User Avatar Column */}
              <div 
                onClick={() => onOpenProfile?.(comment.userId)}
                className={`shrink-0 ${onOpenProfile ? "cursor-pointer" : ""}`}
              >
                {comment.userAvatar ? (
                  <img
                    src={comment.userAvatar}
                    alt={comment.userName}
                    className="w-7 h-7 rounded-full object-cover border border-neutral-200 dark:border-white/10"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#C90023]/10 border border-[#C90023]/20 flex items-center justify-center text-[11px] font-bold text-[#C90023] font-space uppercase">
                    {comment.userName.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Text & Meta Column */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span 
                    onClick={() => onOpenProfile?.(comment.userId)}
                    className={`text-xs font-bold font-space truncate ${
                      onOpenProfile 
                        ? "cursor-pointer hover:text-[#C90023] hover:underline decoration-[#C90023]/40 transition-colors" 
                        : ""
                    } ${
                      theme === "dark" ? "text-neutral-100" : "text-neutral-800"
                    }`}
                  >
                    {comment.userName.startsWith("@") ? comment.userName : `@${comment.userName}`}
                  </span>
                  <span className={`text-[9px] font-mono opacity-60 ${
                    theme === "dark" ? "text-neutral-400" : "text-neutral-500"
                  }`}>
                    • {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>
                <p className={`text-xs leading-relaxed whitespace-pre-wrap mt-0.5 ${
                  theme === "dark" ? "text-neutral-300" : "text-neutral-600"
                }`}>
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
