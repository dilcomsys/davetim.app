export function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
}

export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/*
 * Leaked-password protection is a Pro-plan feature and this project is on the
 * free plan, so Supabase will accept anything eight characters long that the
 * client sends. The composition rules the free plan does offer — length, plus
 * required digits and mixed case — are the only strength floor available, and
 * the client has to agree with them or the server rejects a password the app
 * has already told the user is fine. See M4 in the security findings.
 *
 * Only sign-up and password-reset check this. Sign-in does not, so tightening
 * the rule never locks out an account created under the older, looser one.
 */
export type PasswordProblem = 'too_short' | 'needs_digit' | 'needs_case';

const problemMessages: Record<PasswordProblem, string> = {
  needs_case: 'en az bir büyük ve bir küçük harf',
  needs_digit: 'en az bir rakam',
  too_short: 'en az 8 karakter',
};

export function checkPassword(password: string): PasswordProblem[] {
  const problems: PasswordProblem[] = [];
  if (password.length < 8) problems.push('too_short');
  if (!/\d/.test(password)) problems.push('needs_digit');
  if (!/[a-zçğıöşü]/.test(password) || !/[A-ZÇĞİÖŞÜ]/.test(password)) problems.push('needs_case');
  return problems;
}

export function validatePassword(password: string) {
  return checkPassword(password).length === 0;
}

/** Names what is actually missing rather than restating the whole rule. */
export function passwordRequirementMessage(password: string) {
  const problems = checkPassword(password);
  if (problems.length === 0) return null;
  const parts = problems.map((problem) => problemMessages[problem]);
  const listed = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} ve ${parts[parts.length - 1]}`;
  return `Şifrenizde ${listed} olmalı.`;
}
