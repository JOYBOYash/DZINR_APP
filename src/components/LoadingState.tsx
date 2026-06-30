import React from 'react';
import { Loader } from './Loader';

interface LoadingStateProps {
  id?: string;
  message?: string; // Kept for compatibility, but hidden as requested: "No additional texts/icons used for the loading screen"
  theme?: 'dark' | 'light';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  id = "loading-state-container",
  theme: propTheme
}) => {
  const theme = propTheme || (localStorage.getItem("dzinr_theme") === "light" ? "light" : "dark");
  
  return (
    <div 
      id={id} 
      className={`fixed inset-0 flex flex-col items-center justify-center z-50 px-6 overflow-hidden transition-colors duration-300 ${
        theme === "dark"
          ? "bg-canvas-dark text-white"
          : "bg-canvas-light text-black"
      }`}
    >
      <Loader id={`${id}-loader-wrapper`} size="md" />
    </div>
  );
};
