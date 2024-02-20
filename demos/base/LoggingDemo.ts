import { Loggers } from "3d-tiles-tools";

// Create a default logger to use in this file.
const logger = Loggers.get();

logger.trace("trace");
logger.debug("debug");
logger.info("info");
logger.warn("warn");
logger.error("error");
logger.error(new Error("thrownError"));
logger.fatal("fatal");

// Create a child logger that provides additional
// context information with the log messages
const childLogger = logger.child({
  examplePropertyA: "exampleValue",
  examplePropertyB: 12345,
});

childLogger.trace("trace");
childLogger.debug("debug");
childLogger.info("info");
childLogger.warn("warn");
childLogger.error("error");
childLogger.error(new Error("thrownError"));
childLogger.fatal("fatal");

// Create a "custom" logger with a special name
const customLogger = Loggers.get("Demo");

customLogger.trace("trace");
customLogger.debug("debug");
customLogger.info("info");
customLogger.warn("warn");
customLogger.error("error");
customLogger.error(new Error("thrownError"));
customLogger.fatal("fatal");
