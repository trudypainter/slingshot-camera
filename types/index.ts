export interface Point {
  x: number
  y: number
}

export interface Image {
  id: string
  src: string
  position: Point
  size: {
    width: number
    height: number
  }
  mirrored?: boolean
}

