# CLAUDE.md

## Project Overview

**ppxxll** is an open-source photo effects PWA (Progressive Web App) that applies real-time shader-based effects to camera input or images. Effects come from [Shadertoy](https://www.shadertoy.com) and results are rendered at full photo resolution using a tile-based rendering system. Deployed at https://ppxxll.vercel.app.

Only single-pass shaders are currently supported. Tested on Chrome for Android and desktop.

## Tech Stack

- **Language:** TypeScript 4.4 (strict mode)
- **Framework:** React 17 with functional components and hooks
- **Build:** Create React App + Craco (for webpack overrides)
- **Package Manager:** Yarn
- **UI:** Material-UI (MUI) 5 with Emotion CSS-in-JS
- **3D/Shaders:** Three.js 0.136 via React Three Fiber 7 and @react-three/drei 8
- **State Management:** MobX 6 with `mobx-persist-store` + `localforage` (IndexedDB)
- **Workers:** `threads` library for Web Worker PNG export
- **Testing:** Jest + React Testing Library
- **Linting:** ESLint (react-app preset, configured in package.json)
- **PWA:** Service Worker via `react-scripts`

## Commands

```bash
yarn start      # Dev server (HTTPS enabled on Windows via set HTTPS=true)
yarn build      # Production build
yarn test       # Run tests (Jest, interactive watch mode)
```

All scripts use `craco` instead of `react-scripts` directly, to apply webpack overrides defined in `craco.config.js`.

## Project Structure

```
src/
├── index.tsx                    # React entry point
├── App.tsx                      # Root component, initializes services
├── types.ts                     # Shared TypeScript types (Shader, Pass, Parameter, etc.)
├── three.js                     # Custom Three.js tree-shaken re-exports (reduces bundle size)
├── components/
│   ├── Camera.tsx               # Main camera UI (layout, buttons, menus)
│   ├── GLView.tsx               # React Three Fiber scene with shader rendering
│   ├── ShaderList.tsx           # Shader selection dialog (fetches from Shadertoy API)
│   ├── Parameters.tsx           # Bottom drawer for shader parameter sliders
│   ├── ParameterSlider.tsx      # Individual parameter slider control
│   ├── ImagePreview.tsx         # Full-screen photo preview with pinch-zoom
│   ├── VideoPreview.tsx         # Video playback preview
│   ├── ImageInputButton.tsx     # Button for adding image inputs
│   ├── TextureList.tsx          # Input texture selector (camera or images)
│   ├── ItemMenu.tsx             # Reusable context menu
│   └── renderer/
│       └── GLView.tsx           # React Three Fiber Canvas wrapper
├── services/
│   ├── App.ts                   # Central state: pointer tracking, export settings, init
│   ├── CameraManager.ts         # Camera streams, video texture, photo capture, tile-based export
│   ├── ShaderManager.ts         # Fetch/parse Shadertoy shaders, parameter extraction
│   ├── TextureManager.ts        # Manage/persist input textures via IndexedDB
│   ├── ShadertoyMaterial.ts     # Three.js ShaderMaterial converting Shadertoy GLSL to Three.js
│   ├── ExportThread.ts          # Web Worker thread for PNG encoding
│   └── dekapng/                 # Custom tile-based PNG writer
│       ├── png-writer.ts
│       ├── chunks/              # PNG format chunks (IHDR, IEND, pre-header)
│       └── util/                # CRC, Adler, Zlib, ArrayBuffer helpers
├── constants/
│   └── testShaders.ts           # Built-in GLSL test shaders
└── serviceWorkerRegistration.ts # PWA service worker setup
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
| `App` | Global state: pointer position, export size, FPS. Orchestrates `init()` for all services |
| `CameraManager` | Camera stream lifecycle, video texture, photo capture, high-res tile-based export |
| `ShaderManager` | Fetches shaders from Shadertoy REST API, parses GLSL for parameters |
| `TextureManager` | Stores/retrieves texture URLs from IndexedDB |
| `ShadertoyMaterial` | Converts Shadertoy GLSL to Three.js `ShaderMaterial`, manages uniforms (`iResolution`, `iTime`, `iMouse`, `iChannel0-3`) |

### Rendering Pipeline

1. Camera feed → `VideoTexture` → bound as `iChannel` uniform
2. `ShadertoyMaterial` wraps Shadertoy GLSL in a Three.js vertex/fragment shader
3. React Three Fiber renders a full-screen quad with the shader material
4. For photo export: tile-based rendering at full resolution (500x500 chunks), assembled via Web Worker using the `dekapng` PNG encoder

### Three.js Tree Shaking

`src/three.js` provides a custom subset of Three.js exports to reduce bundle size. Webpack is configured in `craco.config.js` to alias `three` → `./src/three.js`. Only add exports here that are actually used.

## Key Types

Defined in `src/types.ts`:

- **`Shader`** — id, title, description, author, passes[], thumbnailUrl
- **`Pass`** — code (GLSL), inputs[], outputs[], parameters{}
- **`Parameter`** — name, type, defaultValue, minValue, maxValue, value
- **`InputOutput`** — id, url, type (`"camera"` | `"image"`)

## Conventions

### Code Style

- **Components:** PascalCase filenames (`.tsx`), functional components with hooks, wrapped in MobX `observer()` at export
- **Services:** PascalCase filenames (`.ts`), class-based singletons with `makeAutoObservable`
- **Utilities:** camelCase filenames
- **No Prettier config** — follow existing formatting (2-space indent, double quotes for imports)

### Component Patterns

- Components live in `src/components/`, business logic in `src/services/`
- MUI components (`Box`, `Dialog`, `Drawer`, `IconButton`) used extensively for layout
- Absolute positioning used for camera overlay UI elements
- `observer()` HOC from `mobx-react` wraps components that read MobX observables

### Shader Parameters

Shadertoy shaders support editable parameters via comment annotations:

```glsl
const float brightness = 1.0; // @param min -10, max 10
```

Only globally defined `const float` variables with `min` and `max` annotations are supported. `ShaderManager` extracts these via regex parsing.

## Important Notes

- The `start` script uses `set HTTPS=true` (Windows syntax). On Linux/macOS, use `HTTPS=true craco start` or set the env var separately
- The Shadertoy API key is embedded in `ShaderManager.ts` — this is a public API key for fetching shader data
- The `dekapng` library is vendored in-tree (not an npm dependency) — it handles tile-based PNG assembly for high-resolution exports that exceed single WebGL render target limits
- Web Workers are managed via the `threads` library with `threads-plugin` for webpack integration
- TypeScript strict mode is enabled (`tsconfig.json`)
- ESLint extends `react-app` and `react-app/jest` (configured in `package.json`, no separate config file)
