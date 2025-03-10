import type React from "react"
import type { Image as ImageType } from "../types"

interface ImageProps {
  image: ImageType
}

export const Image: React.FC<ImageProps> = ({ image }) => {
  return (
    <div
      className="absolute"
      style={{
        left: image.position.x,
        top: image.position.y,
        width: image.size.width,
        height: image.size.height,
      }}
    >
      <img src={image.src || "/placeholder.svg"} alt="Captured" className="w-full h-full object-cover" />
    </div>
  )
}

