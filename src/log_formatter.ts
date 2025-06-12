/**
 * @fileoverview Log message formatting for BreakdownLogger.
 *
 * This module handles the formatting and presentation of log messages,
 * including timestamp formatting, message truncation, and data serialization.
 * It ensures consistent output format across all log levels and contexts.
 *
 * @module log_formatter
 * @since 1.0.0
 */

import { type LogEntry, LogLength, LogLevel } from "./types.ts";

export class LogFormatter {
  formatLogEntry(entry: LogEntry, maxLength: number): string {
    const { timestamp, level, key, message, data } = entry;
    const formattedTimestamp = timestamp.toISOString();
    const levelStr = LogLevel[level];

    let baseMessage =
      `[${formattedTimestamp}] [${levelStr}] [${key}] ${message}`;

    if (data !== undefined) {
      const dataStr = this.formatData(data);
      baseMessage += `\nData: ${dataStr}`;
    }

    return this.truncateMessage(baseMessage, maxLength);
  }

  private truncateMessage(message: string, maxLength: number): string {
    if (maxLength === -1) return message; // WHOLE

    if (message.length <= maxLength) {
      return message;
    }

    // 最後の3文字を"..."に置換
    return message.substring(0, maxLength - 3) + "...";
  }

  private formatData(data: unknown): string {
    try {
      if (data === null) return "null";
      if (data === undefined) return "undefined";

      if (typeof data === "object") {
        return JSON.stringify(data, null, 2);
      }

      return String(data);
    } catch (_e) {
      // 循環参照などでJSON.stringifyが失敗した場合
      return `[Object: ${String(data)}]`;
    }
  }

  getMaxLength(logLength: LogLength): number {
    switch (logLength) {
      case LogLength.DEFAULT:
        return 30;
      case LogLength.SHORT:
        return 100;
      case LogLength.LONG:
        return 200;
      case LogLength.WHOLE:
        return -1;
      default:
        return 30;
    }
  }
}
