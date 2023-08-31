import pino from "pino";
import { Logger } from "pino";
import { LoggerOptions } from "pino";

/**
 * Internal function to create a pino Logger with default configuration.
 *
 * @param console - Whether log output should be pretty-printed
 * instead of generating newline-terminated JSON. Default: `true`
 * @returns The Logger
 */
function createDefaultLogger(console?: boolean): Logger {
  // Common logger options
  const commonLoggerOptions: LoggerOptions = {
    level: process.env.LOG_LEVEL || "trace",

    // Avoid adding the PID and hostname to each log
    base: undefined,
  };

  // Options for the console logger
  const consoleLoggerOptions: LoggerOptions = {
    ...commonLoggerOptions,

    // Enable pretty printing to the console by default
    transport: {
      target: "pino-pretty",
    },
  };

  // Options for the JSON logger
  const jsonLoggerOptions: LoggerOptions = {
    ...commonLoggerOptions,

    // Format the time stamp as an ISO 8601-formatted time
    timestamp: pino.stdTimeFunctions.isoTime,

    // Use the uppercase level name of the log level in JSON output
    formatters: {
      level(level: string) {
        return { level: level.toUpperCase() };
      },
    },
  };

  const logger = pino(
    console === false ? jsonLoggerOptions : consoleLoggerOptions
  );
  return logger;
}

const defaultLogger = createDefaultLogger();

/**
 * Creates a logger for the specified file.
 *
 * If the `fileName` is undefined, then a default logger will be
 * returned.
 *
 * Otherwise, the base name of the given file name (i.e. the part
 * after the last `/` or `\\`) will be included as a `name` in the
 * log messages.
 *
 * Example:
 * ```
 * import { LoggerFactory } from "../src/logging/LoggerFactory";
 * const logger = LoggerFactory(__filename);
 * ```
 *
 * @param fileName - An optional file name
 * @returns The Logger
 */
const createLogger = (fileName?: string): Logger => {
  if (fileName === undefined) {
    return defaultLogger;
  }
  let name = fileName;
  let index = -1;
  index = fileName.lastIndexOf("/");
  index = Math.max(index, fileName.lastIndexOf("\\"));
  if (index !== -1) {
    name = fileName.substring(index + 1);
  }
  return defaultLogger.child({ name: name });
};

export const LoggerFactory = createLogger;
