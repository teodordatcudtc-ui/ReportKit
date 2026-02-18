export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72; // bcrypt truncates after 72 bytes

export function getPasswordIssues(password: string): string[] {
  const issues: string[] = [];
  const pw = password ?? '';

  if (pw.length < PASSWORD_MIN_LENGTH) issues.push(`Minim ${PASSWORD_MIN_LENGTH} caractere`);
  if (pw.length > PASSWORD_MAX_LENGTH) issues.push(`Maxim ${PASSWORD_MAX_LENGTH} caractere`);
  if (/\s/.test(pw)) issues.push('Fără spații');
  if (!/[a-z]/.test(pw)) issues.push('Cel puțin o literă mică (a-z)');
  if (!/[A-Z]/.test(pw)) issues.push('Cel puțin o literă mare (A-Z)');
  if (!/[0-9]/.test(pw)) issues.push('Cel puțin o cifră (0-9)');
  if (!/[^A-Za-z0-9]/.test(pw)) issues.push('Cel puțin un simbol (ex: !@#$)');

  const normalized = pw.toLowerCase();
  const tooCommon = ['password', 'parola', '12345678', 'qwerty', 'admin', 'letmein'];
  if (pw.length >= PASSWORD_MIN_LENGTH && tooCommon.some((c) => normalized.includes(c))) {
    issues.push('Evită parole comune (ex: password/12345678)');
  }

  return issues;
}

export function isPasswordStrong(password: string): boolean {
  return getPasswordIssues(password).length === 0;
}

