import { useEffect, useState } from 'react'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import Viewport from './three/Viewport'
import ControlPanel from './components/ControlPanel'
import { DEFAULT_DESIGN } from './data/presets'
import { downloadSnapshot } from './utils/snapshot'
import {
  exportDesignFile,
  loadSavedDesigns,
  persistDesign,
  removeDesign,
} from './utils/storage'

const AUTOSAVE_KEY = 'bbb-current-design'

function initialDesign() {
  try {
    const saved = JSON.parse(localStorage.getItem(AUTOSAVE_KEY))
    if (saved) return { ...DEFAULT_DESIGN, ...saved }
  } catch {
    /* fall through to default */
  }
  return DEFAULT_DESIGN
}

export default function App() {
  const [design, setDesign] = useState(initialDesign)
  const [savedDesigns, setSavedDesigns] = useState(loadSavedDesigns)
  const [customScene, setCustomScene] = useState(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(design))
  }, [design])

  // Downscale imported pattern images so designs stay small enough to
  // autosave in the browser.
  function importPatternFile(file) {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const max = 512
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(img.width * scale))
        canvas.height = Math.max(1, Math.round(img.height * scale))
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        setDesign((d) => ({ ...d, stitchPattern: canvas.toDataURL('image/png') }))
      }
      img.onerror = () => alert('Could not read that image. Try a PNG, JPG, or SVG.')
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  function importDesignFile(file) {
    file.text().then((text) => {
      try {
        const parsed = JSON.parse(text)
        setDesign({ ...DEFAULT_DESIGN, ...parsed })
      } catch {
        alert('That file is not a valid boot design JSON.')
      }
    })
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (/\.(glb|gltf)$/i.test(file.name)) {
      file.arrayBuffer().then((buffer) => {
        new GLTFLoader().parse(
          buffer,
          '',
          (gltf) => setCustomScene(gltf.scene),
          () => alert('Could not read that model. Export it as a .glb and try again.'),
        )
      })
    } else if (/\.json$/i.test(file.name)) {
      importDesignFile(file)
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">BBB</span>
          <div>
            <h1>Bluebonnet Boot Co.</h1>
            <p>Mockup Studio</p>
          </div>
        </div>
        <span className="tagline">Bespoke, handmade in Texas</span>
      </header>
      <main className="layout">
        <div
          className={`viewport ${dragging ? 'dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <Viewport design={design} customScene={customScene} />
          {dragging && <div className="drop-hint">Drop a .glb model or design JSON</div>}
        </div>
        <ControlPanel
          design={design}
          setDesign={setDesign}
          savedDesigns={savedDesigns}
          onSave={() => setSavedDesigns(persistDesign(design))}
          onLoad={(name) => setDesign({ ...DEFAULT_DESIGN, ...savedDesigns[name] })}
          onDelete={(name) => setSavedDesigns(removeDesign(name))}
          onSnapshot={() => downloadSnapshot(design.name)}
          onExport={() => exportDesignFile(design)}
          onImport={importDesignFile}
          onImportPattern={importPatternFile}
          hasCustomModel={Boolean(customScene)}
          onClearCustomModel={() => setCustomScene(null)}
        />
      </main>
    </div>
  )
}
