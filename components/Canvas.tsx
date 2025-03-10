"use client";

import type React from "react";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { Image as ImageType, Point } from "../types";
import { Camera } from "./Camera";
import { PastedImage } from "./PastedImage";
import { MenuBar } from "./MenuBar";
import { Crosshair } from "lucide-react";
import { useIsMobile } from "../hooks/use-mobile";

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
  const isMobile = useIsMobile();

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

        // Calculate viewfinder rectangle
        const left = Math.min(dragStart.x, x);
        const top = Math.min(dragStart.y, y);
        const width = Math.abs(x - dragStart.x);
        const height = Math.abs(y - dragStart.y);

        setViewfinderRect({ left, top, width, height });
      }
    },
    [isDragging, dragStart]
  );

  // Common function to end drag and capture image
  const endDrag = useCallback(() => {
    if (isDragging && dragStart && dragEnd) {
      // Only capture if the drag area is large enough
      const minSize = 20; // Minimum size in pixels
      if (
        Math.abs(dragEnd.x - dragStart.x) > minSize &&
        Math.abs(dragEnd.y - dragStart.y) > minSize
      ) {
        setIsCameraVisible(false);

        if (dragStart && dragEnd && cameraRef.current) {
          const newImageId = Date.now().toString();
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          const video = cameraRef.current.querySelector("video");

          if (context && video) {
            const viewfinderWidth = Math.abs(dragEnd.x - dragStart.x);
            const viewfinderHeight = Math.abs(dragEnd.y - dragStart.y);

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
      }
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [dragStart, dragEnd, isDragging]);

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

  // Touch event handlers with improved coordinate calculation
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      // Check if the touch is on a button or other interactive element
      const target = e.target as HTMLElement;
      const path = Array.from(e.nativeEvent.composedPath());

      // Allow touches on buttons, inputs, and the MenuBar
      const isInteractiveElement = path.some((el) => {
        if (el instanceof HTMLElement) {
          // Check for buttons or other interactive elements
          if (
            el.tagName === "BUTTON" ||
            el.tagName === "INPUT" ||
            el.tagName === "A" ||
            el.tagName === "SELECT" ||
            (el.classList.contains("fixed") &&
              el.classList.contains("bottom-4")) // MenuBar
          ) {
            return true;
          }
        }
        return false;
      });

      // If touch is on an interactive element, don't start dragging
      if (isInteractiveElement) {
        console.log(
          "👍 Canvas: Touch on interactive element, not starting drag",
          target.tagName
        );
        return;
      }

      // Prevent default to avoid scrolling and zooming
      e.preventDefault();

      if (canvasRef.current && e.touches.length > 0) {
        const rect = canvasRef.current.getBoundingClientRect();
        const touch = e.touches[0];

        // Calculate position relative to the canvas
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        console.log(`Touch start at x: ${x}, y: ${y}`);
        startDrag(x, y);
      }
    },
    [startDrag]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      // Check if the touch is on a button or other interactive element
      const target = e.target as HTMLElement;
      const path = Array.from(e.nativeEvent.composedPath());

      // Allow touches on buttons, inputs, and the MenuBar
      const isInteractiveElement = path.some((el) => {
        if (el instanceof HTMLElement) {
          // Check for buttons or other interactive elements
          if (
            el.tagName === "BUTTON" ||
            el.tagName === "INPUT" ||
            el.tagName === "A" ||
            el.tagName === "SELECT" ||
            (el.classList.contains("fixed") &&
              el.classList.contains("bottom-4")) // MenuBar
          ) {
            return true;
          }
        }
        return false;
      });

      // If touch is on an interactive element, don't prevent default
      if (isInteractiveElement) {
        console.log(
          "👍 Canvas: Touch move on interactive element, allowing default",
          target.tagName
        );
        return;
      }

      // Prevent default to avoid scrolling and zooming
      e.preventDefault();

      if (isDragging && canvasRef.current && e.touches.length > 0) {
        const rect = canvasRef.current.getBoundingClientRect();
        const touch = e.touches[0];

        // Calculate position relative to the canvas
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        console.log(`Touch move to x: ${x}, y: ${y}`);
        updateDrag(x, y);
      }
    },
    [isDragging, updateDrag]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      // Check if the touch is on a button or other interactive element
      const target = e.target as HTMLElement;
      const path = Array.from(e.nativeEvent.composedPath());

      // Allow touches on buttons, inputs, and the MenuBar
      const isInteractiveElement = path.some((el) => {
        if (el instanceof HTMLElement) {
          // Check for buttons or other interactive elements
          if (
            el.tagName === "BUTTON" ||
            el.tagName === "INPUT" ||
            el.tagName === "A" ||
            el.tagName === "SELECT" ||
            (el.classList.contains("fixed") &&
              el.classList.contains("bottom-4")) // MenuBar
          ) {
            return true;
          }
        }
        return false;
      });

      // If touch is on an interactive element, don't prevent default
      if (isInteractiveElement) {
        console.log(
          "👍 Canvas: Touch end on interactive element, allowing default",
          target.tagName
        );
        return;
      }

      // Prevent default to avoid any unwanted behaviors
      e.preventDefault();
      console.log("Touch end, ending drag");
      endDrag();
    },
    [endDrag]
  );

  const handleUndo = useCallback(() => {
    console.log("🔄 Canvas: handleUndo called");
    if (images.length > 0) {
      setImages((prevImages) => prevImages.slice(0, -1));
    }
  }, [images]);

  const handleClearCanvas = useCallback(() => {
    console.log("🧹 Canvas: handleClearCanvas called");
    setImages([]);
  }, []);

  const handleToggleCamera = useCallback(() => {
    console.log("📸 Canvas: handleToggleCamera called");

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

    // Force camera remount by toggling isCameraVisible
    // This ensures the camera is restarted with the new device
    setIsCameraVisible(false);
    setTimeout(() => {
      setIsCameraVisible(true);
    }, 50);
  }, [videoDevices, currentDeviceIndex]);

  const handleDownload = useCallback(() => {
    console.log("📥 Canvas: handleDownload started");
    if (images.length === 0) {
      console.log("❌ Canvas: No images to download");
      return;
    }

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

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          console.log("✅ Canvas: Blob created successfully for download");
          try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "slingshot-collage.png";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log("✅ Canvas: Download initiated");
          } catch (error) {
            console.error("❌ Canvas: Error downloading:", error);
          }
        } else {
          console.error("❌ Canvas: Failed to create blob for download");
        }
      }, "image/png");
    }
  }, [images]);

  const handleShare = useCallback(() => {
    console.log("📤 Canvas: handleShare started");
    if (images.length === 0) {
      console.log("❌ Canvas: No images to share");
      return;
    }

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
          console.log("✅ Canvas: Blob created successfully for sharing");
          try {
            // Check if we're on iOS Safari
            const isIOS =
              /iPad|iPhone|iPod/.test(navigator.userAgent) &&
              !(window as any).MSStream;
            const isSafari = /^((?!chrome|android).)*safari/i.test(
              navigator.userAgent
            );

            console.log(
              `📱 Canvas: Device detection - isIOS: ${isIOS}, isSafari: ${isSafari}`
            );
            console.log(
              `🌐 Canvas: navigator.share available: ${!!navigator.share}`
            );
            console.log(
              `🌐 Canvas: navigator.canShare available: ${!!(navigator as any)
                .canShare}`
            );

            const websiteUrl = "https://slingshot-camera.vercel.app/";
            const shareText = `Check out my Slingshot collage! ${websiteUrl}`;

            if (isIOS && isSafari && (navigator as any).canShare) {
              // Use iOS Safari specific share API
              const file = new File([blob], "slingshot-collage.png", {
                type: "image/png",
              });

              const shareData = {
                files: [file],
                text: shareText,
                url: websiteUrl,
              };

              console.log("📲 Canvas: Attempting iOS Safari share");

              if ((navigator as any).canShare(shareData)) {
                console.log(
                  "👍 Canvas: iOS Safari canShare returned true, calling share()"
                );
                await (navigator as any).share(shareData);
                console.log("✅ Canvas: Share completed successfully");
              } else {
                console.log("File sharing not supported on this device");
                // Fallback to regular Web Share API without files
                await navigator.share({
                  title: "Slingshot Collage",
                  text: shareText,
                  url: websiteUrl,
                });
              }
            } else if (navigator.share) {
              console.log("📲 Canvas: Attempting standard Web Share API");
              // Standard Web Share API
              const file = new File([blob], "slingshot-collage.png", {
                type: "image/png",
              });
              await navigator.share({
                files: [file],
                title: "Slingshot Collage",
                text: shareText,
                url: websiteUrl,
              });
              console.log("✅ Canvas: Share completed successfully");
            } else {
              console.log(
                "❌ Canvas: Web Share API not supported, falling back to download"
              );
              // Fallback for browsers without Web Share API - download the image
              handleDownload();
            }
          } catch (error) {
            console.error("❌ Canvas: Error sharing:", error);
            // If sharing fails, fall back to download
            handleDownload();
          }
        } else {
          console.error("❌ Canvas: Failed to create blob for sharing");
        }
      }, "image/png");
    }
  }, [images]);

  // Add a handler for directly selecting a camera device
  const handleSelectDevice = useCallback(
    (index: number) => {
      console.log(`📱 Canvas: handleSelectDevice called with index ${index}`);
      if (
        index >= 0 &&
        index < videoDevices.length &&
        index !== currentDeviceIndex
      ) {
        console.log(
          `Directly selecting camera: ${currentDeviceIndex} -> ${index}`
        );
        const selectedDevice = videoDevices[index];
        console.log(
          `Selected device: ${selectedDevice.label || "Unnamed device"} (${
            selectedDevice.deviceId
          })`
        );

        // Update current device index
        setCurrentDeviceIndex(index);

        // Force camera remount by toggling isCameraVisible
        // This ensures the camera is restarted with the new device
        setIsCameraVisible(false);
        setTimeout(() => {
          setIsCameraVisible(true);
        }, 50);
      }
    },
    [videoDevices, currentDeviceIndex]
  );

  // Add this useEffect to prevent scrolling on mobile
  useEffect(() => {
    // Function to prevent default behavior for touch events
    const preventDefault = (e: TouchEvent) => {
      console.log("🚫 Canvas: preventDefault called on TouchEvent", e.type);

      // Check if the touch is on a button or other interactive element
      const target = e.target as HTMLElement;
      const path = e.composedPath();

      // Allow touches on buttons, inputs, and the MenuBar
      const isInteractiveElement = path.some((el) => {
        if (el instanceof HTMLElement) {
          // Check for buttons or other interactive elements
          if (
            el.tagName === "BUTTON" ||
            el.tagName === "INPUT" ||
            el.tagName === "A" ||
            el.tagName === "SELECT" ||
            (el.classList.contains("fixed") &&
              el.classList.contains("bottom-4")) // MenuBar
          ) {
            return true;
          }
        }
        return false;
      });

      // Only prevent default if not on an interactive element
      if (!isInteractiveElement) {
        e.preventDefault();
      } else {
        console.log(
          "👍 Canvas: Allowing touch event on interactive element",
          target.tagName
        );
      }
    };

    // Add meta viewport tag to prevent scaling
    const setViewportMeta = () => {
      let viewportMeta = document.querySelector(
        'meta[name="viewport"]'
      ) as HTMLMetaElement;
      if (!viewportMeta) {
        viewportMeta = document.createElement("meta");
        viewportMeta.name = "viewport";
        document.head.appendChild(viewportMeta);
      }
      viewportMeta.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
      );
    };

    // Set viewport meta tag
    setViewportMeta();

    // Prevent scrolling on the document body
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.height = "100%";
    document.body.style.touchAction = "none";

    // Add event listeners to prevent default touch behavior
    document.addEventListener("touchmove", preventDefault, { passive: false });
    document.addEventListener("touchstart", preventDefault, { passive: false });

    return () => {
      // Cleanup when component unmounts
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
      document.body.style.touchAction = "";
      document.removeEventListener("touchmove", preventDefault);
      document.removeEventListener("touchstart", preventDefault);
    };
  }, []);

  // Add this to the useEffect where touch events are set up
  useEffect(() => {
    // Debug touch events
    console.log("🖐️ Setting up touch event debugging");

    const debugTouchStart = (e: TouchEvent) => {
      console.log("👆 touchstart event detected", {
        target: e.target,
        touches: e.touches.length,
        path: e
          .composedPath()
          .map((el) => {
            if (el instanceof HTMLElement) {
              return `${el.tagName}${el.id ? "#" + el.id : ""}${
                el.className ? "." + el.className.replace(/\s+/g, ".") : ""
              }`;
            }
            return String(el);
          })
          .join(" > "),
      });
    };

    const debugTouchEnd = (e: TouchEvent) => {
      console.log("👇 touchend event detected", {
        target: e.target,
        touches: e.touches.length,
      });
    };

    document.addEventListener("touchstart", debugTouchStart, { passive: true });
    document.addEventListener("touchend", debugTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", debugTouchStart);
      document.removeEventListener("touchend", debugTouchEnd);
    };
  }, []);

  return (
    <div
      ref={canvasRef}
      className="fixed inset-0 w-screen h-screen bg-white cursor-crosshair touch-none"
      style={{
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        touchAction: "none",
      }}
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
        onDownload={handleDownload}
        onClearCanvas={handleClearCanvas}
        videoDevices={videoDevices}
        currentDeviceIndex={currentDeviceIndex}
        onSelectDevice={handleSelectDevice}
      />
    </div>
  );
};
