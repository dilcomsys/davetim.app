/**
 * Form validation utilities
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Email validation
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'E-posta adresi gerekli' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Geçerli bir e-posta adresi girin' };
  }

  return { isValid: true };
}

/**
 * Password validation
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || password.trim() === '') {
    return { isValid: false, error: 'Şifre gerekli' };
  }

  if (password.length < 6) {
    return { isValid: false, error: 'Şifre en az 6 karakter olmalı' };
  }

  return { isValid: true };
}

/**
 * Required field validation
 */
export function validateRequired(value: string, fieldName: string = 'Bu alan'): ValidationResult {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `${fieldName} gerekli` };
  }

  return { isValid: true };
}

/**
 * Phone number validation (Turkish format)
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone || phone.trim() === '') {
    return { isValid: true }; // Optional field
  }

  // Remove spaces and dashes
  const cleanPhone = phone.replace(/[\s-]/g, '');

  // Turkish phone format: 5XXXXXXXXX or +905XXXXXXXXX
  const phoneRegex = /^(\+?90)?5\d{9}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, error: 'Geçerli bir telefon numarası girin (05XX XXX XX XX)' };
  }

  return { isValid: true };
}

/**
 * Date validation (must be in the future)
 */
export function validateFutureDate(date: string): ValidationResult {
  if (!date || date.trim() === '') {
    return { isValid: true }; // Optional field
  }

  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    return { isValid: false, error: 'Tarih bugünden önce olamaz' };
  }

  return { isValid: true };
}

/**
 * Format phone number as user types
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');

  // Format as: 0XXX XXX XX XX
  if (numbers.length <= 4) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 4)} ${numbers.slice(4)}`;
  } else if (numbers.length <= 9) {
    return `${numbers.slice(0, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7)}`;
  } else {
    return `${numbers.slice(0, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7, 9)} ${numbers.slice(9, 11)}`;
  }
}

/**
 * URL validation
 */
export function validateUrl(url: string): ValidationResult {
  if (!url || url.trim() === '') {
    return { isValid: true }; // Optional field
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Geçerli bir URL girin' };
  }
}

/**
 * Name validation (Turkish characters support)
 */
export function validateName(name: string, fieldName: string = 'İsim'): ValidationResult {
  if (!name || name.trim() === '') {
    return { isValid: false, error: `${fieldName} gerekli` };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: `${fieldName} en az 2 karakter olmalı` };
  }

  if (name.trim().length > 100) {
    return { isValid: false, error: `${fieldName} en fazla 100 karakter olabilir` };
  }

  // Allow Turkish characters and spaces
  const nameRegex = /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/;
  if (!nameRegex.test(name)) {
    return { isValid: false, error: `${fieldName} sadece harf içermelidir` };
  }

  return { isValid: true };
}

/**
 * Title validation
 */
export function validateTitle(title: string, minLength: number = 3, maxLength: number = 100): ValidationResult {
  if (!title || title.trim() === '') {
    return { isValid: false, error: 'Başlık gerekli' };
  }

  if (title.trim().length < minLength) {
    return { isValid: false, error: `Başlık en az ${minLength} karakter olmalı` };
  }

  if (title.trim().length > maxLength) {
    return { isValid: false, error: `Başlık en fazla ${maxLength} karakter olabilir` };
  }

  return { isValid: true };
}

/**
 * Location/Address validation
 */
export function validateLocation(location: string): ValidationResult {
  if (!location || location.trim() === '') {
    return { isValid: true }; // Optional field
  }

  if (location.trim().length < 5) {
    return { isValid: false, error: 'Konum en az 5 karakter olmalı' };
  }

  if (location.trim().length > 200) {
    return { isValid: false, error: 'Konum en fazla 200 karakter olabilir' };
  }

  return { isValid: true };
}

/**
 * Time validation (HH:MM format)
 */
export function validateTime(time: string): ValidationResult {
  if (!time || time.trim() === '') {
    return { isValid: true }; // Optional field
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(time)) {
    return { isValid: false, error: 'Geçerli bir saat girin (ÖR: 14:30)' };
  }

  return { isValid: true };
}

/**
 * Guest count validation
 */
export function validateGuestCount(count: number, max?: number): ValidationResult {
  if (count < 0) {
    return { isValid: false, error: 'Misafir sayısı negatif olamaz' };
  }

  if (max && count > max) {
    return { isValid: false, error: `En fazla ${max} misafir ekleyebilirsiniz` };
  }

  return { isValid: true };
}

/**
 * Password confirmation validation
 */
export function validatePasswordMatch(password: string, confirmPassword: string): ValidationResult {
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Şifreler eşleşmiyor' };
  }

  return { isValid: true };
}

/**
 * Strong password validation (for account security)
 */
export function validateStrongPassword(password: string): ValidationResult {
  if (!password || password.trim() === '') {
    return { isValid: false, error: 'Şifre gerekli' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Şifre en az 8 karakter olmalı' };
  }

  // Check for at least one uppercase, one lowercase, and one number
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return { 
      isValid: false, 
      error: 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir' 
    };
  }

  return { isValid: true };
}

/**
 * Debounce function for validation
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

