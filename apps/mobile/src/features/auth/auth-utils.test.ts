import { describe, expect, it } from 'vitest';

import { checkPassword, passwordRequirementMessage, validateEmail, validatePassword } from '@/features/auth/auth-utils';

describe('validateEmail', () => {
  it('accepts an ordinary address', () => {
    expect(validateEmail(' zeynep@example.com ')).toBe(true);
  });

  it('rejects an address with no domain', () => {
    expect(validateEmail('zeynep@')).toBe(false);
  });
});

describe('checkPassword', () => {
  it('accepts a password meeting every rule', () => {
    expect(checkPassword('Davetim2026')).toEqual([]);
    expect(validatePassword('Davetim2026')).toBe(true);
  });

  it('names each missing rule separately', () => {
    expect(checkPassword('short1A')).toEqual(['too_short']);
    expect(checkPassword('davetimapp')).toEqual(['needs_digit', 'needs_case']);
    expect(checkPassword('DAVETIM2026')).toEqual(['needs_case']);
  });

  // Turkish users pick Turkish words. Treating "ç" as no lowercase letter at
  // all would reject "Çiçek2026" with a message about missing lowercase.
  it('counts Turkish letters as letters', () => {
    expect(checkPassword('Çiçek2026')).toEqual([]);
    expect(checkPassword('şeker2026')).toEqual(['needs_case']);
  });
});

describe('passwordRequirementMessage', () => {
  it('says nothing when the password is fine', () => {
    expect(passwordRequirementMessage('Davetim2026')).toBeNull();
  });

  it('lists only what is missing', () => {
    expect(passwordRequirementMessage('davetimapp')).toBe('Şifrenizde en az bir rakam ve en az bir büyük ve bir küçük harf olmalı.');
    expect(passwordRequirementMessage('DAVETIM2026')).toBe('Şifrenizde en az bir büyük ve bir küçük harf olmalı.');
  });
});
