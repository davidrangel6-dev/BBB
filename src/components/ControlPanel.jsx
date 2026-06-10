import { useRef } from 'react'
import {
  FINISHES,
  HEELS,
  LEATHERS,
  TEXTURES,
  THREADS,
  TOE_SHAPES,
} from '../data/presets'

function SwatchRow({ label, options, value, onPick }) {
  return (
    <div className="field">
      <div className="field-label">
        {label}
        <span className="field-value">{options.find((o) => o.id === value)?.name}</span>
      </div>
      <div className="swatches">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            title={o.name}
            className={`swatch ${o.id === value ? 'selected' : ''}`}
            style={{ background: o.color }}
            onClick={() => onPick(o.id)}
          />
        ))}
      </div>
    </div>
  )
}

function SegmentedRow({ label, options, value, onPick }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      <div className="segmented">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            className={o.id === value ? 'selected' : ''}
            onClick={() => onPick(o.id)}
          >
            {o.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ControlPanel({
  design,
  setDesign,
  savedDesigns,
  onSave,
  onLoad,
  onDelete,
  onSnapshot,
  onExport,
  onImport,
  onImportPattern,
  hasCustomModel,
  onClearCustomModel,
}) {
  const fileRef = useRef(null)
  const patternRef = useRef(null)
  const set = (key) => (value) => setDesign((d) => ({ ...d, [key]: value }))
  const savedNames = Object.keys(savedDesigns)

  return (
    <aside className="panel">
      <section>
        <h2>Design</h2>
        <input
          className="name-input"
          value={design.name}
          onChange={(e) => set('name')(e.target.value)}
          placeholder="Design name"
        />
      </section>

      <section>
        <h2>Leather</h2>
        <SwatchRow label="Shaft" options={LEATHERS} value={design.shaft} onPick={set('shaft')} />
        <SegmentedRow
          label="Shaft hide"
          options={TEXTURES}
          value={design.shaftTexture}
          onPick={set('shaftTexture')}
        />
        <SwatchRow label="Vamp & toe" options={LEATHERS} value={design.vamp} onPick={set('vamp')} />
        <SegmentedRow
          label="Vamp hide"
          options={TEXTURES}
          value={design.vampTexture}
          onPick={set('vampTexture')}
        />
        <SwatchRow label="Heel & sole" options={LEATHERS} value={design.heel} onPick={set('heel')} />
        <SwatchRow label="Pull straps" options={LEATHERS} value={design.straps} onPick={set('straps')} />
        <SegmentedRow label="Finish" options={FINISHES} value={design.finish} onPick={set('finish')} />
      </section>

      <section>
        <h2>Stitching</h2>
        <SwatchRow label="Thread" options={THREADS} value={design.thread} onPick={set('thread')} />
        <div className="field">
          <div className="field-label">Shaft pattern</div>
          <div className="actions">
            <button type="button" onClick={() => patternRef.current?.click()}>
              Import pattern
            </button>
            <button
              type="button"
              disabled={!design.stitchPattern}
              onClick={() => set('stitchPattern')(null)}
            >
              Classic flames
            </button>
            <input
              ref={patternRef}
              type="file"
              accept="image/*,.svg"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onImportPattern(file)
                e.target.value = ''
              }}
            />
          </div>
          {design.stitchPattern && (
            <img className="pattern-preview" src={design.stitchPattern} alt="Stitch pattern" />
          )}
          <p className="hint">
            Upload a stitch design as an image — black-on-white line art works
            best. It's drawn on both sides of the shaft in the thread color.
          </p>
        </div>
      </section>

      <section>
        <h2>Shape</h2>
        <SegmentedRow label="Toe" options={TOE_SHAPES} value={design.toe} onPick={set('toe')} />
        <SegmentedRow label="Heel" options={HEELS} value={design.heelStyle} onPick={set('heelStyle')} />
        <div className="field">
          <div className="field-label">
            Shaft height
            <span className="field-value">{design.shaftHeight}&Prime;</span>
          </div>
          <input
            type="range"
            min="11"
            max="16"
            step="0.5"
            value={design.shaftHeight}
            onChange={(e) => set('shaftHeight')(Number(e.target.value))}
          />
        </div>
        {hasCustomModel && (
          <p className="hint">
            Shape controls apply to the placeholder boot only.{' '}
            <button type="button" className="link" onClick={onClearCustomModel}>
              Back to placeholder
            </button>
          </p>
        )}
      </section>

      <section>
        <h2>Share</h2>
        <div className="actions">
          <button type="button" className="primary" onClick={onSnapshot}>
            Snapshot PNG
          </button>
          <button type="button" onClick={onSave}>Save design</button>
          <button type="button" onClick={onExport}>Export JSON</button>
          <button type="button" onClick={() => fileRef.current?.click()}>Import JSON</button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onImport(file)
              e.target.value = ''
            }}
          />
        </div>
      </section>

      {savedNames.length > 0 && (
        <section>
          <h2>Saved designs</h2>
          <ul className="saved-list">
            {savedNames.map((name) => (
              <li key={name}>
                <button type="button" className="link" onClick={() => onLoad(name)}>
                  {name}
                </button>
                <button
                  type="button"
                  className="delete"
                  title={`Delete ${name}`}
                  onClick={() => onDelete(name)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2>Custom model</h2>
        <p className="hint">
          Drag a .glb boot model onto the viewport to swap out the placeholder.
          Name its meshes shaft, vamp, heel, sole, strap, or stitch and the
          leather picker will drive them automatically.
        </p>
      </section>
    </aside>
  )
}
