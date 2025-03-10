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
  const [actualFacingMode, setActualFacingMode] =
    useState<string>("environment");

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
        // Request permission to access media devices
        await navigator.mediaDevices.getUserMedia({ video: true });

        // Get list of video input devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(
          (device) => device.kind === "videoinput"
        );

        console.log("Available video devices:", videoInputs);

        // Check if we're on iOS Safari
        const isIOS =
          /iPad|iPhone|iPod/.test(navigator.userAgent) &&
          !(window as any).MSStream;
        const isSafari = /^((?!chrome|android).)*safari/i.test(
          navigator.userAgent
        );
        const isIOSSafari = isIOS && isSafari;

        if (isIOSSafari && videoInputs.length > 2) {
          console.log(
            "iOS Safari detected with multiple cameras, filtering to front and back only"
          );

          // Find front camera (selfie)
          const frontCamera = videoInputs.find(
            (device) =>
              device.label.toLowerCase().includes("front") ||
              device.label.toLowerCase().includes("selfie") ||
              device.label.toLowerCase().includes("user")
          );

          // Find basic back camera (prefer "Back Camera" if available)
          const backCamera =
            videoInputs.find((device) => device.label === "Back Camera") ||
            videoInputs.find(
              (device) =>
                device.label.toLowerCase().includes("back") &&
                !device.label.toLowerCase().includes("ultra") &&
                !device.label.toLowerCase().includes("wide") &&
                !device.label.toLowerCase().includes("telephoto") &&
                !device.label.toLowerCase().includes("triple") &&
                !device.label.toLowerCase().includes("dual")
            );

          // Create filtered list with back camera first (for iOS)
          const filteredDevices = [];
          if (backCamera) filteredDevices.push(backCamera); // Put back camera first
          if (frontCamera && frontCamera !== backCamera)
            filteredDevices.push(frontCamera);

          // If we couldn't find specific cameras, just use the first two
          if (filteredDevices.length === 0) {
            console.log(
              "Could not identify specific cameras, using first two devices"
            );
            filteredDevices.push(videoInputs[0]);
            if (videoInputs.length > 1) filteredDevices.push(videoInputs[1]);
          }

          console.log("Filtered video devices for iOS:", filteredDevices);
          setVideoDevices(filteredDevices);
        } else {
          // For non-iOS or when there are only 1-2 cameras, use all available devices
          // But for mobile devices, try to identify and prioritize the back camera
          if (isMobile && videoInputs.length > 1) {
            // Try to find the back camera
            const backCameraIndex = videoInputs.findIndex(
              (device) =>
                device.label.toLowerCase().includes("back") ||
                device.label.toLowerCase().includes("environment") ||
                device.label.toLowerCase().includes("rear")
            );

            if (backCameraIndex !== -1) {
              console.log(
                `Found back camera at index ${backCameraIndex}, setting as default`
              );
              // Reorder the array to put the back camera first
              const reorderedDevices = [...videoInputs];
              const backCamera = reorderedDevices.splice(backCameraIndex, 1)[0];
              reorderedDevices.unshift(backCamera);
              setVideoDevices(reorderedDevices);
            } else {
              setVideoDevices(videoInputs);
            }
          } else {
            setVideoDevices(videoInputs);
          }
        }

        // Set initial device index to 0 (first camera)
        setCurrentDeviceIndex(0);
      } catch (error) {
        console.error("Error accessing camera:", error);
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

      // Check if we're on iOS Safari
      const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as any).MSStream;
      const isSafari = /^((?!chrome|android).)*safari/i.test(
        navigator.userAgent
      );
      const isIOSSafari = isIOS && isSafari;

      if (isIOSSafari && videoInputs.length > 2) {
        console.log(
          "iOS Safari detected with multiple cameras, filtering to front and back only"
        );

        // Find front camera (selfie)
        const frontCamera = videoInputs.find(
          (device) =>
            device.label.toLowerCase().includes("front") ||
            device.label.toLowerCase().includes("selfie") ||
            device.label.toLowerCase().includes("user")
        );

        // Find basic back camera (prefer "Back Camera" if available)
        const backCamera =
          videoInputs.find((device) => device.label === "Back Camera") ||
          videoInputs.find(
            (device) =>
              device.label.toLowerCase().includes("back") &&
              !device.label.toLowerCase().includes("ultra") &&
              !device.label.toLowerCase().includes("wide") &&
              !device.label.toLowerCase().includes("telephoto") &&
              !device.label.toLowerCase().includes("triple") &&
              !device.label.toLowerCase().includes("dual")
          );

        // Create filtered list with back camera first (for iOS)
        const filteredDevices = [];
        if (backCamera) filteredDevices.push(backCamera); // Put back camera first
        if (frontCamera && frontCamera !== backCamera)
          filteredDevices.push(frontCamera);

        // If we couldn't find specific cameras, just use the first two
        if (filteredDevices.length === 0) {
          console.log(
            "Could not identify specific cameras, using first two devices"
          );
          filteredDevices.push(videoInputs[0]);
          if (videoInputs.length > 1) filteredDevices.push(videoInputs[1]);
        }

        console.log("Filtered video devices for iOS:", filteredDevices);
        setVideoDevices(filteredDevices);
      } else {
        // For non-iOS or when there are only 1-2 cameras, use all available devices
        // But for mobile devices, try to identify and prioritize the back camera
        if (isMobile && videoInputs.length > 1) {
          // Try to find the back camera
          const backCameraIndex = videoInputs.findIndex(
            (device) =>
              device.label.toLowerCase().includes("back") ||
              device.label.toLowerCase().includes("environment") ||
              device.label.toLowerCase().includes("rear")
          );

          if (backCameraIndex !== -1) {
            console.log(
              `Found back camera at index ${backCameraIndex}, setting as default`
            );
            // Reorder the array to put the back camera first
            const reorderedDevices = [...videoInputs];
            const backCamera = reorderedDevices.splice(backCameraIndex, 1)[0];
            reorderedDevices.unshift(backCamera);
            setVideoDevices(reorderedDevices);
          } else {
            setVideoDevices(videoInputs);
          }
        } else {
          setVideoDevices(videoInputs);
        }
      }
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
  const startDrag = useCallback(
    (x: number, y: number) => {
      if (canvasRef.current) {
        setDragStart({ x, y });
        setDragEnd({ x, y });
        setIsDragging(true);

        // Make sure we're using the back camera on mobile devices when first starting
        if (!isCameraVisible && isMobile) {
          console.log("Starting drag with back camera on mobile");
          // Ensure we're using the first device (which should be the back camera based on our ordering)
          setCurrentDeviceIndex(0);
        }

        setIsCameraVisible(true);
        setViewfinderRect({ left: x, top: y, width: 0, height: 0 });
      }
    },
    [isCameraVisible, isMobile]
  );

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

          // Log device information
          const isIOS =
            /iPad|iPhone|iPod/.test(navigator.userAgent) &&
            !(window as any).MSStream;
          const isSafari = /^((?!chrome|android).)*safari/i.test(
            navigator.userAgent
          );
          console.log(
            `📱 CAPTURE DEBUG - Device: iOS=${isIOS}, Safari=${isSafari}, Mobile=${isMobile}, DPR=${window.devicePixelRatio}`
          );

          if (context && video) {
            // Log video element properties
            console.log(`📹 CAPTURE DEBUG - Video element:`, {
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              offsetWidth: video.offsetWidth,
              offsetHeight: video.offsetHeight,
              clientWidth: video.clientWidth,
              clientHeight: video.clientHeight,
              style: {
                width: video.style.width,
                height: video.style.height,
              },
            });

            // Log video tracks information
            if (video.srcObject instanceof MediaStream) {
              const videoTracks = video.srcObject.getVideoTracks();
              if (videoTracks.length > 0) {
                const track = videoTracks[0];
                const settings = track.getSettings();
                console.log(
                  `📹 CAPTURE DEBUG - Video track settings:`,
                  settings
                );
                console.log(
                  `📹 CAPTURE DEBUG - Video track constraints:`,
                  track.getConstraints()
                );
              }
            }

            const viewfinderWidth = Math.abs(dragEnd.x - dragStart.x);
            const viewfinderHeight = Math.abs(dragEnd.y - dragStart.y);
            console.log(
              `🔍 CAPTURE DEBUG - Viewfinder dimensions: ${viewfinderWidth}x${viewfinderHeight}`
            );

            // Determine the scale factor based on device
            // Use 3x scale on mobile for higher quality captures
            const scaleFactor = isMobile ? 3 : 1;
            console.log(
              `🔍 CAPTURE DEBUG - Using scale factor: ${scaleFactor}x for image capture`
            );

            // Set canvas size to match the viewfinder, but scaled up for higher resolution
            canvas.width = viewfinderWidth * scaleFactor;
            canvas.height = viewfinderHeight * scaleFactor;
            console.log(
              `🖼️ CAPTURE DEBUG - Canvas dimensions: ${canvas.width}x${canvas.height}`
            );

            // Calculate the aspect ratios
            const viewfinderAspectRatio = viewfinderWidth / viewfinderHeight;
            const videoAspectRatio = video.videoWidth / video.videoHeight;
            console.log(
              `📐 CAPTURE DEBUG - Aspect ratios: viewfinder=${viewfinderAspectRatio.toFixed(
                2
              )}, video=${videoAspectRatio.toFixed(2)}`
            );

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

            console.log(
              `🎯 CAPTURE DEBUG - Source rectangle: x=${sx.toFixed(
                0
              )}, y=${sy.toFixed(0)}, w=${sw.toFixed(0)}, h=${sh.toFixed(0)}`
            );
            console.log(
              `🎯 CAPTURE DEBUG - Destination rectangle: x=${dx}, y=${dy}, w=${dw}, h=${dh}`
            );

            // Check if we should mirror the image
            // Only mirror for front-facing cameras
            const shouldMirror = actualFacingMode !== "environment";

            console.log(
              `📸 CAPTURE DEBUG - Camera facing mode: ${actualFacingMode}, Should mirror: ${shouldMirror}`
            );
            console.log(
              `📸 CAPTURE DEBUG - Video dimensions: ${video.videoWidth}x${video.videoHeight}, Canvas dimensions: ${canvas.width}x${canvas.height}`
            );

            // Scale the context to match our desired resolution
            context.scale(scaleFactor, scaleFactor);
            console.log(`🔍 CAPTURE DEBUG - Context scaled by ${scaleFactor}x`);

            if (shouldMirror) {
              // Mirror the image horizontally for front camera
              context.translate(viewfinderWidth, 0);
              context.scale(-1, 1);
              console.log(
                `🔄 CAPTURE DEBUG - Applied horizontal mirroring for front camera`
              );

              // Draw the video onto the canvas, properly cropped and positioned
              context.drawImage(
                video,
                sx,
                sy,
                sw,
                sh, // Source rectangle (what part of the video to capture)
                0,
                0,
                viewfinderWidth,
                viewfinderHeight // Destination rectangle (where to place it on the canvas)
              );
            } else {
              // For back camera, don't mirror
              console.log(
                `🔄 CAPTURE DEBUG - Using back camera - not mirroring the image`
              );
              context.drawImage(
                video,
                sx,
                sy,
                sw,
                sh, // Source rectangle (what part of the video to capture)
                0,
                0,
                viewfinderWidth,
                viewfinderHeight // Destination rectangle (where to place it on the canvas)
              );
            }

            // Create a high-quality JPEG with minimal compression
            const imageQuality = 0.95; // 95% quality
            console.log(
              `💾 CAPTURE DEBUG - Creating image with quality: ${imageQuality}`
            );

            // Get the data URL and log its length as a proxy for size/quality
            const dataUrl = canvas.toDataURL("image/jpeg", imageQuality);
            console.log(
              `💾 CAPTURE DEBUG - Data URL length: ${dataUrl.length} characters`
            );

            // Try to estimate the resolution from the data URL size
            const estimatedResolution = Math.sqrt(dataUrl.length / 4);
            console.log(
              `💾 CAPTURE DEBUG - Estimated image resolution: ~${estimatedResolution.toFixed(
                0
              )} pixels per side`
            );

            const newImage: ImageType = {
              id: newImageId,
              src: dataUrl,
              position: {
                x: Math.min(dragStart.x, dragEnd.x),
                y: Math.min(dragStart.y, dragEnd.y),
              },
              size: {
                width: viewfinderWidth,
                height: viewfinderHeight,
              },
              mirrored: shouldMirror,
            };

            console.log(`✅ CAPTURE DEBUG - Final image added to canvas:`, {
              id: newImageId,
              position: newImage.position,
              size: newImage.size,
              mirrored: shouldMirror,
              dataUrlLength: dataUrl.length,
            });

            setImages((prevImages) => [...prevImages, newImage]);
          } else {
            console.error(
              `❌ CAPTURE DEBUG - Failed to get context or video element`
            );
          }
        }
      }
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    setViewfinderRect({ left: 0, top: 0, width: 0, height: 0 });
  }, [isDragging, dragStart, dragEnd, actualFacingMode, isMobile]);

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

  // Create a high-resolution canvas for export
  const createHighResCanvas = (images: ImageType[], scale: number = 2) => {
    // For mobile devices, use a higher scale factor unless explicitly specified
    if (isMobile && scale === 2) {
      scale = 3; // Use 3x scale for mobile by default
      console.log(
        `Mobile device detected, increasing export resolution to ${scale}x`
      );
    }

    // Create a canvas with all images
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    // Set canvas size to match the container but at higher resolution
    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;

    console.log(
      `Creating high-res canvas at ${scale}x scale: ${canvas.width}x${canvas.height}`
    );

    // Fill with white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Scale the context to draw everything at higher resolution
    ctx.scale(scale, scale);

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

    return canvas;
  };

  const handleDownload = useCallback(() => {
    console.log("📥 Canvas: handleDownload started");
    if (images.length === 0) {
      console.log("❌ Canvas: No images to download");
      return;
    }

    // Create a high-resolution canvas (4x scale for download on mobile, 3x on desktop)
    const downloadScale = isMobile ? 4 : 3;
    console.log(
      `Using ${downloadScale}x scale for download (isMobile: ${isMobile})`
    );

    const canvas = createHighResCanvas(images, downloadScale);
    if (!canvas) {
      console.error("Failed to create canvas for download");
      return;
    }

    // Convert to blob and download with high quality
    canvas.toBlob((blob) => {
      if (blob) {
        console.log(
          `✅ Canvas: Blob created successfully for download (${blob.size} bytes)`
        );
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
  }, [images, isMobile]);

  const handleShare = useCallback(() => {
    console.log("📤 Canvas: handleShare started");
    if (images.length === 0) {
      console.log("❌ Canvas: No images to share");
      return;
    }

    // Create a high-resolution canvas (3x scale for sharing on mobile, 2x on desktop)
    const shareScale = isMobile ? 3 : 2;
    console.log(
      `Using ${shareScale}x scale for sharing (isMobile: ${isMobile})`
    );

    const canvas = createHighResCanvas(images, shareScale);
    if (!canvas) {
      console.error("Failed to create canvas for sharing");
      return;
    }

    // Convert to blob and share with high quality
    canvas.toBlob(async (blob) => {
      if (blob) {
        console.log(
          `✅ Canvas: Blob created successfully for sharing (${blob.size} bytes)`
        );
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

          const websiteUrl = "https://slingshot.trudy.computer/";
          // No additional text, just the URL

          if (isIOS && isSafari && (navigator as any).canShare) {
            // Use iOS Safari specific share API
            const file = new File([blob], "slingshot-collage.png", {
              type: "image/png",
            });

            const shareData = {
              files: [file],
              url: websiteUrl,
              // No text field to keep it minimal
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
                url: websiteUrl,
                // No title or text fields to keep it minimal
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
              url: websiteUrl,
              // No title or text fields to keep it minimal
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
  }, [images, handleDownload, isMobile]);

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

  // In the Canvas component, add a handler for facing mode changes
  const handleFacingModeChange = useCallback((facingMode: string) => {
    console.log(`Canvas received facing mode update: ${facingMode}`);
    setActualFacingMode(facingMode);
  }, []);

  // Log camera setup when component mounts or when devices/index changes
  useEffect(() => {
    if (videoDevices.length > 0) {
      const currentDevice = videoDevices[currentDeviceIndex];
      console.log(`Current camera setup:`);
      console.log(`- Device index: ${currentDeviceIndex}`);
      console.log(`- Device label: ${currentDevice?.label || "Unknown"}`);
      console.log(`- Is mobile: ${isMobile}`);
      console.log(`- Is iOS: ${/iPad|iPhone|iPod/.test(navigator.userAgent)}`);

      // Check if it's likely a back camera based on the label
      const isLikelyBackCamera =
        currentDevice?.label?.toLowerCase().includes("back") ||
        currentDevice?.label?.toLowerCase().includes("environment") ||
        currentDevice?.label?.toLowerCase().includes("rear");
      console.log(`- Is likely back camera: ${isLikelyBackCamera}`);
    }
  }, [videoDevices, currentDeviceIndex, isMobile]);

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
          <Camera
            deviceId={currentDeviceId}
            onFacingModeChange={handleFacingModeChange}
          />
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
