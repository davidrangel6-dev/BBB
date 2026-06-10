const KEY = 'bbb-saved-designs'

export function loadSavedDesigns() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {}
  } catch {
    return {}
  }
}

export function persistDesign(design) {
  const all = loadSavedDesigns()
  all[design.name] = design
  localStorage.setItem(KEY, JSON.stringify(all))
  return all
}

export function removeDesign(name) {
  const all = loadSavedDesigns()
  delete all[name]
  localStorage.setItem(KEY, JSON.stringify(all))
  return all
}

export function exportDesignFile(design) {
  const blob = new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${slug(design.name)}.bootdesign.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

export function slug(name) {
  return name.trim().replace(/\s+/g, '-').toLowerCase() || 'untitled'
}
