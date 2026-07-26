import React, { useState } from "react";
import { X, Lock, Globe, Users, Plus, Trash2 } from "lucide-react";
import { Button } from "./Button";

interface CreateMoodboardModalProps {
  show: boolean;
  theme: "dark" | "light";
  onClose: () => void;
  onCreate: (name: string, description: string, privacy: "public" | "private" | "shared", collaborators: string[]) => void;
}

export const CreateMoodboardModal: React.FC<CreateMoodboardModalProps> = ({
  show,
  theme,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "private" | "shared">("private");
  const [collabInput, setCollabInput] = useState("");
  const [collaborators, setCollaborators] = useState<string[]>([]);

  if (!show) return null;

  const handleAddCollaborator = () => {
    const username = collabInput.trim().replace(/^@/, "").toLowerCase();
    if (username && !collaborators.includes(username)) {
      setCollaborators([...collaborators, username]);
      setCollabInput("");
    }
  };

  const handleRemoveCollaborator = (username: string) => {
    setCollaborators(collaborators.filter((c) => c !== username));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim(), privacy, collaborators);
    setName("");
    setDescription("");
    setPrivacy("private");
    setCollaborators([]);
    setCollabInput("");
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
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

        <h3 className="text-lg font-bold font-space mb-4 uppercase tracking-wide">
          Create Moodboard
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Name Field */}
          <div>
            <label className={`block text-[11px] font-mono uppercase tracking-wider mb-1.5 ${
              theme === "dark" ? "text-neutral-400" : "text-neutral-500"
            }`}>
              Moodboard Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Warm brutalism inspiration"
              className={`w-full px-4 py-3 rounded-xl border text-sm font-sans focus:outline-none transition-all ${
                theme === "dark"
                  ? "bg-black/20 border-white/10 text-white focus:border-accent"
                  : "bg-neutral-50 border-neutral-200 text-[#171717] focus:border-accent"
              }`}
            />
          </div>

          {/* Description Field */}
          <div>
            <label className={`block text-[11px] font-mono uppercase tracking-wider mb-1.5 ${
              theme === "dark" ? "text-neutral-400" : "text-neutral-500"
            }`}>
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the aesthetic direction, layout patterns, or overall vibe..."
              rows={2}
              className={`w-full px-4 py-3 rounded-xl border text-sm font-sans focus:outline-none transition-all resize-none ${
                theme === "dark"
                  ? "bg-black/20 border-white/10 text-white focus:border-accent"
                  : "bg-neutral-50 border-neutral-200 text-[#171717] focus:border-accent"
              }`}
            />
          </div>

          {/* Privacy Field */}
          <div>
            <label className={`block text-[11px] font-mono uppercase tracking-wider mb-1.5 ${
              theme === "dark" ? "text-neutral-400" : "text-neutral-500"
            }`}>
              Privacy & Settings
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPrivacy("private")}
                className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                  privacy === "private"
                    ? "border-[#C90023] bg-[#C90023]/10 text-white"
                    : theme === "dark"
                      ? "border-white/5 bg-white/5 hover:bg-white/10 text-neutral-300"
                      : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-600"
                }`}
              >
                <Lock size={15} className={privacy === "private" ? "text-accent" : ""} />
                <span className="text-[10px] font-mono uppercase tracking-wide">Private</span>
              </button>

              <button
                type="button"
                onClick={() => setPrivacy("public")}
                className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                  privacy === "public"
                    ? "border-[#C90023] bg-[#C90023]/10 text-white"
                    : theme === "dark"
                      ? "border-white/5 bg-white/5 hover:bg-white/10 text-neutral-300"
                      : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-600"
                }`}
              >
                <Globe size={15} className={privacy === "public" ? "text-accent" : ""} />
                <span className="text-[10px] font-mono uppercase tracking-wide">Public</span>
              </button>

              <button
                type="button"
                onClick={() => setPrivacy("shared")}
                className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                  privacy === "shared"
                    ? "border-[#C90023] bg-[#C90023]/10 text-white"
                    : theme === "dark"
                      ? "border-white/5 bg-white/5 hover:bg-white/10 text-neutral-300"
                      : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-600"
                }`}
              >
                <Users size={15} className={privacy === "shared" ? "text-accent" : ""} />
                <span className="text-[10px] font-mono uppercase tracking-wide">Shared</span>
              </button>
            </div>
            <p className={`text-[10px] font-sans mt-2 ${
              theme === "dark" ? "text-neutral-400" : "text-neutral-500"
            }`}>
              {privacy === "private" && "Only you can see and add designs to this moodboard."}
              {privacy === "public" && "Visible on your public designer profile. Anyone can view."}
              {privacy === "shared" && "Collaborators you add can view and add designs in real-time."}
            </p>
          </div>

          {/* Collaborator Input for Shared Privacy */}
          {privacy === "shared" && (
            <div className="space-y-2 animate-fadeIn">
              <label className={`block text-[11px] font-mono uppercase tracking-wider mb-1 ${
                theme === "dark" ? "text-neutral-400" : "text-neutral-500"
              }`}>
                Add Collaborators
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={collabInput}
                  onChange={(e) => setCollabInput(e.target.value)}
                  placeholder="e.g., designer_jane"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCollaborator();
                    }
                  }}
                  className={`flex-1 px-3 py-2 rounded-xl border text-xs font-sans focus:outline-none transition-all ${
                    theme === "dark"
                      ? "bg-black/20 border-white/10 text-white focus:border-accent"
                      : "bg-neutral-50 border-neutral-200 text-[#171717] focus:border-accent"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddCollaborator}
                  className="px-3 rounded-xl bg-accent hover:bg-accent/90 text-white flex items-center justify-center transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Collaborators List */}
              {collaborators.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {collaborators.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono bg-accent/10 border border-accent/20 text-accent"
                    >
                      @{c}
                      <button
                        type="button"
                        onClick={() => handleRemoveCollaborator(c)}
                        className="text-accent/60 hover:text-accent transition-colors shrink-0"
                      >
                        <X size={10} className="stroke-[3]" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="pt-2 flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 font-bold text-sm uppercase tracking-wide"
            >
              Create Board
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
