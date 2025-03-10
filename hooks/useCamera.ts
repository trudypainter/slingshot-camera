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
          setActualFacingMode(detectedFacingMode);
          console.log(
            `Detected camera facing mode: ${detectedFacingMode || "unknown"}`
          );

          // If no facingMode in settings, try to guess from label
          if (!detectedFacingMode && videoTrack.label) {
            const label = videoTrack.label.toLowerCase();
            if (
              label.includes("back") ||
              label.includes("environment") ||
              label.includes("rear")
            ) {
              setActualFacingMode("environment");
              console.log("Inferred facing mode from label: environment");
            } else if (
              label.includes("front") ||
              label.includes("user") ||
              label.includes("selfie")
            ) {
              setActualFacingMode("user");
              console.log("Inferred facing mode from label: user");
            }
          }
        } catch (error) {
          console.error("Error getting camera track settings:", error);
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

      console.log(
        `Requesting camera resolution: ${idealWidth}x${idealHeight} (DPR: ${dpr})`
      );

      let constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: idealWidth },
          height: { ideal: idealHeight },
        },
      };

      // If deviceId is provided, use it
      if (deviceId) {
        console.log(`Starting camera with device ID: ${deviceId}`);
        constraints = {
          video: {
            deviceId: { exact: deviceId },
            width: { ideal: idealWidth },
            height: { ideal: idealHeight },
          },
        };
      } else if (isMobile) {
        // Otherwise use facingMode on mobile
        console.log(`Starting camera with facing mode: ${facingMode}`);
        constraints = {
          video: {
            facingMode,
            width: { ideal: idealWidth },
            height: { ideal: idealHeight },
          },
        };
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      console.log("Camera started successfully");

      // Log the actual resolution we got
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        console.log(
          `Actual camera resolution: ${settings.width}x${settings.height}`
        );
      }

      setStream(mediaStream);
    } catch (error) {
      console.error("Error accessing camera:", error);

      // If high resolution failed, try again with default constraints
      try {
        console.log("Falling back to default camera resolution");
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
        });
        console.log("Camera started successfully with default resolution");
        setStream(mediaStream);
      } catch (fallbackError) {
        console.error(
          "Error accessing camera with fallback settings:",
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
