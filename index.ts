export interface DataItem {
  name: string
  display?: string
  color?: string
  to?: string[]
  from?: string[]
  dashed?: boolean
  faded?: boolean
  animateStop?: boolean
  link?: string
  x?: number
  y?: number
}

export interface SavedPositions {
  pos: Record<string, { x: number, y: number }>
  view: { x: number, y: number }
  scale: number
}
