// Lets TypeScript accept the <model-viewer> element in JSX.
// The element comes from @google/model-viewer, which is loaded on demand (see HeartViewer.tsx).
import type { CSSProperties, DetailedHTMLProps, HTMLAttributes } from 'react'

interface ModelViewerAttributes {
  src?: string
  alt?: string
  loading?: 'auto' | 'lazy' | 'eager'
  reveal?: 'auto' | 'manual'
  'camera-controls'?: boolean
  'auto-rotate'?: boolean
  'touch-action'?: 'none' | 'pan-x' | 'pan-y'
  'interaction-prompt'?: 'auto' | 'none'
  'environment-image'?: string
  'shadow-intensity'?: string
  'interpolation-decay'?: string
  'camera-orbit'?: string
  'camera-target'?: string
  'field-of-view'?: string
  exposure?: string
  style?: CSSProperties
}

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & ModelViewerAttributes
    }
  }
}
