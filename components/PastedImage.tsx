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
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          // Get device pixel ratio for high-DPI displays
          const dpr = window.devicePixelRatio || 1;

          // Set the canvas dimensions at higher resolution
          const displayWidth = image.size.width;
          const displayHeight = image.size.height;

          // Set the canvas display size to match the image size
          canvas.style.width = `${displayWidth}px`;
          canvas.style.height = `${displayHeight}px`;

          // Set the canvas internal dimensions to account for device pixel ratio
          canvas.width = Math.floor(displayWidth * dpr);
          canvas.height = Math.floor(displayHeight * dpr);

          // Scale the context to ensure correct drawing
          ctx.scale(dpr, dpr);

          // Clear the canvas before drawing
          ctx.clearRect(0, 0, displayWidth, displayHeight);

          // Draw the image exactly as it was saved
          ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

          console.log(
            `Rendered image at ${dpr}x resolution (${canvas.width}x${canvas.height})`
          );
        };
        img.src = image.src;
      }
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
