"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
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

  console.log(`🔍 MenuBar rendered, isMobile: ${isMobile}`);

  // Wrapped handlers with console logs
  const handleClearCanvas = useCallback(() => {
    console.log("🗑️ Clear Canvas button clicked!");
    onClearCanvas();
  }, [onClearCanvas]);

  const handleUndo = useCallback(() => {
    console.log("↩️ Undo button clicked!");
    onUndo();
  }, [onUndo]);

  const handleShare = useCallback(() => {
    console.log("📤 Share button clicked!");
    onShare();
  }, [onShare]);

  const handleDownload = useCallback(() => {
    console.log("💾 Download button clicked!");
    onDownload();
  }, [onDownload]);

  const handleToggleCamera = useCallback(() => {
    console.log("📷 Toggle Camera button clicked!");
    onToggleCamera();
  }, [onToggleCamera]);

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
    console.log(`🎯 Camera dot ${index} clicked!`);
    if (onSelectDevice) {
      onSelectDevice(index);
    }
  };

  // Add refs for the buttons
  const clearButtonRef = useRef<HTMLButtonElement>(null);
  const undoButtonRef = useRef<HTMLButtonElement>(null);
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const downloadButtonRef = useRef<HTMLButtonElement>(null);
  const cameraButtonRef = useRef<HTMLButtonElement>(null);

  // Add useEffect to log button positions
  useEffect(() => {
    // Wait for the DOM to be fully rendered
    setTimeout(() => {
      console.log("🔍 Button positions and dimensions:");

      // Simplified debugging approach to avoid type issues
      if (clearButtonRef.current) {
        const rect = clearButtonRef.current.getBoundingClientRect();
        console.log(
          `  - Clear Button: x=${Math.round(rect.x)}, y=${Math.round(
            rect.y
          )}, visible=true`
        );
      }

      if (undoButtonRef.current) {
        const rect = undoButtonRef.current.getBoundingClientRect();
        console.log(
          `  - Undo Button: x=${Math.round(rect.x)}, y=${Math.round(
            rect.y
          )}, visible=true`
        );
      }

      if (isMobile && shareButtonRef.current) {
        const rect = shareButtonRef.current.getBoundingClientRect();
        console.log(
          `  - Share Button: x=${Math.round(rect.x)}, y=${Math.round(
            rect.y
          )}, visible=true`
        );
      } else if (!isMobile && downloadButtonRef.current) {
        const rect = downloadButtonRef.current.getBoundingClientRect();
        console.log(
          `  - Download Button: x=${Math.round(rect.x)}, y=${Math.round(
            rect.y
          )}, visible=true`
        );
      }

      if (cameraButtonRef.current) {
        const rect = cameraButtonRef.current.getBoundingClientRect();
        console.log(
          `  - Camera Button: x=${Math.round(rect.x)}, y=${Math.round(
            rect.y
          )}, visible=true`
        );
      }

      // Log the MenuBar container
      const menuBar = document.querySelector(".fixed.bottom-4");
      if (menuBar) {
        const rect = (menuBar as HTMLElement).getBoundingClientRect();
        console.log(
          `  - MenuBar container: x=${Math.round(rect.x)}, y=${Math.round(
            rect.y
          )}, width=${Math.round(rect.width)}, height=${Math.round(
            rect.height
          )}, z-index=${window.getComputedStyle(menuBar as HTMLElement).zIndex}`
        );

        // Check for any overlapping elements
        console.log("  - Checking for overlapping elements...");
        const elements = document.elementsFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2
        );

        if (elements.length > 1) {
          console.log(
            `  - Found ${elements.length} elements at the center of the MenuBar:`
          );
          elements.slice(0, 5).forEach((el, i) => {
            console.log(
              `    ${i + 1}. ${el.tagName}${el.id ? "#" + el.id : ""}${
                el.className
                  ? "." + el.className.toString().replace(/\s+/g, ".")
                  : ""
              }`
            );
          });
        } else {
          console.log("  - No overlapping elements found");
        }
      } else {
        console.log("  - MenuBar container: Not found");
      }
    }, 1000); // Wait 1 second for everything to render
  }, [isMobile]);

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-200 bg-opacity-70 backdrop-blur-md rounded-full shadow-lg px-4 py-2 z-50 pr-12">
      <div className="flex items-center space-x-8 md:space-x-6">
        <button
          ref={clearButtonRef}
          onClick={handleClearCanvas}
          className="text-gray-600 hover:text-gray-800 transition-colors p-2"
          aria-label="Clear Canvas"
        >
          <Trash2 size={24} />
        </button>
        <button
          ref={undoButtonRef}
          onClick={handleUndo}
          className="text-gray-600 hover:text-gray-800 transition-colors p-2"
          aria-label="Undo"
        >
          <Undo2 size={24} />
        </button>
        {isMobile ? (
          <button
            ref={shareButtonRef}
            onClick={handleShare}
            className="text-gray-600 hover:text-gray-800 transition-colors p-2"
            aria-label="Share"
          >
            <Share size={24} />
          </button>
        ) : (
          <button
            ref={downloadButtonRef}
            onClick={handleDownload}
            className="text-gray-600 hover:text-gray-800 transition-colors p-2"
            aria-label="Download"
          >
            <Download size={24} />
          </button>
        )}
        <div className="relative flex items-center">
          <button
            ref={cameraButtonRef}
            onClick={handleToggleCamera}
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
