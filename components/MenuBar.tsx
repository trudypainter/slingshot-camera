"use client";

import type React from "react";
import { Undo2, SwitchCamera, Share, Trash2 } from "lucide-react";

interface MenuBarProps {
  onUndo: () => void;
  onToggleCamera: () => void;
  onShare: () => void;
  onClearCanvas: () => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  onUndo,
  onToggleCamera,
  onShare,
  onClearCanvas,
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-200 bg-opacity-70 backdrop-blur-md rounded-full shadow-lg px-4 py-2 z-50">
      <div className="flex items-center space-x-8 md:space-x-6">
        <button
          onClick={onClearCanvas}
          className="text-gray-600 hover:text-gray-800 transition-colors p-2"
          aria-label="Clear Canvas"
        >
          <Trash2 size={24} />
        </button>
        <button
          onClick={onUndo}
          className="text-gray-600 hover:text-gray-800 transition-colors p-2"
          aria-label="Undo"
        >
          <Undo2 size={24} />
        </button>
        <button
          onClick={onToggleCamera}
          className="text-gray-600 hover:text-gray-800 transition-colors p-2"
          aria-label="Toggle Camera"
        >
          <SwitchCamera size={24} />
        </button>
        <button
          onClick={onShare}
          className="text-gray-600 hover:text-gray-800 transition-colors p-2"
          aria-label="Share"
        >
          <Share size={24} />
        </button>
      </div>
    </div>
  );
};
