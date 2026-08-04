/**
 * Retry utility for handling network failures with exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoff?: boolean;
  retryOn?: (error: any) => boolean; // Custom retry condition
  onRetry?: (attempt: number, error: Error) => void;
  timeout?: number; // Request timeout in ms
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  delayMs: 1000,
  backoff: true,
  retryOn: (error: any) => {
    // Retry on network errors and 5xx server errors
    return isNetworkError(error) || (error.status >= 500 && error.status < 600);
  },
  onRetry: () => {},
  timeout: 30000, // 30 seconds default timeout
};

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      // Add timeout to the request
      return await withTimeout(fn(), opts.timeout);
    } catch (error: any) {
      lastError = error;
      
      // Check if we should retry this error
      if (!opts.retryOn(error)) {
        console.log(`❌ Not retrying error (attempt ${attempt}):`, error.message || error);
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === opts.maxRetries) {
        console.log(`❌ Max retries (${opts.maxRetries}) reached, giving up`);
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = opts.backoff 
        ? opts.delayMs * Math.pow(2, attempt - 1)
        : opts.delayMs;

      console.log(`🔄 Retry attempt ${attempt}/${opts.maxRetries} after ${delay}ms...`);
      opts.onRetry(attempt, error);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Add timeout to a promise
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  return (
    error.message?.includes('fetch') ||
    error.message?.includes('network') ||
    error.message?.includes('NetworkError') ||
    error.name === 'NetworkError' ||
    error.code === 'NETWORK_ERROR'
  );
}

/**
 * Check if browser is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Wait for network to become available
 */
export async function waitForOnline(timeoutMs: number = 30000): Promise<boolean> {
  if (isOnline()) return true;
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      window.removeEventListener('online', onlineHandler);
      resolve(false);
    }, timeoutMs);
    
    const onlineHandler = () => {
      clearTimeout(timeout);
      window.removeEventListener('online', onlineHandler);
      resolve(true);
    };
    
    window.addEventListener('online', onlineHandler);
  });
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: any): string {
  // Network errors
  if (isNetworkError(error)) {
    return 'İnternet bağlantısı kontrol edilemiyor. Lütfen bağlantınızı kontrol edin.';
  }

  // Timeout errors
  if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
    return 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
  }

  // Server errors (5xx)
  if (error.status >= 500) {
    return 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
  }

  // Authentication errors
  if (error.status === 401) {
    return 'Oturumunuz sonlanmış. Lütfen tekrar giriş yapın.';
  }

  // Permission errors
  if (error.status === 403) {
    return 'Bu işlem için yetkiniz yok.';
  }

  // Not found errors
  if (error.status === 404) {
    return 'İstenen kaynak bulunamadı.';
  }

  // Rate limiting
  if (error.status === 429) {
    return 'Çok fazla istek gönderdiniz. Lütfen bir süre bekleyin.';
  }

  // Default to error message or generic message
  return error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.';
}

