// Leather, thread, and finish presets for the mockup studio.
// Leather palette follows Tandy Leather's calfskin line: natural veg-tan
// tooling calf plus their classic dye colors (tandyleather.com).

export const LEATHERS = [
  { id: 'natural', name: 'Natural Veg-Tan', color: '#d9b386' },
  { id: 'buckskin', name: 'Buckskin', color: '#c8a368' },
  { id: 'tan', name: 'Tan', color: '#b8824a' },
  { id: 'saddle-tan', name: 'Saddle Tan', color: '#a86a32' },
  { id: 'whiskey', name: 'Whiskey', color: '#8e5a27' },
  { id: 'chestnut', name: 'Chestnut', color: '#6f4423' },
  { id: 'briar', name: 'Briar Brown', color: '#5d4030' },
  { id: 'chocolate', name: 'Chocolate', color: '#462e21' },
  { id: 'mahogany', name: 'Dark Mahogany', color: '#54271e' },
  { id: 'burgundy', name: 'Burgundy', color: '#5a2230' },
  { id: 'navy', name: 'Navy', color: '#2b3a5e' },
  { id: 'bluebonnet', name: 'Bluebonnet Blue', color: '#33518f' },
  { id: 'bone', name: 'Bone', color: '#ddd2bb' },
  { id: 'black', name: 'Black', color: '#1d1c1d' },
]

export const THREADS = [
  { id: 'cream', name: 'Cream', color: '#e9e0c8' },
  { id: 'white', name: 'White', color: '#f2f2ee' },
  { id: 'marigold', name: 'Marigold', color: '#d9a13b' },
  { id: 'turquoise', name: 'Turquoise', color: '#3fae9f' },
  { id: 'bluebonnet', name: 'Bluebonnet', color: '#5d7fc4' },
  { id: 'rust', name: 'Rust', color: '#b05a2f' },
  { id: 'black', name: 'Black', color: '#222222' },
]

export const FINISHES = [
  { id: 'matte', name: 'Matte', roughness: 0.85, clearcoat: 0 },
  { id: 'classic', name: 'Classic', roughness: 0.6, clearcoat: 0.15 },
  { id: 'polished', name: 'Polished', roughness: 0.35, clearcoat: 0.7 },
]

export const TOE_SHAPES = [
  { id: 'round', name: 'Round' },
  { id: 'snip', name: 'Snip' },
  { id: 'square', name: 'Square' },
]

export const HEELS = [
  { id: 'riding', name: 'Riding', height: 1.1 },
  { id: 'standard', name: 'Standard', height: 1.6 },
  { id: 'fashion', name: 'Fashion', height: 2.2 },
]

export const DEFAULT_DESIGN = {
  name: 'Untitled Boot',
  shaft: 'bluebonnet',
  vamp: 'chestnut',
  heel: 'chocolate',
  straps: 'chestnut',
  thread: 'cream',
  finish: 'classic',
  toe: 'round',
  heelStyle: 'standard',
  shaftHeight: 13.5,
  stitchPattern: null,
}

export function leatherById(id) {
  return LEATHERS.find((l) => l.id === id) ?? LEATHERS[5]
}

export function threadById(id) {
  return THREADS.find((t) => t.id === id) ?? THREADS[0]
}

export function finishById(id) {
  return FINISHES.find((f) => f.id === id) ?? FINISHES[1]
}

export function heelById(id) {
  return HEELS.find((h) => h.id === id) ?? HEELS[1]
}
