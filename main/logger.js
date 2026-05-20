// main/logger.js

// ===========================================
// ANSI Color Codes for Terminal Output
// ===========================================
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",

  // Foreground
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",

  // Background
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
};

// Log level patterns to detect from backend output
const logPatterns = {
  error: /\b(error|exception|fail|fatal|critical)\b/i,
  warn: /\b(warn|warning|deprecated|caution)\b/i,
  success: /\b(success|completed|started|ready|listening|200|201|204)\b/i,
  debug: /\b(debug|trace|verbose)\b/i,
  info: /\b(info|information)\b/i,
};

/**
 * Parse a log line and return the appropriate color based on content
 */
function getLogColor(line) {
  const lowerLine = line.toLowerCase();

  // Priority order: error > warn > success > info > debug
  if (logPatterns.error.test(lowerLine)) {
    return { color: colors.red, prefix: "[ERROR]  " };
  }
  if (logPatterns.warn.test(lowerLine)) {
    return { color: colors.yellow, prefix: "[WARN]   " };
  }
  if (logPatterns.success.test(lowerLine)) {
    return { color: colors.green, prefix: "[OK]     " };
  }
  if (logPatterns.debug.test(lowerLine)) {
    return { color: colors.gray, prefix: "[DEBUG]  " };
  }
  if (logPatterns.info.test(lowerLine)) {
    return { color: colors.cyan, prefix: "[INFO]   " };
  }

  // Default: regular log
  return { color: colors.white, prefix: "[LOG]    " };
}

/**
 * Format and colorize a backend log line
 */
function formatBackendLog(data, isError = false) {
  const lines = data.toString().trim().split("\n");
  const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });

  lines.forEach((line) => {
    if (!line.trim()) return;

    const { color, prefix } = isError
      ? { color: colors.red, prefix: "[ERROR]  " }
      : getLogColor(line);

    const formattedLine = `${colors.gray}[${timestamp}]${colors.reset} ${colors.magenta}[BACKEND]${colors.reset} ${color}${prefix}${colors.reset} ${color}${line}${colors.reset}`;

    if (isError) {
      console.error(formattedLine);
    } else {
      console.log(formattedLine);
    }
  });
}

/**
 * Log a frontend message with color coding
 */
function logFrontend(level, message) {
  const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
  const levelColors = {
    info: { color: colors.cyan, prefix: "[INFO]   " },
    success: { color: colors.green, prefix: "[OK]     " },
    warn: { color: colors.yellow, prefix: "[WARN]   " },
    error: { color: colors.red, prefix: "[ERROR]  " },
    debug: { color: colors.gray, prefix: "[DEBUG]  " },
  };

  const { color, prefix } = levelColors[level] || levelColors.info;
  console.log(
    `${colors.gray}[${timestamp}]${colors.reset} ${colors.blue}[ELECTRON]${colors.reset} ${color}${prefix}${colors.reset} ${color}${message}${colors.reset}`,
  );
}

module.exports = {
  colors,
  logFrontend,
  formatBackendLog,
};
