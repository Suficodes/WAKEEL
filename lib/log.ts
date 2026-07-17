/*
 * Structured JSON logging — DAK observability baseline.
 * Every line is one JSON object: { ts, level, logger, msg, ...extra }.
 */

type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, logger: string, msg: string, extra?: Record<string, unknown>) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    logger,
    msg,
    ...extra,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function createLogger(logger: string) {
  return {
    debug: (msg: string, extra?: Record<string, unknown>) => emit("debug", logger, msg, extra),
    info: (msg: string, extra?: Record<string, unknown>) => emit("info", logger, msg, extra),
    warn: (msg: string, extra?: Record<string, unknown>) => emit("warn", logger, msg, extra),
    error: (msg: string, extra?: Record<string, unknown>) => emit("error", logger, msg, extra),
  };
}
