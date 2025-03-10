"use client"

import type React from "react"
import { useRef, useEffect } from "react"
import type { Image as ImageType } from "../types"

interface PastedImageProps {
  image: ImageType
}

export const PastedImage: React.FC<PastedImageProps> = ({ image }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        const img = new Image()
        img.onload = () => {
          canvas.width = image.size.width
          canvas.height = image.size.height

          // Clear the canvas before drawing
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          // Draw the image exactly as it was saved
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        }
        img.src = image.src
      }
    }
  }, [image])

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
  )
}

