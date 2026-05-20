// main.js
const { app, BrowserWindow, Menu } = require("electron");
const fs = require("fs");
const path = require("path");

// Disable the default menu
Menu.setApplicationMenu(null);

const { logFrontend } = require("./main/logger");
const { authorizedDirs } = require("./main/security");
const { startBackend, killBackend, getBackendPort } = require("./main/backendRunner");
const { registerIpcHandlers } = require("./main/ipcHandlers");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    // autoHideMenuBar: true, // Hide the default menu bar
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: "#1E1F22",
  });

  // Check for dev mode
  const isDev = process.argv.includes("--dev");

  if (isDev) {
    const port = process.env.VITE_PORT || "5173";
    logFrontend(
      "info",
      `Running in development mode: Loading http://localhost:${port}`,
    );
    win.loadURL(`http://localhost:${port}`);
    // Open the DevTools by default in dev mode if desired
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  // Auto-authorize saved test plan folder
  try {
    const settingsDir = path.resolve(app.getPath("userData"), "Settings");
    const settingsPath = path.resolve(settingsDir, "settings.json");
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, "utf-8");
      const settings = JSON.parse(data);
      if (settings.testPlanFolder) {
        const folder = path.resolve(settings.testPlanFolder);
        authorizedDirs.add(folder);
        console.log(`[SECURITY] Auto-authorized saved test folder: ${folder}`);
      }
    }
  } catch (err) {
    console.warn("[SECURITY] Failed to load saved permissions:", err);
  }

  // Register IPC handlers
  registerIpcHandlers(getBackendPort());

  // Start backend immediately (parallel to UI)
  console.log("Starting backend...");
  startBackend();

  // Show UI immediately
  createWindow();
});

app.on("will-quit", () => {
  killBackend();
});
