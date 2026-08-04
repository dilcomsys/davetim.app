/**
 * Image Optimization Utilities
 * 
 * Provides functions for:
 * - Image compression
 * - Responsive image srcsets
 * - Lazy loading
 * - Format optimization
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface ResponsiveImageConfig {
  src: string;
  sizes: number[]; // e.g., [320, 640, 1024, 1920]
  quality?: number;
}

/**
 * Compress an image file
 * @param file Original image file
 * @param options Compression options
 * @returns Compressed image blob
 */
export const compressImage = async (
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<Blob> => {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
          } else {
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
          }
        }
        
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        // Draw image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          `image/${format}`,
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Get file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Generate srcset for responsive images
 * Useful for Unsplash or similar image services that support URL-based resizing
 */
export const getResponsiveImageSrcSet = (
  baseUrl: string,
  sizes: number[] = [320, 640, 1024, 1920]
): string => {
  // Guard against undefined/null/empty url
  if (!baseUrl || typeof baseUrl !== 'string') {
    return '';
  }
  
  // Check if it's an Unsplash URL
  if (baseUrl.includes('unsplash.com')) {
    return sizes
      .map(width => `${baseUrl}&w=${width} ${width}w`)
      .join(', ');
  }
  
  // For Supabase Storage URLs, we don't have built-in resizing
  // So we just return the original URL for all sizes
  return `${baseUrl} ${sizes[sizes.length - 1]}w`;
};

/**
 * Get optimized Unsplash URL
 */
export const getOptimizedUnsplashUrl = (
  url: string,
  options: { width?: number; height?: number; quality?: number; format?: string } = {}
): string => {
  const { width, height, quality = 80, format = 'auto' } = options;
  
  // Guard against undefined/null/empty url
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  if (!url.includes('unsplash.com')) {
    return url;
  }
  
  const urlObj = new URL(url);
  
  // Add optimization parameters
  if (width) urlObj.searchParams.set('w', width.toString());
  if (height) urlObj.searchParams.set('h', height.toString());
  urlObj.searchParams.set('q', quality.toString());
  urlObj.searchParams.set('fm', format);
  urlObj.searchParams.set('fit', 'crop');
  
  return urlObj.toString();
};

/**
 * Preload image for better UX
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Setup lazy loading for images using Intersection Observer
 */
export const setupLazyLoading = (selector: string = '[data-lazy-src]'): (() => void) => {
  // Check browser support
  if (!('IntersectionObserver' in window)) {
    // Fallback: Load all images immediately
    const lazyImages = document.querySelectorAll(selector);
    lazyImages.forEach((img) => {
      const lazySrc = img.getAttribute('data-lazy-src');
      if (lazySrc) {
        img.setAttribute('src', lazySrc);
      }
    });
    return () => {}; // No cleanup needed
  }
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const lazySrc = img.getAttribute('data-lazy-src');
        
        if (lazySrc) {
          img.src = lazySrc;
          img.removeAttribute('data-lazy-src');
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: '50px' // Start loading 50px before image enters viewport
  });
  
  // Observe all lazy images
  const lazyImages = document.querySelectorAll(selector);
  lazyImages.forEach((img) => {
    imageObserver.observe(img);
  });
  
  // Return cleanup function
  return () => {
    imageObserver.disconnect();
  };
};

/**
 * Check if image format is supported
 */
export const isImageFormatSupported = (format: string): boolean => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  try {
    return canvas.toDataURL(`image/${format}`).indexOf(`data:image/${format}`) === 0;
  } catch {
    return false;
  }
};

/**
 * Get optimal image format based on browser support
 */
export const getOptimalImageFormat = (): 'webp' | 'jpeg' => {
  return isImageFormatSupported('webp') ? 'webp' : 'jpeg';
};

/**
 * Validate image file
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Geçersiz dosya formatı. Sadece JPG, PNG, WebP veya GIF dosyaları yüklenebilir.'
    };
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Dosya boyutu çok büyük. Maksimum ${formatFileSize(maxSize)} yüklenebilir.`
    };
  }
  
  return { valid: true };
};

/**
 * Create thumbnail from image file
 */
export const createThumbnail = async (
  file: File,
  size: number = 200
): Promise<Blob> => {
  return compressImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7,
    format: 'jpeg'
  });
};

/**
 * Get image dimensions
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height
        });
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Calculate aspect ratio
 */
export const calculateAspectRatio = (width: number, height: number): string => {
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };
  
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
};

/**
 * LazyImage React component helper
 * Usage: <img {...getLazyImageProps(src, alt)} />
 */
export const getLazyImageProps = (
  src: string,
  alt: string = '',
  placeholder: string = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3C/svg%3E'
) => {
  return {
    src: placeholder,
    'data-lazy-src': src,
    alt,
    loading: 'lazy' as const,
    className: 'lazy-image',
  };
};
