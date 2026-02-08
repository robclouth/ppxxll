# CLAUDE.md

## Project Overview

**ppxxll** is an open-source photo effects PWA (Progressive Web App) that applies real-time shader-based effects to camera input or images. Effects come from [Shadertoy](https://www.shadertoy.com) and results are rendered at full photo resolution using a tile-based rendering system. Deployed at https://ppxxll.vercel.app.

Only single-pass shaders are currently supported. Tested on Chrome for Android and desktop.

## Tech Stack

- **Language:** TypeScript 5.7 (strict mode)
- **Framework:** React 19 with functional components and hooks
- **Build:** Vite 6 with `@vitejs/plugin-react`
- **Package Manager:** npm
- **UI:** shadcn/ui (Radix UI primitives + Tailwind CSS), lucide-react icons, react-hot-toast
- **3D/Shaders:** Three.js 0.173 via React Three Fiber 9 and @react-three/drei 10
- **State Management:** MobX 6 with `mobx-persist-store` + `localforage` (IndexedDB)
- **Testing:** Vitest + React Testing Library
- **PWA:** Service Worker via Vite

## Commands

```bash
npm run dev     # Dev server
npm run build   # Production build (tsc -b && vite build)
npm test        # Run tests (vitest)
```

## Project Structure

```
src/
├── index.tsx                    # React entry point
├── app.tsx                      # Root component, initializes services
├── types.ts                     # Shared TypeScript types (Shader, Pass, Parameter, etc.)
├── three.js                     # Custom Three.js tree-shaken re-exports (reduces bundle size)
├── lib/
│   └── utils.ts                 # Tailwind cn() merge utility
├── components/
│   ├── ui/                      # shadcn/ui primitives (button, dialog, dropdown-menu, slider, drawer, input)
│   ├── camera.tsx               # Main camera UI (layout, buttons, menus)
│   ├── gl-view.tsx              # React Three Fiber Canvas wrapper + shader quad
│   ├── shader-list.tsx          # Shader selection dialog (fetches from Shadertoy API)
│   ├── parameters.tsx           # Bottom drawer for shader parameter sliders
│   ├── parameter-slider.tsx     # Individual parameter slider control
│   ├── image-preview.tsx        # Full-screen photo preview with pinch-zoom
│   ├── video-preview.tsx        # Video playback preview
│   ├── image-input-button.tsx   # Button for adding image inputs
│   ├── texture-list.tsx         # Input texture selector (camera or images)
│   └── item-menu.tsx            # Reusable dropdown context menu
├── services/
│   ├── app.ts                   # Central state: pointer tracking, export settings, init
│   ├── camera-manager.ts        # Camera streams, video texture, photo capture, tile-based export
│   ├── shader-manager.ts        # Fetch/parse Shadertoy shaders, parameter extraction
│   ├── texture-manager.ts       # Manage/persist input textures via IndexedDB
│   ├── shadertoy-material.ts    # Three.js ShaderMaterial converting Shadertoy GLSL to Three.js
│   ├── export-thread.ts         # Web Worker thread for PNG encoding
│   └── dekapng/                 # Custom tile-based PNG writer
│       ├── png-writer.ts
│       ├── chunks/              # PNG format chunks (IHDR, IEND, pre-header)
│       └── util/                # CRC, Adler, Zlib, ArrayBuffer helpers
├── constants/
│   └── test-shaders.ts          # Built-in GLSL test shaders
└── index.css                    # Tailwind imports + global styles
```

## Architecture

### State Management

All services are **MobX singleton instances** exported as default:

```typescript
// Pattern used in all services:
class ShaderManager {
  constructor() { makeAutoObservable(this); }
}
export default new ShaderManager();
```

Services are imported directly by components (no dependency injection or context providers). MobX `enforceActions` is set to `"never"` — properties can be mutated directly.

**Persistence:** `ShaderManager` and `TextureManager` persist their state to IndexedDB via `mobx-persist-store` with `localforage`.

### Service Responsibilities

| Service | Role |
|---------|------|
| `app` | Global state: pointer position, export size, FPS. Orchestrates `init()` for all services |
| `camera-manager` | Camera stream lifecycle, video texture, photo capture, high-res tile-based export |
| `shader-manager` | Fetches shaders from Shadertoy REST API, parses GLSL for parameters |
| `texture-manager` | Stores/retrieves texture URLs from IndexedDB |
| `shadertoy-material` | Converts Shadertoy GLSL to Three.js `ShaderMaterial`, manages uniforms (`iResolution`, `iTime`, `iMouse`, `iChannel0-3`) |

### Rendering Pipeline

1. Camera feed → `VideoTexture` → bound as `iChannel` uniform
2. `ShadertoyMaterial` wraps Shadertoy GLSL in a Three.js vertex/fragment shader
3. React Three Fiber renders a full-screen quad with the shader material
4. For photo export: tile-based rendering at full resolution (500x500 chunks), assembled via Web Worker using the `dekapng` PNG encoder

### Three.js Tree Shaking

`src/three.js` provides a custom subset of Three.js exports to reduce bundle size. Vite is configured in `vite.config.ts` to alias `three` → `./src/three.js`. Only add exports here that are actually used.

## Key Types

Defined in `src/types.ts`:

- **`Shader`** — id, title, description, author, passes[], thumbnailUrl
- **`Pass`** — code (GLSL), inputs[], outputs[], parameters{}
- **`Parameter`** — name, type, defaultValue, minValue, maxValue, value
- **`InputOutput`** — id, url, type (`"camera"` | `"image"`)

## Conventions

### Code Style

- **Filenames:** kebab-case for all files (`.tsx`, `.ts`)
- **Components:** Functional components with hooks, wrapped in MobX `observer()` at export
- **Services:** Class-based singletons with `makeAutoObservable`
- **No Prettier config** — follow existing formatting (2-space indent, double quotes for imports)

### Component Patterns

- Components live in `src/components/`, business logic in `src/services/`
- UI primitives live in `src/components/ui/` (shadcn/ui pattern — Radix + Tailwind)
- Styling via Tailwind utility classes; use `cn()` from `src/lib/utils.ts` for conditional classes
- Absolute positioning used for camera overlay UI elements
- `observer()` HOC from `mobx-react` wraps components that read MobX observables

### Shader Parameters

Shadertoy shaders support editable parameters via comment annotations:

```glsl
const float brightness = 1.0; // @param min -10, max 10
```

Only globally defined `const float` variables with `min` and `max` annotations are supported. `ShaderManager` extracts these via regex parsing.

## Important Notes

- The Shadertoy API key is embedded in `shader-manager.ts` — this is a public API key for fetching shader data
- The `dekapng` library is vendored in-tree (not an npm dependency) — it handles tile-based PNG assembly for high-resolution exports that exceed single WebGL render target limits
- TypeScript strict mode is enabled (`tsconfig.json`)
