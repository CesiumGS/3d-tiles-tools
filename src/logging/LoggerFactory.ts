import pino from "pino";
import { TransportTargetOptions } from "pino";
import { Logger } from "pino";
import { LoggerOptions } from "pino";

/**
 * Internal function to create a pino Logger with default configuration.
 *
 * @param console - Whether log output should be pretty-printed to the console
 * (default: `true`)
 * @param logFilePath - The path of the log file to write, or `undefined`
 * to write no log file (default: `undefined`)
 * @returns The Logger
 */
function createDefaultLogger(console?: boolean, logFilePath?: string): Logger {
  const consoleLogLevel = process.env.LOG_LEVEL || "trace";
  const fileLogLevel = process.env.LOG_LEVEL || "trace";
  const globalLogLevel = process.env.LOG_LEVEL || "trace";

  const transportTargetOptionsList: TransportTargetOptions[] = [];

  // The options for the 'console' transport target
  if (console !== false) {
    const consoleTargetOptions = {
      level: consoleLogLevel,
      target: "pino-pretty",
      options: {},
    };
    transportTargetOptionsList.push(consoleTargetOptions);
  }

  // The options for the log file transport target
  if (logFilePath !== undefined) {
    const fileTargetOptions = {
      level: fileLogLevel,
      target: "pino/file",
      options: {
        destination: logFilePath,
        append: false,
      },
    };
    transportTargetOptionsList.push(fileTargetOptions);
  }

  // Create the actual transports based on the given options
  const transport = pino.transport({
    targets: transportTargetOptionsList,
  });

  // Common logger options
  const loggerOptions: LoggerOptions = {
    level: globalLogLevel,

    // Avoid adding the PID and hostname to each log
    base: undefined,

    // Format the time stamp as an ISO 8601-formatted time
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  const logger = pino(loggerOptions, transport);
  return logger;
}

const defaultLogger = createDefaultLogger(true, undefined);

/**
 * Creates a logger with the specified name.
 *
 * If the `loggerName` is undefined, then a default logger will be
 * returned.
 *
 * Otherwise, the name will be included as a `name` in the
 * log messages. If the given name is a path (i.e. if it
 * contains `/` or `\\`), then the part after the last `/`
 * or `\\` will be used as the name.
 *
 * Example:
 * ```
 * import { LoggerFactory } from "../src/logging/LoggerFactory";
 * const logger = LoggerFactory(__filename);
 * ```
 *
 * @param loggerName - An optional name
 * @returns The Logger
 */
const createLogger = (loggerName?: string): Logger => {
  if (loggerName === undefined) {
    return defaultLogger;
  }
  let name = loggerName;
  let index = -1;
  index = loggerName.lastIndexOf("/");
  index = Math.max(index, loggerName.lastIndexOf("\\"));
  if (index !== -1) {
    name = loggerName.substring(index + 1);
  }
  return defaultLogger.child({ name: name });
};

export const LoggerFactory = createLogger;
