"use client";

import type React from "react";
import { useState } from "react";
import { Undo2, SwitchCamera, Share, Trash2, Download } from "lucide-react";
import { useIsMobile } from "../hooks/use-mobile";

interface MenuBarProps {
  onUndo: () => void;
  onToggleCamera: () => void;
  onShare: () => void;
  onDownload: () => void;
  onClearCanvas: () => void;
  videoDevices?: MediaDeviceInfo[];
  currentDeviceIndex?: number;
  onSelectDevice?: (index: number) => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  onUndo,
  onToggleCamera,
  onShare,
  onDownload,
  onClearCanvas,
  videoDevices = [],
  currentDeviceIndex = 0,
  onSelectDevice,
}) => {
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);
  const isMobile = useIsMobile();

  // Function to get a shortened camera name
  const getCameraName = (device: MediaDeviceInfo, index: number) => {
    if (!device.label) return `Camera ${index + 1}`;

    // Try to extract a meaningful name
    if (device.label.includes("(")) {
      // Extract text before the parenthesis
      return device.label.split("(")[0].trim();
    }

    // Shorten long names
    return device.label.length > 20
      ? `${device.label.substring(0, 18)}...`
      : device.label;
  };

  // Handle dot click to directly select a camera
  const handleDotClick = (index: number) => {
    if (onSelectDevice) {
      onSelectDevice(index);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-200 bg-opacity-70 backdrop-blur-md rounded-full shadow-lg px-4 py-2 z-50 pr-12">
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
        {isMobile ? (
          <button
            onClick={onShare}
            className="text-gray-600 hover:text-gray-800 transition-colors p-2"
            aria-label="Share"
          >
            <Share size={24} />
          </button>
        ) : (
          <button
            onClick={onDownload}
            className="text-gray-600 hover:text-gray-800 transition-colors p-2"
            aria-label="Download"
          >
            <Download size={24} />
          </button>
        )}
        <div className="relative flex items-center">
          <button
            onClick={onToggleCamera}
            className="text-gray-600 hover:text-gray-800 transition-colors p-2"
            aria-label="Toggle Camera"
          >
            <SwitchCamera size={24} />
          </button>
          {videoDevices.length > 1 && (
            <div className="absolute top-1/2 left-full transform -translate-y-1/2 flex flex-col space-y-2 ml-2 py-1">
              {videoDevices.map((device, index) => (
                <div
                  key={index}
                  className="relative"
                  onMouseEnter={() => setHoveredDot(index)}
                  onMouseLeave={() => setHoveredDot(null)}
                  onClick={() => handleDotClick(index)}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      index === currentDeviceIndex
                        ? "bg-gray-600"
                        : "bg-gray-400"
                    } transition-colors duration-200 cursor-pointer touch-manipulation`}
                    aria-label={`Camera ${index + 1}${
                      index === currentDeviceIndex ? " (selected)" : ""
                    }`}
                  />

                  {/* Tooltip */}
                  {hoveredDot === index && (
                    <div className="absolute right-5 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-75 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      {getCameraName(device, index)}
                      {index === currentDeviceIndex && " (active)"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
