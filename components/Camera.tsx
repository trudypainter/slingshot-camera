"use client";

import type React from "react";
import { useRef, useEffect, useState } from "react";
import { useCamera } from "../hooks/useCamera";
import { FlipHorizontal } from "lucide-react";

interface CameraProps {
  deviceId?: string;
}

export const Camera: React.FC<CameraProps> = ({ deviceId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previousDeviceIdRef = useRef<string | undefined>(deviceId);
  const [shouldStartCamera, setShouldStartCamera] = useState(true);
  const {
    stream,
    startCamera,
    switchCamera,
    isMobile,
    isLoading,
    actualFacingMode,
  } = useCamera(deviceId);

  // Only start camera when component mounts or when deviceId actually changes
  useEffect(() => {
    const deviceIdChanged = previousDeviceIdRef.current !== deviceId;

    if (shouldStartCamera || deviceIdChanged) {
      console.log(
        `Camera component: ${
          deviceIdChanged
            ? "deviceId changed to " + (deviceId || "default")
            : "initial mount"
        }`
      );
      startCamera();
      setShouldStartCamera(false);
      previousDeviceIdRef.current = deviceId;
    }
  }, [deviceId, startCamera, shouldStartCamera]);

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;

      // Get video track to determine actual resolution
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();

        // Log the actual video dimensions
        if (settings.width && settings.height) {
          console.log(`Video dimensions: ${settings.width}x${settings.height}`);

          // Optionally set video element attributes to match source dimensions
          // This ensures the video is rendered at its native resolution
          videoRef.current.setAttribute("width", settings.width.toString());
          videoRef.current.setAttribute("height", settings.height.toString());
        }
      }
    }
  }, [stream]);

  // Determine if we should flip the video horizontally
  // Only flip for front-facing cameras (user mode)
  const shouldFlipHorizontally = actualFacingMode !== "environment";

  // Log when facing mode changes
  useEffect(() => {
    console.log(
      `Camera flip status: ${
        shouldFlipHorizontally
          ? "flipped (front camera)"
          : "not flipped (back camera)"
      }`
    );
    console.log(`Current facing mode: ${actualFacingMode || "unknown"}`);
  }, [actualFacingMode, shouldFlipHorizontally]);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute top-0 left-0 w-full h-full object-cover ${
          shouldFlipHorizontally ? "scale-x-[-1]" : ""
        }`}
      />
    </>
  );
};
