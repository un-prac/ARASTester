// main/ipcHandlers.js
const { ipcMain, dialog, app } = require("electron");
const fs = require("fs");
const path = require("path");
const { resolveSafePath, authorizedDirs } = require("./security");

function registerIpcHandlers(backendPort) {
  ipcMain.handle("app:getRuntimeConfig", async () => {
    return {
      apiBaseUrl: `http://localhost:${backendPort}`,
    };
  });

  ipcMain.handle("dialog:pickFolder", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (!result.canceled && result.filePaths.length > 0) {
      const selectedPath = path.resolve(result.filePaths[0]);
      authorizedDirs.add(selectedPath);
    }
    return result;
  });

  // ------------------------------------------
  // FILESYSTEM HANDLERS
  // ------------------------------------------
  ipcMain.handle("fs:readFile", (_, baseDir, relativePath) => {
    try {
      const safePath = resolveSafePath(baseDir, relativePath);
      return fs.promises.readFile(safePath, "utf-8");
    } catch (err) {
      console.error(`[FS] Error reading file: ${err.message}`);
      throw err;
    }
  });

  ipcMain.handle("fs:writeFile", (_, baseDir, relativePath, data) => {
    try {
      const safePath = resolveSafePath(baseDir, relativePath);
      return fs.promises.writeFile(safePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(`[FS] Error writing file: ${err.message}`);
      throw err;
    }
  });

  ipcMain.handle("fs:listJsonFiles", async (_, baseDir, relativePath = ".") => {
    try {
      const safeBase = resolveSafePath(baseDir, relativePath);
      const items = await fs.promises.readdir(safeBase);

      return items
        .filter((f) => f.endsWith(".json"))
        .map((f) => path.join(relativePath, f)); // Return relative paths to the frontend
    } catch (err) {
      console.error(`[FS] Error listing files: ${err.message}`);
      throw err;
    }
  });

  ipcMain.handle("fs:deleteFile", async (_, baseDir, relativePath) => {
    try {
      const safePath = resolveSafePath(baseDir, relativePath);
      return fs.promises.unlink(safePath);
    } catch (err) {
      console.error(`[FS] Error deleting file: ${err.message}`);
      throw err;
    }
  });

  // ------------------------------------------
  // SETTINGS HANDLERS
  // ------------------------------------------
  ipcMain.handle("settings:read", async () => {
    const settingsDir = path.resolve(app.getPath("userData"), "Settings");
    try {
      const settingsPath = resolveSafePath(settingsDir, "settings.json");
      const data = await fs.promises.readFile(settingsPath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      // If file doesn't exist or error, return empty object
      return {};
    }
  });

  ipcMain.handle("settings:write", async (_, data) => {
    const settingsDir = path.resolve(app.getPath("userData"), "Settings");

    try {
      const settingsPath = resolveSafePath(settingsDir, "settings.json");
      await fs.promises.mkdir(settingsDir, { recursive: true });
      await fs.promises.writeFile(settingsPath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error("Failed to write settings:", error);
      return false;
    }
  });
}

module.exports = {
  registerIpcHandlers,
};
