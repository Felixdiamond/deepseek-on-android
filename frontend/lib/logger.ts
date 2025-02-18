'use client'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  details?: unknown
}

class Logger {
  private static instance: Logger
  private logs: LogEntry[] = []
  private maxLogs = 1000 // Keep last 1000 logs in memory

  private constructor() {
    // Private constructor to enforce singleton
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private log(level: LogLevel, message: string, details?: unknown) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details
    }

    // Add to in-memory logs
    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift() // Remove oldest log
    }

    // Log to console with appropriate styling
    const styles = {
      debug: 'color: gray',
      info: 'color: blue',
      warn: 'color: orange',
      error: 'color: red; font-weight: bold'
    }

    console.log(
      `%c[${entry.timestamp}] [${level.toUpperCase()}] ${message}`,
      styles[level]
    )

    if (details) {
      console.log(details)
    }

    // For errors, also persist to localStorage in production
    if (level === 'error' && process.env.NODE_ENV === 'production') {
      this.persistLog(entry)
    }
  }

  private persistLog(entry: LogEntry) {
    try {
      const logs = JSON.parse(localStorage.getItem('error-logs') || '[]') as LogEntry[]
      logs.push(entry)
      
      // Keep only the last 100 error logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100)
      }
      
      localStorage.setItem('error-logs', JSON.stringify(logs))
    } catch (error) {
      console.error('Failed to persist log:', error)
    }
  }

  debug(message: string, details?: unknown) {
    this.log('debug', message, details)
  }

  info(message: string, details?: unknown) {
    this.log('info', message, details)
  }

  warn(message: string, details?: unknown) {
    this.log('warn', message, details)
  }

  error(message: string, details?: unknown) {
    this.log('error', message, details)
  }

  getLogs(level?: LogLevel): LogEntry[] {
    return level 
      ? this.logs.filter(log => log.level === level)
      : this.logs
  }

  clearLogs() {
    this.logs = []
    try {
      localStorage.removeItem('error-logs')
    } catch (error) {
      console.error('Failed to clear persisted logs:', error)
    }
  }
}

export const logger = Logger.getInstance()

// Error handling utilities
export class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const errorCodes = {
  OLLAMA_NOT_RUNNING: 'OLLAMA_NOT_RUNNING',
  MODEL_NOT_FOUND: 'MODEL_NOT_FOUND',
  INVALID_INPUT: 'INVALID_INPUT',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    logger.error(error.message, { code: error.code, details: error.details })
    return new Response(
      JSON.stringify({
        error: error.message,
        code: error.code,
        details: error.details
      }),
      {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  // Handle unknown errors
  logger.error('Unexpected error occurred', error)
  return new Response(
    JSON.stringify({
      error: 'An unexpected error occurred',
      code: errorCodes.SYSTEM_ERROR
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  )
} 