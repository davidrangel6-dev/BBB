// Leather, thread, and finish presets for the mockup studio.
// Hex values approximate dyed full-grain leather tones.

export const LEATHERS = [
  { id: 'chestnut', name: 'Chestnut', color: '#7a4a26' },
  { id: 'whiskey', name: 'Whiskey', color: '#9a6230' },
  { id: 'caramel', name: 'Caramel', color: '#b07a3e' },
  { id: 'black-cherry', name: 'Black Cherry', color: '#4b1f24' },
  { id: 'crimson', name: 'Crimson', color: '#7e2528' },
  { id: 'espresso', name: 'Espresso', color: '#3a2a20' },
  { id: 'midnight', name: 'Midnight Black', color: '#1b1b1d' },
  { id: 'bone', name: 'Bone', color: '#d8cdb4' },
  { id: 'sage', name: 'Sage', color: '#6e7b5e' },
  { id: 'bluebonnet', name: 'Bluebonnet Blue', color: '#33518f' },
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
  heel: 'espresso',
  straps: 'chestnut',
  thread: 'cream',
  finish: 'classic',
  toe: 'round',
  heelStyle: 'standard',
  shaftHeight: 13.5,
}

export function leatherById(id) {
  return LEATHERS.find((l) => l.id === id) ?? LEATHERS[0]
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
