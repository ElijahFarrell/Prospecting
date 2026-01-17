type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  data?: unknown;
  duration?: number;
}

class DebugStore {
  private logs: LogEntry[] = [];
  private listeners: Set<() => void> = new Set();
  private maxLogs = 500;

  log(level: LogLevel, category: string, message: string, data?: unknown, duration?: number) {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      duration,
    };

    this.logs.unshift(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    this.notify();
  }

  info(category: string, message: string, data?: unknown) {
    this.log("info", category, message, data);
  }

  warn(category: string, message: string, data?: unknown) {
    this.log("warn", category, message, data);
  }

  error(category: string, message: string, data?: unknown) {
    this.log("error", category, message, data);
  }

  debug(category: string, message: string, data?: unknown) {
    this.log("debug", category, message, data);
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  clear() {
    this.logs = [];
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }
}

export const debugStore = new DebugStore();

