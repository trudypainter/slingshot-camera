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

      let constraints: MediaStreamConstraints = {
        video: true,
      };

      // If deviceId is provided, use it
      if (deviceId) {
        console.log(`Starting camera with device ID: ${deviceId}`);
        constraints = {
          video: { deviceId: { exact: deviceId } },
        };
      } else if (isMobile) {
        // Otherwise use facingMode on mobile
        console.log(`Starting camera with facing mode: ${facingMode}`);
        constraints = {
          video: { facingMode },
        };
      } else {
        console.log("Starting camera with default constraints");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      console.log("Camera started successfully");
      setStream(mediaStream);
    } catch (error) {
      console.error("Error accessing camera:", error);
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
