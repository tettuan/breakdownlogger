/**
 * @fileoverview Environment configuration management for BreakdownLogger.
 *
 * This module handles parsing and caching of environment variables that control
 * logging behavior. It implements a singleton pattern to ensure consistent
 * configuration across the application while providing methods to reset when needed.
 *
 * @module environment_config
 * @since 1.0.0
 */

import { LogLength, LogLevel } from "./types.ts";

export class EnvironmentConfig {
  private static instance: EnvironmentConfig | null = null;
  private logLevel: LogLevel;
  private logLength: LogLength;
  private logKeys: string[];

  private constructor() {
    this.logLevel = this.parseLogLevel();
    this.logLength = this.parseLogLength();
    this.logKeys = this.parseLogKeys();
  }

  static getInstance(): EnvironmentConfig {
    if (!this.instance) {
      this.instance = new EnvironmentConfig();
    }
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }

  getLogLevel(): LogLevel {
    return this.logLevel;
  }

  getLogLength(): LogLength {
    return this.logLength;
  }

  getLogKeys(): string[] {
    return this.logKeys;
  }

  private parseLogLevel(): LogLevel {
    const level = Deno.env.get("LOG_LEVEL")?.toLowerCase();
    switch (level) {
      case "debug":
        return LogLevel.DEBUG;
      case "info":
        return LogLevel.INFO;
      case "warn":
        return LogLevel.WARN;
      case "error":
        return LogLevel.ERROR;
      default:
        return LogLevel.INFO;
    }
  }

  private parseLogLength(): LogLength {
    const length = Deno.env.get("LOG_LENGTH")?.toUpperCase();
    switch (length) {
      case "S":
        return LogLength.SHORT;
      case "L":
        return LogLength.LONG;
      case "W":
        return LogLength.WHOLE;
      default:
        return LogLength.DEFAULT;
    }
  }

  private parseLogKeys(): string[] {
    const keys = Deno.env.get("LOG_KEY");
    if (!keys) return [];

    // 区切り文字: カンマ、コロン、スラッシュのいずれか
    const separators = /[,:\/]/;
    return keys.split(separators).filter((key) => key.trim().length > 0);
  }
}
