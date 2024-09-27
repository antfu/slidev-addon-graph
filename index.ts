/// <reference types="vite/client" />
import type { NodeOptions } from 'vis-network'

export interface DataItem extends NodeOptions {
  name: string
  display?: string
  color?: string
  to?: string[]
  from?: string[]
  related?: string[]
  dashed?: boolean
  faded?: boolean
  clicks?: number | false
  link?: string
  x?: number
  y?: number
}

export interface SavedPositions {
  pos: Record<string, { x: number, y: number }>
  view: { x: number, y: number }
  scale: number
}
