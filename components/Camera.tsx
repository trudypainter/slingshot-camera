"use client";

import type React from "react";
import { useRef, useEffect, useState } from "react";
import { useCamera } from "../hooks/useCamera";
import { FlipHorizontal } from "lucide-react";

interface CameraProps {
  deviceId?: string;
  onFacingModeChange?: (facingMode: string) => void;
}

export const Camera: React.FC<CameraProps> = ({
  deviceId,
  onFacingModeChange,
}) => {
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
      console.log(`📹 CAMERA DEBUG - Setting video srcObject with stream`);
      videoRef.current.srcObject = stream;

      // Get video track to determine actual resolution
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();

        // Log detailed track information
        console.log(`📹 CAMERA DEBUG - Video track ID: ${videoTrack.id}`);
        console.log(`📹 CAMERA DEBUG - Video track label: ${videoTrack.label}`);
        console.log(
          `📹 CAMERA DEBUG - Video track enabled: ${videoTrack.enabled}`
        );
        console.log(`📹 CAMERA DEBUG - Video track settings:`, settings);
        console.log(
          `📹 CAMERA DEBUG - Video track constraints:`,
          videoTrack.getConstraints()
        );

        // Log the actual video dimensions
        if (settings.width && settings.height) {
          console.log(
            `📹 CAMERA DEBUG - Native video dimensions: ${settings.width}x${settings.height}`
          );
          console.log(
            `📹 CAMERA DEBUG - Native video aspect ratio: ${(
              settings.width / settings.height
            ).toFixed(2)}`
          );
          console.log(
            `📹 CAMERA DEBUG - Native video frame rate: ${
              settings.frameRate || "unknown"
            }`
          );

          // Optionally set video element attributes to match source dimensions
          // This ensures the video is rendered at its native resolution
          videoRef.current.setAttribute("width", settings.width.toString());
          videoRef.current.setAttribute("height", settings.height.toString());
          console.log(
            `📹 CAMERA DEBUG - Set video element attributes to match native dimensions`
          );
        }
      }

      // Add loadedmetadata event listener to log video element dimensions once loaded
      const handleVideoLoaded = () => {
        if (videoRef.current) {
          console.log(`📹 CAMERA DEBUG - Video element loaded metadata`);
          console.log(
            `📹 CAMERA DEBUG - Video element dimensions: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`
          );
          console.log(
            `📹 CAMERA DEBUG - Video element display size: ${videoRef.current.offsetWidth}x${videoRef.current.offsetHeight}`
          );
          console.log(`📹 CAMERA DEBUG - Video element style:`, {
            width: videoRef.current.style.width,
            height: videoRef.current.style.height,
            objectFit: videoRef.current.style.objectFit,
          });

          // Check if there's a mismatch between native and displayed dimensions
          const displayAspectRatio =
            videoRef.current.offsetWidth / videoRef.current.offsetHeight;
          const nativeAspectRatio =
            videoRef.current.videoWidth / videoRef.current.videoHeight;

          if (Math.abs(displayAspectRatio - nativeAspectRatio) > 0.1) {
            console.log(
              `⚠️ CAMERA DEBUG - Aspect ratio mismatch! Native: ${nativeAspectRatio.toFixed(
                2
              )}, Display: ${displayAspectRatio.toFixed(2)}`
            );
          }

          // Check if we're potentially losing resolution
          const dpr = window.devicePixelRatio || 1;
          const effectiveResolution = Math.min(
            videoRef.current.videoWidth / videoRef.current.offsetWidth,
            videoRef.current.videoHeight / videoRef.current.offsetHeight
          );

          console.log(
            `📹 CAMERA DEBUG - Effective video resolution scale: ~${effectiveResolution.toFixed(
              2
            )}x (DPR: ${dpr})`
          );

          if (effectiveResolution > dpr) {
            console.log(
              `⚠️ CAMERA DEBUG - Potential resolution loss! Video has more detail (${effectiveResolution.toFixed(
                2
              )}x) than we're displaying (${dpr}x)`
            );
          }
        }
      };

      videoRef.current.addEventListener("loadedmetadata", handleVideoLoaded);

      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener(
            "loadedmetadata",
            handleVideoLoaded
          );
        }
      };
    }
  }, [stream]);

  // Notify parent component when facing mode changes
  useEffect(() => {
    if (onFacingModeChange && actualFacingMode) {
      console.log(
        `Camera notifying parent of facing mode change: ${actualFacingMode}`
      );
      onFacingModeChange(actualFacingMode);
    }
  }, [actualFacingMode, onFacingModeChange]);

  // Determine if we should flip the video horizontally
  // Only flip for front-facing cameras (user mode)
  // If actualFacingMode is undefined, default to flipping (user mode)
  const shouldFlipHorizontally = actualFacingMode !== "environment";

  // Log when facing mode changes
  useEffect(() => {
    console.log(
      `Camera flip status: ${
        shouldFlipHorizontally
          ? "flipped (front/user camera)"
          : "not flipped (back/environment camera)"
      }`
    );
    console.log(
      `Current facing mode: ${
        actualFacingMode || "unknown (defaulting to user mode)"
      }`
    );
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
