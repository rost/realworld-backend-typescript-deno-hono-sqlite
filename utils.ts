import * as logger from "std/log/mod.ts";

await logger.setup({
    handlers: {
        console: new logger.handlers.ConsoleHandler("DEBUG"),
    },
    loggers: {
        default: {
            level: "DEBUG",
            handlers: ["console"],
        },
    },
});

const log = logger.getLogger();

export default log;