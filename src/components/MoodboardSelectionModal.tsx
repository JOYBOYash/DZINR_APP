import React, { useState } from "react";
import { X, Lock, Globe, Users, Plus, Check, FolderPlus } from "lucide-react";
import { Button } from "./Button";
import { discoveryService } from "../services/discovery.service";

interface MoodboardSelectionModalProps {
  show: boolean;
  theme: "dark" | "light";
  designId: string;
  designTitle: string;
  moodboards: any[];
  onClose: () => void;
  onOpenCreateModal: () => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

export const MoodboardSelectionModal: React.FC<MoodboardSelectionModalProps> = ({
  show,
  theme,
  designId,
  designTitle,
  moodboards,
  onClose,
  onOpenCreateModal,
  showToast,
}) => {
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  if (!show) return null;

  const handleToggle = async (moodboardId: string, moodboardName: string) => {
    setLoadingMap((prev) => ({ ...prev, [moodboardId]: true }));
    try {
      const added = await discoveryService.toggleDesignInMoodboard(moodboardId, designId);
      if (added) {
        showToast(`Added design to moodboard "${moodboardName}"!`, "success");
      } else {
        showToast(`Removed design from moodboard "${moodboardName}".`, "info");
      }
    } catch (err) {
      console.error(err);
      showToast("Could not update moodboard. Try again.", "error");
    } finally {
      setLoadingMap((prev) => ({ ...prev, [moodboardId]: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div 
        className={`relative w-full max-w-md rounded-3xl p-6 shadow-2xl border transition-all duration-300 ${
          theme === "dark"
            ? "bg-surface-dark border-white/10 text-white"
            : "bg-white border-neutral-200 text-[#171717]"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-full border transition-colors ${
            theme === "dark"
              ? "border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white"
              : "border-neutral-200 hover:bg-neutral-50 text-neutral-500 hover:text-[#171717]"
          }`}
        >
          <X size={16} />
        </button>

        <h3 className="text-lg font-bold font-space mb-2 uppercase tracking-wide text-left">
          Save to Moodboard
        </h3>
        
        <p className={`text-xs font-sans mb-4 text-left line-clamp-1 ${
          theme === "dark" ? "text-neutral-400" : "text-neutral-500"
        }`}>
          Saving: <span className="font-semibold text-accent">{designTitle}</span>
        </p>

        {/* Moodboards List */}
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 mb-6">
          {moodboards.length === 0 ? (
            <div className={`py-8 text-center flex flex-col items-center justify-center border border-dashed rounded-2xl ${
              theme === "dark" ? "border-white/10 text-neutral-400" : "border-neutral-200 text-neutral-500"
            }`}>
              <FolderPlus size={32} className="mb-2 text-accent/50" />
              <p className="text-xs font-sans mb-3">You don't have any moodboards yet.</p>
              <button
                onClick={() => {
                  onOpenCreateModal();
                }}
                className="text-xs font-mono font-bold text-[#888888] hover:text-accent uppercase tracking-widest cursor-pointer transition-colors"
              >
                Create your first board
              </button>
            </div>
          ) : (
            moodboards.map((board) => {
              const isSaved = board.designIds?.includes(designId);
              const isLoading = loadingMap[board.id];

              return (
                <button
                  key={board.id}
                  disabled={isLoading}
                  onClick={() => handleToggle(board.id, board.name)}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isSaved
                      ? theme === "dark"
                        ? "border-[#C90023]/40 bg-[#C90023]/5 text-white"
                        : "border-[#C90023]/30 bg-[#C90023]/5 text-[#171717]"
                      : theme === "dark"
                        ? "border-white/5 bg-white/5 hover:bg-white/10 text-neutral-300"
                        : "border-neutral-100 bg-neutral-50 hover:bg-neutral-100 text-neutral-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${
                      theme === "dark" ? "bg-white/5" : "bg-white border"
                    }`}>
                      {board.privacy === "private" && <Lock size={14} className="text-neutral-400" />}
                      {board.privacy === "public" && <Globe size={14} className="text-accent" />}
                      {board.privacy === "shared" && <Users size={14} className="text-blue-400" />}
                    </div>
                    <div>
                      <span className="text-sm font-bold font-space block truncate max-w-[200px]">
                        {board.name}
                      </span>
                      <span className={`text-[9px] font-mono block ${
                        theme === "dark" ? "text-neutral-400" : "text-neutral-500"
                      }`}>
                        {board.designIds?.length || 0} items • {board.privacy}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center shrink-0">
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    ) : isSaved ? (
                      <div className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                    ) : (
                      <div className={`w-5 h-5 rounded-full border ${
                        theme === "dark" ? "border-white/25" : "border-neutral-300"
                      }`} />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-2 flex gap-3">
          <Button
            variant="secondary"
            className="flex-1 flex items-center justify-center gap-2 text-xs uppercase font-bold tracking-wide"
            onClick={onOpenCreateModal}
          >
            <FolderPlus size={14} />
            <span>New Board</span>
          </Button>
          <Button
            className="flex-1 text-xs uppercase font-bold tracking-wide"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
