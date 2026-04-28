import winston from "winston";

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format for development
const devFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

interface LogInfo {
  level: string;
  message: string;
  timestamp?: string;
  stack?: string;
  req?: {
    method?: string;
    url?: string;
    headers?: {
      authorization?: string;
    };
  };
  body?: {
    password?: string;
    token?: string;
  };
  [key: string]: unknown;
}

// Redact sensitive fields from logs
const redactSensitive = winston.format((info) => {
  const data = info as unknown as LogInfo;
  if (data.req?.headers?.authorization) {
    data.req.headers.authorization = "[REDACTED]";
  }
  if (data.body?.password) {
    data.body.password = "[REDACTED]";
  }
  if (data.body?.token) {
    data.body.token = "[REDACTED]";
  }
  return info;
});

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  defaultMeta: {
    service: process.env.SERVICE_NAME || "unknown-service",
    env: process.env.NODE_ENV || "development",
  },
  format: combine(
    errors({ stack: true }),
    redactSensitive(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  ),
  transports: [],
});

// Production: structured JSON to stdout (for Loki/Promtail to pick up)
if (process.env.NODE_ENV === "production") {
  logger.add(
    new winston.transports.Console({
      format: combine(timestamp(), winston.format.json()),
    }),
  );
} else {
  // Development: colorized human-readable output + file logs
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), devFormat),
    }),
  );
  logger.add(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
  );
  logger.add(
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  );
}

export default logger;
