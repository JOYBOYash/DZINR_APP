import React from "react";
import { ConfirmationModal } from "./ConfirmationModal";

interface LogoutConfirmModalProps {
  show: boolean;
  theme: "dark" | "light";
  user: any;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  show,
  theme,
  user,
  onConfirm,
  onCancel,
}) => {
  return (
    <ConfirmationModal
      show={show}
      theme={theme}
      title="Confirm Sign Out"
      iconType="logout"
      variant="danger"
      confirmText="Sign Out"
      cancelText="Cancel"
      onConfirm={onConfirm}
      onClose={onCancel}
      description={
        <div className="space-y-2">
          <p>Are you sure you want to end your creative design session?</p>
          {user && (
            <span className="inline-block px-2.5 py-1 bg-red-500/10 text-red-400 text-[10px] font-mono rounded-full border border-red-500/20 tracking-tight font-bold">
              As @{user.username}
            </span>
          )}
        </div>
      }
    />
  );
};
