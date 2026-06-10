import { slug } from './storage'

// Works because the Canvas is created with preserveDrawingBuffer: true.
export function downloadSnapshot(designName) {
  const canvas = document.querySelector('.viewport canvas')
  if (!canvas) return
  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  a.download = `${slug(designName)}-mockup.png`
  a.click()
}
