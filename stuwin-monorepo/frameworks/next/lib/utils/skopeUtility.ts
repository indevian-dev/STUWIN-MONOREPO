// ═══════════════════════════════════════════════════════════════
// SCOPE UTILITY
// Maps scope types to domains and generates scope keys
// ═══════════════════════════════════════════════════════════════

/**
 * Domain types available in the application
 */
export type DomainType = 'public' | 'staff' | 'student' | 'provider' | 'parent';
export type SkopeType = 'public' | 'staff' | 'student' | 'provider' | 'parent';

/**
 * Maps a scope type to its corresponding domain
 * @param scopeType - The access scope type
 * @returns The domain path segment
 */
export function mapSkopeTypeToDomain(scopeType: SkopeType | null | undefined): DomainType {
  switch (scopeType) {
    case 'staff':
      return 'staff';
    case 'student':
      return 'student';
    case 'provider':
      return 'provider';
    case 'public':
      return 'public';
    default:
      return 'student'; // Default fallback
  }
}

/**
 * Generates a scope key based on account type
 * @param scopeType - The scope type
 * @param id - The relevant ID (account_id or eduorg_id)
 * @returns The generated scope key
 */
export function generateSkopeKey(scopeType: SkopeType, id: string): string {
  switch (scopeType) {
    case 'staff':
      return 'staff_0'; // All staff share the same scope
    case 'student':
      return `student_${id}`;
    case 'provider':
      return `provider_${id}`;
    default:
      return `student_${id}`; // Default fallback
  }
}

/**
 * Determines the scope type based on account properties
 * @param account - Account data with is_staff and other properties
 * @returns The determined scope type
 */
export function determineSkopeType(account: {
  isStaff?: boolean | null;
  eduOrganizationId?: string | null;
  isPersonal?: boolean | null;
}): SkopeType {
  if (account.isStaff) {
    return 'staff';
  }

  // Map legacy eduorg to provider in scope determination
  if (account.eduOrganizationId) {
    return 'provider';
  }

  // Add logic here to determine if account is a provider
  // For now, default to student for personal accounts
  return 'student';
}

/**
 * Assigns scope to an account based on its properties
 * @param account - Account data
 * @returns Object with scopeType and scopeKey
 */
export function assignAccountScope(account: {
  id: string;
  isStaff?: boolean | null;
  eduOrganizationId?: string | null;
  isPersonal?: boolean | null;
}): { scopeType: SkopeType; scopeKey: string } {
  const scopeType = determineSkopeType(account);
  const scopeKey = generateSkopeKey(
    scopeType,
    (scopeType as any) === 'provider' && account.eduOrganizationId ? account.eduOrganizationId : account.id
  );

  return { scopeType, scopeKey };
}

/**
 * Gets the default landing page for a domain
 * @param domain - The domain type
 * @returns The default page path
 */
export function getDomainLandingPage(domain: DomainType): string {
  switch (domain) {
    case 'staff':
      return '/staff';
    case 'provider':
      return '/provider';
    case 'student':
      return '/student';
    case 'public':
      return '/';
    default:
      return '/';
  }
}

