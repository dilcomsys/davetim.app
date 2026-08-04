/**
 * Error Logging & Monitoring Utility
 * 
 * Bu dosya hata loglama ve monitoring için temel altyapıyı sağlar.
 * İleride Sentry, LogRocket gibi servislere entegre edilebilir.
 */

export interface ErrorLog {
  timestamp: Date;
  level: 'error' | 'warning' | 'info';
  message: string;
  error?: Error;
  context?: Record<string, any>;
  userId?: string;
  userAgent?: string;
  url?: string;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 100; // Keep last 100 logs in memory

  /**
   * Log an error
   */
  logError(message: string, error?: Error, context?: Record<string, any>) {
    const log: ErrorLog = {
      timestamp: new Date(),
      level: 'error',
      message,
      error,
      context,
      userId: this.getCurrentUserId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.addLog(log);
    this.sendToConsole(log);
    
    // TODO: Send to external service (Sentry, LogRocket, etc.)
    // this.sendToExternalService(log);
  }

  /**
   * Log a warning
   */
  logWarning(message: string, context?: Record<string, any>) {
    const log: ErrorLog = {
      timestamp: new Date(),
      level: 'warning',
      message,
      context,
      userId: this.getCurrentUserId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.addLog(log);
    this.sendToConsole(log);
  }

  /**
   * Log an info message
   */
  logInfo(message: string, context?: Record<string, any>) {
    const log: ErrorLog = {
      timestamp: new Date(),
      level: 'info',
      message,
      context,
      userId: this.getCurrentUserId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.addLog(log);
    
    // Only log to console in development
    if (process.env.NODE_ENV === 'development') {
      this.sendToConsole(log);
    }
  }

  /**
   * Get all logs
   */
  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs as JSON (for debugging)
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Add log to memory
   */
  private addLog(log: ErrorLog) {
    this.logs.push(log);
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Store in localStorage for persistence (development only)
    if (process.env.NODE_ENV === 'development') {
      try {
        localStorage.setItem('app_error_logs', JSON.stringify(this.logs.slice(-20)));
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }

  /**
   * Send log to console
   */
  private sendToConsole(log: ErrorLog) {
    const timestamp = log.timestamp.toISOString();
    const prefix = `[${timestamp}] [${log.level.toUpperCase()}]`;

    switch (log.level) {
      case 'error':
        console.error(prefix, log.message, log.error, log.context);
        break;
      case 'warning':
        console.warn(prefix, log.message, log.context);
        break;
      case 'info':
        console.info(prefix, log.message, log.context);
        break;
    }
  }

  /**
   * Get current user ID (from localStorage/session)
   */
  private getCurrentUserId(): string | undefined {
    try {
      // Try to get user from localStorage or session
      const authData = localStorage.getItem('supabase.auth.token');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed?.currentSession?.user?.id;
      }
    } catch (e) {
      // Ignore errors
    }
    return undefined;
  }

  /**
   * Send to external monitoring service
   * TODO: Implement Sentry, LogRocket, or similar
   */
  private sendToExternalService(log: ErrorLog) {
    // Example: Sentry.captureException(log.error, { extra: log.context });
    // Example: LogRocket.captureException(log.error);
    
    // For now, just a placeholder
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement actual service integration
      console.log('Would send to monitoring service:', log);
    }
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

/**
 * Helper functions for quick logging
 */
export const logError = (message: string, error?: Error, context?: Record<string, any>) => {
  errorLogger.logError(message, error, context);
};

export const logWarning = (message: string, context?: Record<string, any>) => {
  errorLogger.logWarning(message, context);
};

export const logInfo = (message: string, context?: Record<string, any>) => {
  errorLogger.logInfo(message, context);
};

