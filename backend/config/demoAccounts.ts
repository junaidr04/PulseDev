export const DEMO_ACCOUNTS = [
  { _id: '66a1bf9823e4d5c6b7a89002', email: 'priya.patel@pulsedev.io', role: 'lead' },
  { _id: '66a1bf9823e4d5c6b7a89003', email: 'marcus.vance@pulsedev.io', role: 'developer' },
  { _id: '66a1bf9823e4d5c6b7a89004', email: 'sophia.laurent@pulsedev.io', role: 'qa' },
  { _id: '66a1bf9823e4d5c6b7a89005', email: 'jordan.blake@pulsedev.io', role: 'guest' },
] as const;

export type DemoAccountMutation = 'password' | 'email' | 'role' | 'deletion';

export function isDemoAccountEmail(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  return DEMO_ACCOUNTS.some((account) => account.email === normalizedEmail);
}

export function isDemoAccount(user: { _id?: string; email?: string } | null | undefined): boolean {
  if (!user) return false;
  return DEMO_ACCOUNTS.some(
    (account) => account._id === user._id || account.email === user.email?.trim().toLowerCase()
  );
}

export function getDemoAccountMutationMessage(
  user: { _id?: string; email?: string } | null | undefined,
  mutation: DemoAccountMutation
): string | null {
  if (!isDemoAccount(user)) return null;

  switch (mutation) {
    case 'password':
      return 'Demo accounts cannot change their password.';
    case 'email':
      return 'Demo accounts cannot change their email.';
    case 'role':
      return 'Demo account roles cannot be changed.';
    case 'deletion':
      return 'Demo accounts cannot be deleted.';
  }
}
