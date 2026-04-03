export const normalizeEmail = (email: string) => email.trim().toLowerCase();

// Prevent invalid local parts like trailing dots before @ (e.g. name.@gmail.com)
export const isValidEmailAddress = (email: string) => {
  const normalized = normalizeEmail(email);

  if (!normalized || normalized.includes('..')) return false;

  const parts = normalized.split('@');
  if (parts.length !== 2) return false;

  const [localPart, domain] = parts;
  if (!localPart || !domain) return false;
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
  if (domain.startsWith('.') || domain.endsWith('.')) return false;
  if (!domain.includes('.')) return false;

  return /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(normalized);
};
