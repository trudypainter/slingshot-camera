"use client";

import type React from "react";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { Image as ImageType, Point } from "../types";
import { Camera } from "./Camera";
import { PastedImage } from "./PastedImage";
import { MenuBar } from "./MenuBar";
import { Crosshair } from "lucide-react";

export const Canvas: React.FC = () => {
  const [images, setImages] = useState<ImageType[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragEnd, setDragEnd] = useState<Point | null>(null);
  const [viewfinderRect, setViewfinderRect] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });
  const canvasRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState<number>(0);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.style.width = `${window.innerWidth}px`;
        canvasRef.current.style.height = `${window.innerHeight}px`;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Get available video devices on component mount
  useEffect(() => {
    async function getVideoDevices() {
      try {
        // First, ensure we have permission to access media devices
        await navigator.mediaDevices.getUserMedia({ video: true });

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(
          (device) => device.kind === "videoinput"
        );

        console.log("Available video devices:", videoInputs);
        setVideoDevices(videoInputs);
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    }

    getVideoDevices();

    // Set up device change listener
    const handleDeviceChange = async () => {
      console.log("Media devices changed, updating list...");
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(
        (device) => device.kind === "videoinput"
      );
      console.log("Updated video devices:", videoInputs);
      setVideoDevices(videoInputs);
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange
      );
    };
  }, []);

  // Memoize the current device ID to prevent unnecessary re-renders
  const currentDeviceId = useMemo(() => {
    return videoDevices[currentDeviceIndex]?.deviceId;
  }, [videoDevices, currentDeviceIndex]);

  // Common function to start drag (for both mouse and touch)
  const startDrag = useCallback((x: number, y: number) => {
    if (canvasRef.current) {
      setDragStart({ x, y });
      setDragEnd({ x, y });
      setIsDragging(true);
      setIsCameraVisible(true);
      setViewfinderRect({ left: x, top: y, width: 0, height: 0 });
    }
  }, []);

  // Common function to update drag (for both mouse and touch)
  const updateDrag = useCallback(
    (x: number, y: number) => {
      if (isDragging && dragStart) {
        setDragEnd({ x, y });
        setViewfinderRect({
          left: Math.min(dragStart.x, x),
          top: Math.min(dragStart.y, y),
          width: Math.abs(x - dragStart.x),
          height: Math.abs(y - dragStart.y),
        });
      }
    },
    [isDragging, dragStart]
  );

  // Common function to end drag (for both mouse and touch)
  const endDrag = useCallback(() => {
    setIsCameraVisible(false);

    if (dragStart && dragEnd && cameraRef.current) {
      const newImageId = Date.now().toString();
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const video = cameraRef.current.querySelector("video");

      if (context && video) {
        const viewfinderWidth = Math.abs(dragEnd.x - dragStart.x);
        const viewfinderHeight = Math.abs(dragEnd.y - dragStart.y);

        // Don't capture if the drag area is too small
        if (viewfinderWidth < 10 || viewfinderHeight < 10) {
          setIsDragging(false);
          setDragStart(null);
          setDragEnd(null);
          return;
        }

        // Set canvas size to match the viewfinder
        canvas.width = viewfinderWidth;
        canvas.height = viewfinderHeight;

        // Calculate the aspect ratios
        const viewfinderAspectRatio = viewfinderWidth / viewfinderHeight;
        const videoAspectRatio = video.videoWidth / video.videoHeight;

        // Variables for source and destination rectangles
        let sx, sy, sw, sh, dx, dy, dw, dh;

        // Calculate the source rectangle (what part of the video to capture)
        // and the destination rectangle (where to place it on the canvas)
        if (viewfinderAspectRatio > videoAspectRatio) {
          // Viewfinder is wider than video
          sw = video.videoWidth;
          sh = video.videoWidth / viewfinderAspectRatio;
          sx = 0;
          sy = (video.videoHeight - sh) / 2;

          // Destination is the full canvas
          dx = 0;
          dy = 0;
          dw = canvas.width;
          dh = canvas.height;
        } else {
          // Viewfinder is taller than video
          sw = video.videoHeight * viewfinderAspectRatio;
          sh = video.videoHeight;
          sx = (video.videoWidth - sw) / 2;
          sy = 0;

          // Destination is the full canvas
          dx = 0;
          dy = 0;
          dw = canvas.width;
          dh = canvas.height;
        }

        // Mirror the image horizontally
        context.translate(canvas.width, 0);
        context.scale(-1, 1);

        // Draw the video onto the canvas, properly cropped and positioned
        context.drawImage(
          video,
          sx,
          sy,
          sw,
          sh, // Source rectangle (what part of the video to capture)
          0,
          0,
          canvas.width,
          canvas.height // Destination rectangle (where to place it on the canvas)
        );

        const newImage: ImageType = {
          id: newImageId,
          src: canvas.toDataURL("image/jpeg"),
          position: {
            x: Math.min(dragStart.x, dragEnd.x),
            y: Math.min(dragStart.y, dragEnd.y),
          },
          size: {
            width: viewfinderWidth,
            height: viewfinderHeight,
          },
          mirrored: true,
        };
        setImages((prevImages) => [...prevImages, newImage]);
      }
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [dragStart, dragEnd]);

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        startDrag(x, y);
      }
    },
    [startDrag]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isDragging && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        updateDrag(x, y);
      }
    },
    [isDragging, updateDrag]
  );

  const handleMouseUp = useCallback(() => {
    endDrag();
  }, [endDrag]);

  const handleMouseLeave = useCallback(() => {
    endDrag();
  }, [endDrag]);

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (canvasRef.current && e.touches.length > 0) {
        const rect = canvasRef.current.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        startDrag(x, y);
      }
    },
    [startDrag]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (isDragging && canvasRef.current && e.touches.length > 0) {
        const rect = canvasRef.current.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        updateDrag(x, y);
      }
    },
    [isDragging, updateDrag]
  );

  const handleTouchEnd = useCallback(() => {
    endDrag();
  }, [endDrag]);

  const handleUndo = useCallback(() => {
    setImages((prevImages) => prevImages.slice(0, -1));
  }, []);

  const handleClearCanvas = useCallback(() => {
    setImages([]);
  }, []);

  const handleToggleCamera = useCallback(() => {
    if (videoDevices.length === 0) {
      console.log("No video devices available");
      return;
    }

    // Calculate next device index (loop back to 0 if we reach the end)
    const nextDeviceIndex = (currentDeviceIndex + 1) % videoDevices.length;
    const nextDevice = videoDevices[nextDeviceIndex];

    console.log(
      `Switching camera: ${currentDeviceIndex} -> ${nextDeviceIndex}`
    );
    console.log(
      `New device: ${nextDevice.label || "Unnamed device"} (${
        nextDevice.deviceId
      })`
    );

    // Update current device index
    setCurrentDeviceIndex(nextDeviceIndex);

    // If camera is not visible, make it visible
    if (!isCameraVisible) {
      setIsCameraVisible(true);
    }
    // We don't need to force remount anymore since we've improved the Camera component
  }, [videoDevices, currentDeviceIndex, isCameraVisible]);

  const handleShare = useCallback(() => {
    if (navigator.share && images.length > 0) {
      // Create a canvas with all images
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // Set canvas size to match the container
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Fill with white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw all images onto the canvas
        images.forEach((image) => {
          const img = new Image();
          img.src = image.src;
          ctx.drawImage(
            img,
            image.position.x,
            image.position.y,
            image.size.width,
            image.size.height
          );
        });

        // Convert to blob and share
        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              const file = new File([blob], "slingshot-collage.png", {
                type: "image/png",
              });
              await navigator.share({
                files: [file],
                title: "Slingshot Collage",
              });
            } catch (error) {
              console.error("Error sharing:", error);
            }
          }
        }, "image/png");
      }
    } else {
      console.log("Web Share API not supported or no images to share");
    }
  }, [images]);

  return (
    <div
      ref={canvasRef}
      className="relative w-screen h-screen overflow-hidden bg-white cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {images.map((image, index) => (
        <PastedImage key={index} image={image} />
      ))}

      {isCameraVisible && (
        <div
          ref={cameraRef}
          className="absolute bg-black overflow-hidden"
          style={{
            left: viewfinderRect.left,
            top: viewfinderRect.top,
            width: viewfinderRect.width,
            height: viewfinderRect.height,
            border: isDragging ? "2px solid #3b82f6" : "none",
          }}
        >
          <Camera deviceId={currentDeviceId} />
        </div>
      )}

      {images.length === 0 && !isDragging && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center space-x-2 text-gray-500">
          <Crosshair size={24} />
          <span className="text-lg font-medium">Drag to capture</span>
        </div>
      )}
      <MenuBar
        onUndo={handleUndo}
        onToggleCamera={handleToggleCamera}
        onShare={handleShare}
        onClearCanvas={handleClearCanvas}
      />
    </div>
  );
};
