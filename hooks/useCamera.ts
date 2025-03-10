"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useIsMobile } from "./use-mobile";

export function useCamera(deviceId?: string) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const [actualFacingMode, setActualFacingMode] = useState<string | undefined>(
    undefined
  );
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const currentDeviceIdRef = useRef<string | undefined>(deviceId);

  // Update ref when deviceId changes
  useEffect(() => {
    currentDeviceIdRef.current = deviceId;
  }, [deviceId]);

  // Update actual facing mode when stream changes
  useEffect(() => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        try {
          const settings = videoTrack.getSettings();
          console.log("Camera track settings:", settings);

          // Get facingMode from settings
          const detectedFacingMode = settings.facingMode;

          if (detectedFacingMode) {
            // If the browser provides a facingMode, trust it
            setActualFacingMode(detectedFacingMode);
            console.log(
              `Detected camera facing mode from settings: ${detectedFacingMode}`
            );
          } else if (videoTrack.label) {
            // If no facingMode in settings, try to guess from label
            const label = videoTrack.label.toLowerCase();

            // Check if it's clearly a back/environment camera
            if (
              label.includes("back") ||
              label.includes("environment") ||
              label.includes("rear")
            ) {
              setActualFacingMode("environment");
              console.log(
                "Inferred facing mode from label: environment (back camera)"
              );
            }
            // Check if it's clearly a front/user camera
            else if (
              label.includes("front") ||
              label.includes("user") ||
              label.includes("selfie") ||
              label.includes("facetime")
            ) {
              setActualFacingMode("user");
              console.log(
                "Inferred facing mode from label: user (front camera)"
              );
            }
            // Default behavior for unknown cameras - assume user-facing (mirrored)
            else {
              setActualFacingMode("user");
              console.log(
                `Camera with unknown type "${videoTrack.label}" - defaulting to user mode (mirrored)`
              );
            }
          } else {
            // No label and no facingMode - default to user mode
            setActualFacingMode("user");
            console.log(
              "No camera label or facingMode available - defaulting to user mode (mirrored)"
            );
          }
        } catch (error) {
          console.error("Error getting camera track settings:", error);
          // Default to user mode on error
          setActualFacingMode("user");
        }
      }
    } else {
      setActualFacingMode(undefined);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    // Prevent multiple simultaneous camera starts
    if (isLoading) {
      console.log("Camera already starting, ignoring duplicate request");
      return;
    }

    // If we already have a stream with the same deviceId, don't restart
    if (stream && deviceId === currentDeviceIdRef.current) {
      console.log(
        "Camera already started with the same device ID, skipping restart"
      );
      return;
    }

    try {
      setIsLoading(true);

      // Stop any existing stream
      if (stream) {
        console.log("Stopping existing camera stream");
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        setStream(null);
      }

      // Get device pixel ratio for high-DPI displays
      const dpr = window.devicePixelRatio || 1;

      // Calculate ideal resolution based on device capabilities
      // Use higher resolution for higher DPR devices
      const idealWidth = Math.min(1920, Math.floor(1280 * dpr));
      const idealHeight = Math.min(1080, Math.floor(720 * dpr));

      console.log(`📱 CAMERA HOOK DEBUG - Device pixel ratio: ${dpr}`);
      console.log(
        `📱 CAMERA HOOK DEBUG - iOS device: ${/iPad|iPhone|iPod/.test(
          navigator.userAgent
        )}`
      );
      console.log(
        `📱 CAMERA HOOK DEBUG - Safari browser: ${/^((?!chrome|android).)*safari/i.test(
          navigator.userAgent
        )}`
      );
      console.log(
        `📱 CAMERA HOOK DEBUG - Requesting camera resolution: ${idealWidth}x${idealHeight} (DPR: ${dpr})`
      );

      let constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: idealWidth },
          height: { ideal: idealHeight },
        },
      };

      // If deviceId is provided, use it
      if (deviceId) {
        console.log(
          `📱 CAMERA HOOK DEBUG - Starting camera with device ID: ${deviceId}`
        );
        constraints = {
          video: {
            deviceId: { exact: deviceId },
            width: { ideal: idealWidth },
            height: { ideal: idealHeight },
          },
        };
      } else if (isMobile) {
        // Otherwise use facingMode on mobile
        console.log(
          `📱 CAMERA HOOK DEBUG - Starting camera with facing mode: ${facingMode}`
        );
        constraints = {
          video: {
            facingMode,
            width: { ideal: idealWidth },
            height: { ideal: idealHeight },
          },
        };
      }

      // Log the constraints we're using
      console.log(
        `📱 CAMERA HOOK DEBUG - Using constraints:`,
        JSON.stringify(constraints, null, 2)
      );

      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      console.log("📱 CAMERA HOOK DEBUG - Camera started successfully");

      // Log the actual resolution we got
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        console.log(
          `📱 CAMERA HOOK DEBUG - Actual camera resolution: ${settings.width}x${settings.height}`
        );
        console.log(`📱 CAMERA HOOK DEBUG - Requested vs. actual:`, {
          requestedWidth: idealWidth,
          actualWidth: settings.width,
          widthRatio: settings.width
            ? (settings.width / idealWidth).toFixed(2)
            : "N/A",
          requestedHeight: idealHeight,
          actualHeight: settings.height,
          heightRatio: settings.height
            ? (settings.height / idealHeight).toFixed(2)
            : "N/A",
        });

        // Check if we got a significantly lower resolution than requested
        if (settings.width && settings.width < idealWidth * 0.8) {
          console.log(
            `⚠️ CAMERA HOOK DEBUG - Got significantly lower width resolution than requested!`
          );
        }
        if (settings.height && settings.height < idealHeight * 0.8) {
          console.log(
            `⚠️ CAMERA HOOK DEBUG - Got significantly lower height resolution than requested!`
          );
        }

        // Log other important settings
        console.log(`📱 CAMERA HOOK DEBUG - Camera settings:`, {
          frameRate: settings.frameRate,
          facingMode: settings.facingMode,
          deviceId: settings.deviceId,
          aspectRatio: settings.aspectRatio,
        });
      }

      setStream(mediaStream);
    } catch (error) {
      console.error("❌ CAMERA HOOK DEBUG - Error accessing camera:", error);

      // If high resolution failed, try again with default constraints
      try {
        console.log(
          "📱 CAMERA HOOK DEBUG - Falling back to default camera resolution"
        );
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
        });
        console.log(
          "📱 CAMERA HOOK DEBUG - Camera started successfully with default resolution"
        );

        // Log the fallback resolution
        const videoTrack = mediaStream.getVideoTracks()[0];
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          console.log(
            `📱 CAMERA HOOK DEBUG - Fallback camera resolution: ${settings.width}x${settings.height}`
          );
        }

        setStream(mediaStream);
      } catch (fallbackError) {
        console.error(
          "❌ CAMERA HOOK DEBUG - Error accessing camera with fallback settings:",
          fallbackError
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [deviceId, isMobile, facingMode]);

  const switchCamera = useCallback(() => {
    if (stream && !isLoading) {
      // Stop current stream
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      setStream(null);

      // Toggle facing mode
      setFacingMode((prevMode) =>
        prevMode === "user" ? "environment" : "user"
      );
    }
  }, [stream, isLoading]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
    };
  }, [stream]);

  return {
    stream,
    startCamera,
    switchCamera,
    isMobile,
    facingMode,
    actualFacingMode,
    isLoading,
  };
}
