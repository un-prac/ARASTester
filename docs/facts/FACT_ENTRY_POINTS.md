# FACT_ENTRY_POINTS

**Source**: Discovered files matching `main.*`, `Program.cs`, `index.html`
**Extraction Date**: 2026-01-20
**Constraint**: Entry file paths and explicitly declared runtime configuration values. No inferred behavior.

---

## Electron Entry Point (Modular)

### File: `main.js`
- **Path**: `c:\Projects\ARASTester\main.js`
- **Role**: Electron main process bootstrap and lifecycle coordinator.
- **Dependencies**: Sub-modules under `c:\Projects\ARASTester\main/`

### Sub-Modules (c:\Projects\ARASTester\main/)

#### 1. `main/logger.js`
- **Role**: Formatter and logger for frontend and backend messages, configuring ANSI colors and severity matching.

#### 2. `main/security.js`
- **Role**: File system access validation (`resolveSafePath`) guarding against directory traversal attacks. Maintains the `authorizedDirs` list.

#### 3. `main/backendRunner.js`
- **Role**: Spawns and manages the lifetime of the pre-compiled .NET Core Web API backend process.
- **Backend Port**: Resolves to port `5000` (default) or reads from `process.env.BACKEND_PORT`.
- **Backend Exe Path (Dev)**: `backend/ArasBackend/bin/Debug/net8.0/win-x64/ArasBackend.exe`
- **Backend Exe Path (Prod)**: `{resourcesPath}/backend/ArasBackend.exe`

#### 4. `main/ipcHandlers.js`
- **Role**: Registers all IPC communication channels to bridge the frontend and native system.
- **IPC Handlers Registered**:
  - `app:getRuntimeConfig` (returns API base URL)
  - `dialog:pickFolder` (launches folder browser and auto-authorizes it)
  - `fs:readFile`, `fs:writeFile`, `fs:listJsonFiles`, `fs:deleteFile` (filesystem operations verified via `resolveSafePath`)
  - `settings:read`, `settings:write` (manages application configuration file)

### Window Configuration (main.js)
- **Dimensions**: Width 1200, Height 800
- **Background Color**: `#1E1F22`
- **Security Primitives**:
  - `contextIsolation`: `true`
  - `nodeIntegration`: `false`
  - `preload`: `preload.js` (bridged API)
- **Dev Mode URL**: Load `http://localhost:{VITE_PORT}` (default: `http://localhost:5173`)
- **Production Mode**: Load build static file `dist/index.html`


---

## HTML Entry Point

### File: `index.html`
**Path**: `c:\Projects\ARASTester\index.html`

**Explicit Configuration**:
| Configuration | Value | Line |
|---------------|-------|------|
| Title | Test Plan Dashboard | 12 |
| Root Element ID | root | 21 |
| Entry Script | /renderer/app/main.jsx | 22 |
| CSP script-src | 'self' | 9 |

---

## React Entry Point

### File: `renderer/app/main.jsx`
**Path**: `c:\Projects\ARASTester\renderer\app\main.jsx`

**Imports**:
| Import | Line |
|--------|------|
| React | 1 |
| ReactDOM | 2 |
| App (from ./App) | 3 |
| ../globals.css | 4 |

**Root Render Target**: `document.getElementById('root')` (line 12)

---

## Backend Entry Point

### File: `backend/ArasBackend/Program.cs`
**Path**: `c:\Projects\ARASTester\backend\ArasBackend\Program.cs`

**Explicit Configuration Values**:
| Configuration | Value | Line |
|---------------|-------|------|
| CORS Origins | http://localhost:3000, http://localhost:5173 | 14 |
| CORS Credentials | Allowed | 18 |
| CORS Methods | Any | 17 |
| CORS Headers | Any | 16 |
| Status Endpoint | /api/status | 39 |

**Services Registered**:
| Service | Method | Line |
|---------|--------|------|
| CORS | AddCors | 9 |
| Infrastructure | AddInfrastructure() | 23 |
| Application | AddApplication() | 24 |
| Controllers | AddControllers() | 25 |

**Middleware Used**:
| Middleware | Line |
|------------|------|
| ExceptionHandlingMiddleware | 29 |
| HTTPS Redirection (non-dev) | 33 |
| CORS (AllowLocalhost) | 36 |
