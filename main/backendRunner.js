// main/backendRunner.js
const { app } = require("electron");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { logFrontend, formatBackendLog, colors } = require("./logger");

let backendProcess = null;
const backendPort = process.env.BACKEND_PORT || "5000";

/**
 * Get the path to the backend executable
 * - Production: bundled in resources
 * - Development: pre-built Debug EXE
 */
function getBackendPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "backend", "ArasBackend.exe");
  }
  return path.join(
    __dirname,
    "..",
    "backend",
    "ArasBackend",
    "bin",
    "Debug",
    "net8.0",
    "win-x64",
    "ArasBackend.exe",
  );
}

/**
 * Start the backend process using pre-built EXE (faster than dotnet run)
 */
function startBackend() {
  const exePath = getBackendPath();

  // Check if EXE exists
  if (!fs.existsSync(exePath)) {
    console.log(
      `${colors.bgRed}${colors.white}${"=".repeat(60)}${colors.reset}`,
    );
    logFrontend("error", "Backend EXE not found!");
    logFrontend("warn", "Run: npm run build:backend");
    logFrontend("info", `Expected path: ${exePath}`);
    console.log(
      `${colors.bgRed}${colors.white}${"=".repeat(60)}${colors.reset}`,
    );
    return;
  }

  logFrontend("info", `Starting backend from: ${exePath} on port ${backendPort}`);

  // Ensure we pass the environment variable, defaulting to Development if we are in dev mode
  const backendEnv = {
    ...process.env,
    ASPNETCORE_ENVIRONMENT:
      process.env.ASPNETCORE_ENVIRONMENT ||
      (process.argv.includes("--dev") ? "Development" : "Production"),
  };

  backendProcess = spawn(exePath, ["--urls", `http://localhost:${backendPort}`], {
    env: backendEnv,
  });

  backendProcess.stdout.on("data", (data) => {
    formatBackendLog(data, false);
  });

  backendProcess.stderr.on("data", (data) => {
    formatBackendLog(data, true);
  });

  backendProcess.on("error", (err) => {
    logFrontend("error", `Failed to start backend: ${err.message}`);
  });

  backendProcess.on("exit", (code) => {
    const level = code === 0 ? "info" : "warn";
    logFrontend(level, `Backend process exited with code ${code}`);
  });
}

function killBackend() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

function getBackendPort() {
  return backendPort;
}

module.exports = {
  startBackend,
  killBackend,
  getBackendPort,
};
