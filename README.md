# Atomic Lab (three.js + TS, pnpm)

## Quick start
```bash
# 1) create a folder and cd into it
# (skip if you unzip this template)
# 2) install deps
pnpm install
# 3) dev
pnpm dev
# 4) build
pnpm build
# 5) preview
pnpm preview
```

If you start from scratch instead of this zip:
```bash
pnpm create vite atomic-lab --template vanilla-ts
cd atomic-lab
pnpm add three tweakpane
pnpm add -D vite vite-plugin-glsl typescript
# replace src/ and config files with the ones from this template
pnpm dev
```

## Notes
- CPU physics is O(N^2) with a cutoff; good for ~500–1000 atoms.
- Next steps: neighbor grid, GPUComputationRenderer, bonds/angles, UI scenarios.
