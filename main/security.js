// main/security.js
const { app } = require("electron");
const fs = require("fs");
const path = require("path");

const authorizedDirs = new Set([path.resolve(app.getPath("userData"))]);

/**
 * Normalizes and validates a path to prevent directory traversal.
 * String-level rejection is an optimization; canonical containment is the authoritative security check.
 */
function resolveSafePath(baseDir, relativePath) {
  if (!baseDir || !relativePath) {
    throw new Error("ERR_INVALID_ARGS");
  }

  // 1. Fast rejection of obviously malicious relative paths
  const normalizedRelative = path.normalize(relativePath);
  if (
    path.isAbsolute(normalizedRelative) ||
    normalizedRelative.includes("..")
  ) {
    console.error(`[SECURITY] Blocked fast-fail traversal: ${relativePath}`);
    throw new Error("ERR_TRAVERSAL_DETECTED");
  }

  // 2. Resolve base directory and verify authorization
  const resolvedBase = path.resolve(baseDir);
  const canonicalBase = fs.existsSync(resolvedBase)
    ? fs.realpathSync(resolvedBase)
    : resolvedBase;

  // Check if the base directory is authorized
  let isAuthorized = false;
  for (const authDir of authorizedDirs) {
    if (canonicalBase.startsWith(authDir)) {
      isAuthorized = true;
      break;
    }
  }

  if (!isAuthorized) {
    console.error(`[SECURITY] Unauthorized base directory: ${canonicalBase}`);
    throw new Error("ERR_UNAUTHORIZED_BASE");
  }

  // 3. Resolve target path and verify containment
  const targetPath = path.resolve(canonicalBase, normalizedRelative);

  // TOCTOU Mitigation: Use realpath if the file exists
  let canonicalTarget;
  try {
    if (fs.existsSync(targetPath)) {
      canonicalTarget = fs.realpathSync(targetPath);
    } else {
      // For new files, check the parent directory
      const parentDir = path.dirname(targetPath);
      if (fs.existsSync(parentDir)) {
        canonicalTarget = path.join(
          fs.realpathSync(parentDir),
          path.basename(targetPath),
        );
      } else {
        canonicalTarget = targetPath;
      }
    }
  } catch (err) {
    canonicalTarget = targetPath;
  }

  // 4. Final containment check (must start with base + separator)
  const baseWithSep = canonicalBase.endsWith(path.sep)
    ? canonicalBase
    : canonicalBase + path.sep;
  if (
    !canonicalTarget.startsWith(baseWithSep) &&
    canonicalTarget !== canonicalBase
  ) {
    console.error(
      `[SECURITY] Traversal detected after canonicalization: ${canonicalTarget}`,
    );
    throw new Error("ERR_TRAVERSAL_DETECTED");
  }

  return canonicalTarget;
}

module.exports = {
  authorizedDirs,
  resolveSafePath,
};
