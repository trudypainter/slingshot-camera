"use client";

import type React from "react";
import { useRef, useEffect } from "react";
import type { Image as ImageType } from "../types";

interface PastedImageProps {
  image: ImageType;
}

export const PastedImage: React.FC<PastedImageProps> = ({ image }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      console.log(`🖼️ RENDER DEBUG - PastedImage for id: ${image.id}`);
      console.log(
        `🖼️ RENDER DEBUG - Image size in DOM: ${image.size.width}x${image.size.height}`
      );
      console.log(`🖼️ RENDER DEBUG - Image mirrored: ${image.mirrored}`);

      // Log data URL length as a proxy for image quality/resolution
      console.log(
        `🖼️ RENDER DEBUG - Image data URL length: ${image.src.length} characters`
      );

      const ctx = canvas.getContext("2d");
      if (ctx) {
        const img = new Image();

        // Add load event to log the natural dimensions of the loaded image
        img.onload = () => {
          console.log(
            `🖼️ RENDER DEBUG - Loaded image natural dimensions: ${img.naturalWidth}x${img.naturalHeight}`
          );

          // Get device pixel ratio for high-DPI displays
          const dpr = window.devicePixelRatio || 1;
          console.log(`🖼️ RENDER DEBUG - Device pixel ratio: ${dpr}`);

          // Set the canvas dimensions at higher resolution
          const displayWidth = image.size.width;
          const displayHeight = image.size.height;
          console.log(
            `🖼️ RENDER DEBUG - Display dimensions: ${displayWidth}x${displayHeight}`
          );

          // Set the canvas display size to match the image size
          canvas.style.width = `${displayWidth}px`;
          canvas.style.height = `${displayHeight}px`;

          // Set the canvas internal dimensions to account for device pixel ratio
          canvas.width = Math.floor(displayWidth * dpr);
          canvas.height = Math.floor(displayHeight * dpr);
          console.log(
            `🖼️ RENDER DEBUG - Canvas internal dimensions: ${canvas.width}x${canvas.height}`
          );

          // Scale the context to ensure correct drawing
          ctx.scale(dpr, dpr);
          console.log(`🖼️ RENDER DEBUG - Context scaled by ${dpr}x`);

          // Clear the canvas before drawing
          ctx.clearRect(0, 0, displayWidth, displayHeight);

          // Apply mirroring if needed
          if (image.mirrored) {
            console.log(
              `🖼️ RENDER DEBUG - Rendering mirrored image (from front camera)`
            );
            // No need to mirror again in the PastedImage component
            // as the mirroring was already applied during capture
          } else {
            console.log(
              `🖼️ RENDER DEBUG - Rendering non-mirrored image (from back camera)`
            );
            // No transformation needed for back camera images
          }

          // Draw the image exactly as it was saved
          ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

          console.log(
            `🖼️ RENDER DEBUG - Rendered image at ${dpr}x resolution (${canvas.width}x${canvas.height})`
          );

          // Try to estimate the effective resolution
          const effectiveResolution = Math.min(
            img.naturalWidth / displayWidth,
            img.naturalHeight / displayHeight
          );
          console.log(
            `🖼️ RENDER DEBUG - Effective resolution scale: ~${effectiveResolution.toFixed(
              2
            )}x`
          );

          // Check if we're potentially losing resolution
          if (effectiveResolution > dpr) {
            console.log(
              `⚠️ RENDER DEBUG - Potential resolution loss! Image has more detail (${effectiveResolution.toFixed(
                2
              )}x) than we're displaying (${dpr}x)`
            );
          } else if (effectiveResolution < 1) {
            console.log(
              `⚠️ RENDER DEBUG - Image appears to be upscaled! Original resolution (${effectiveResolution.toFixed(
                2
              )}x) is lower than display size`
            );
          }
        };

        // Add error handler
        img.onerror = (err) => {
          console.error(`❌ RENDER DEBUG - Error loading image:`, err);
        };

        img.src = image.src;
      } else {
        console.error(`❌ RENDER DEBUG - Failed to get canvas context`);
      }
    } else {
      console.error(`❌ RENDER DEBUG - Canvas ref is null`);
    }
  }, [image]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute"
      style={{
        left: image.position.x,
        top: image.position.y,
        width: image.size.width,
        height: image.size.height,
      }}
    />
  );
};
