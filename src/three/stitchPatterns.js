// Classic western boot-top stitch patterns, drawn as black line-art on a
// transparent ground and returned as SVG data URLs. They feed the same
// shaft stitch-decal pipeline as an imported image, so selecting one wraps
// it around the shaft in the current thread color. Each motif is authored
// on the right half of the vamp and mirrored across the centerline, the
// way real boot tops are stitched — inspired by traditional Nocona-era
// templates (scroll-and-star, tulips, spread eagle) and floral inlays.

const W = 200
const H = 300

function svgDoc(inner) {
  const s =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">` +
    `<g fill="none" stroke="#111" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">` +
    inner +
    `</g></svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(s)
}

// Reflect a right-half motif across the vamp centerline (x = 100).
function mirrored(inner) {
  return inner + `<g transform="translate(200,0) scale(-1,1)">${inner}</g>`
}

// A row of little five-point stars across the collar.
function starRow(y, from, to, n) {
  let out = ''
  for (let i = 0; i < n; i++) {
    const cx = from + ((to - from) * i) / (n - 1)
    const r = 4
    let d = ''
    for (let k = 0; k <= 5; k++) {
      const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5
      const rr = k % 2 === 0 ? r : r * 0.42
      // 5-point star = 10 alternating vertices
      const a2 = -Math.PI / 2 + (k * Math.PI) / 5
      d += `${k ? 'L' : 'M'}${(cx + rr * Math.cos(a2)).toFixed(1)},${(y + rr * Math.sin(a2)).toFixed(1)} `
    }
    // proper 10-vertex star
    d = ''
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5
      const rr = k % 2 === 0 ? r : r * 0.42
      d += `${k ? 'L' : 'M'}${(cx + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)} `
    }
    out += `<path d="${d}Z"/>`
  }
  return out
}

function bigStar(cx, cy, r) {
  let d = ''
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5
    const rr = k % 2 === 0 ? r : r * 0.42
    d += `${k ? 'L' : 'M'}${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)} `
  }
  return `<path d="${d}Z"/>`
}

// Right-half motifs ---------------------------------------------------------

// Style 19: mirrored scrollwork with a star-row collar and a center star.
function scrollStar() {
  const half =
    // top scroll sweeping up then curling
    `<path d="M100,70 C 120,55 150,60 160,95 C 165,120 145,130 138,112 C 133,100 145,96 150,105"/>` +
    // lower scroll curling out to the side
    `<path d="M100,175 C 120,195 150,200 162,235 C 168,255 148,264 140,246 C 135,234 147,230 152,240"/>` +
    // connecting spine
    `<path d="M100,120 C 128,140 128,150 100,170"/>`
  return svgDoc(
    starRow(38, 118, 178, 5) +
      mirrored(half) +
      bigStar(100, 150, 15),
  )
}

// Tulips: an upper and lower tulip on flowing stems with lance leaves —
// the Nocona No. 908 boot-top motif.
function tulip(cx, cy, sc) {
  const s = sc
  return (
    `<path d="M${cx - 10 * s},${cy} Q ${cx - 12 * s},${cy - 15 * s} ${cx - 4 * s},${cy - 16 * s}"/>` +
    `<path d="M${cx + 10 * s},${cy} Q ${cx + 12 * s},${cy - 15 * s} ${cx + 4 * s},${cy - 16 * s}"/>` +
    `<path d="M${cx - 4 * s},${cy - 16 * s} Q ${cx},${cy - 24 * s} ${cx + 4 * s},${cy - 16 * s}"/>` +
    `<path d="M${cx - 10 * s},${cy} Q ${cx},${cy + 7 * s} ${cx + 10 * s},${cy}"/>`
  )
}
function leaf(x1, y1, x2, y2, bow) {
  const mx = (x1 + x2) / 2 + bow
  const my = (y1 + y2) / 2
  return (
    `<path d="M${x1},${y1} Q ${mx},${my} ${x2},${y2}"/>` +
    `<path d="M${x1},${y1} L ${((x1 + x2) / 2 + bow * 0.4).toFixed(1)},${((y1 + y2) / 2).toFixed(1)}"/>`
  )
}
function tulips() {
  const half =
    tulip(150, 78, 1.6) +
    `<path d="M150,92 C 150,120 120,132 108,172"/>` +
    leaf(138, 118, 118, 136, 12) +
    tulip(146, 232, 1.5) +
    `<path d="M146,242 C 146,268 120,258 108,208"/>` +
    leaf(134, 248, 116, 238, 10)
  return svgDoc(mirrored(half))
}

// Spread eagle: layered wing feathers rising from a center body with a
// small head and tail.
function eagle() {
  let feathers = ''
  const n = 7
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const baseY = 150 + t * 8
    const tipX = 112 + t * 74
    const tipY = 150 - 70 * (1 - Math.abs(t - 0.15)) - 8
    feathers +=
      `<path d="M104,${baseY.toFixed(0)} Q ${(tipX - 18).toFixed(0)},${(baseY - 30 - t * 30).toFixed(0)} ${tipX.toFixed(0)},${Math.max(30, tipY).toFixed(0)}"/>`
  }
  const body =
    `<path d="M100,132 Q 108,165 100,215"/>` + // breast/tail
    `<path d="M100,215 Q 96,224 100,232"/>` // tail tip
  const head =
    `<circle cx="100" cy="120" r="7"/>` +
    `<path d="M100,113 L 100,104"/>` // beak/crown hint
  return svgDoc(mirrored(feathers) + body + head)
}

// Hydrangea: a rounded cluster of little four-petal blossoms with a leaf —
// from the blue hydrangea inlay.
function blossom(cx, cy, r) {
  let d = ''
  for (let k = 0; k < 5; k++) {
    const a = (k * 2 * Math.PI) / 5 - Math.PI / 2
    const px = cx + r * Math.cos(a)
    const py = cy + r * Math.sin(a)
    d += `<path d="M${cx},${cy} Q ${(cx + r * 1.4 * Math.cos(a - 0.3)).toFixed(1)},${(cy + r * 1.4 * Math.sin(a - 0.3)).toFixed(1)} ${px.toFixed(1)},${py.toFixed(1)} Q ${(cx + r * 1.4 * Math.cos(a + 0.3)).toFixed(1)},${(cy + r * 1.4 * Math.sin(a + 0.3)).toFixed(1)} ${cx},${cy}"/>`
  }
  return d
}
function hydrangea() {
  const cluster = [
    [150, 120, 9],
    [168, 132, 8],
    [150, 142, 8],
    [170, 152, 7],
    [156, 162, 7],
  ]
  let blossoms = ''
  for (const [x, y, r] of cluster) blossoms += blossom(x, y, r)
  const stemLeaf =
    `<path d="M150,175 C 150,210 150,240 150,270"/>` +
    leaf(150, 210, 178, 198, 10) +
    leaf(150, 240, 176, 250, 10)
  return svgDoc(mirrored(blossoms + stemLeaf))
}

export const STITCH_PATTERNS = [
  { id: 'scrollStar', name: 'Scroll & Star', url: scrollStar() },
  { id: 'tulips', name: 'Tulips', url: tulips() },
  { id: 'eagle', name: 'Spread Eagle', url: eagle() },
  { id: 'hydrangea', name: 'Hydrangea', url: hydrangea() },
]
