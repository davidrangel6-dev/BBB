# Bluebonnet Boot Co. — Mockup Studio

A 3D mockup tool for designing bespoke handmade boots. Spin a boot around in
the browser, swap leathers and stitching, and export snapshot images to share
with clients during consultations.

## Live app

Every push to `main` auto-deploys to GitHub Pages:
**https://davidrangel6-dev.github.io/BBB/**

## Running it locally

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
```

The production build in `dist/` is plain static files — it can be hosted for
free on Netlify, Vercel, GitHub Pages, or Cloudflare Pages.

## What it does

- **3D viewport** — orbit, zoom, and pan around the boot with soft studio
  lighting and ground shadows.
- **Leather picker** — independent leather colors for the shaft, vamp & toe,
  heel & sole, and pull straps, plus matte / classic / polished finishes.
- **Stitching** — thread color for the decorative shaft stitching.
- **Shape** — round, snip, or square toe; riding, standard, or fashion heel;
  shaft height from 11″ to 16″.
- **Snapshot PNG** — one click exports a render of the current view, named
  after the design.
- **Save / load** — designs autosave in the browser, can be saved to a named
  list, and can be exported/imported as small JSON files (easy to text or
  email between devices).

## The placeholder boot and your real model

The boot in the viewport today is a **stylized procedural placeholder** built
from code, so every feature works before any 3D asset exists. When you're
ready for a photorealistic boot:

1. Commission a 3D artist (or scan a boot) to produce a **glTF binary (.glb)**
   model. This is the standard web 3D format and what any product-viz artist
   will expect to deliver.
2. Ask for the boot split into **separate meshes named** `shaft`, `vamp`,
   `heel`, `sole`, `strap`, and `stitch`. The app matches meshes to the
   leather controls by those name keywords.
3. **Drag the .glb onto the viewport** — the placeholder is replaced and all
   the leather/thread/finish controls drive the real model immediately.

A good model for this purpose is typically 50k–200k triangles with UV-unwrapped
parts; mention that it's for a web configurator and the artist will know what
to do.

## Roadmap ideas

- Customer-facing configurator mode (shareable design links, order requests)
- Inlay/overlay patterns and toe medallion options
- Exotic leather textures (caiman, ostrich, lizard) via texture maps
- AR "view in your space" on phones (WebXR / model-viewer)
