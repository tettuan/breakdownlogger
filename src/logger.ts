import { type LogEntry, LogLevel } from "./types.ts";
import { EnvironmentConfig } from "./environment_config.ts";
import { LogFormatter } from "./log_formatter.ts";
import { LogFilter } from "./log_filter.ts";

export class BreakdownLogger {
  private readonly key: string;
  private readonly environmentConfig: EnvironmentConfig;
  private readonly formatter: LogFormatter;
  private readonly filter: LogFilter;

  constructor(key: string = "default") {
    this.key = key;
    this.environmentConfig = EnvironmentConfig.getInstance();
    this.formatter = new LogFormatter();
    this.filter = new LogFilter();
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const currentLevel = this.environmentConfig.getLogLevel();

    if (!this.filter.shouldLog(level, currentLevel)) {
      return;
    }

    const allowedKeys = this.environmentConfig.getLogKeys();
    if (!this.filter.shouldOutputKey(this.key, allowedKeys)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      key: this.key,
      message,
      data,
    };

    const logLength = this.environmentConfig.getLogLength();
    const maxLength = this.formatter.getMaxLength(logLength);
    const formattedMessage = this.formatter.formatLogEntry(entry, maxLength);

    if (level === LogLevel.ERROR) {
      console.error(formattedMessage);
    } else {
      console.log(formattedMessage);
    }
  }

  public debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  public info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  public warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  public error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data);
  }
}
