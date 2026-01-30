// ═══════════════════════════════════════════════════════════════
// NAVIGATION TYPES
// ═══════════════════════════════════════════════════════════════
// Types for navigation items, menus, and navigation structures
//
// USAGE:
// - Import from @/types: import { NavigationItem, NavigationGroup, DomainNavConfig } from '@/types';
// - Used in GlobalFastNavigationWidget, GlobalFullMenuWidget, GlobalHeaderWidget, Layout Clients
// ═══════════════════════════════════════════════════════════════

import { IconType } from 'react-icons';

/**
 * Single navigation item with optional icon, badge, and children
 */
export interface NavigationItem {
  /** Display label for the navigation item */
  label: string;
  /** Link destination (can be internal route or external URL) */
  href: string;
  /** Optional icon component to display */
  icon?: React.ComponentType<any>;
  /** Optional badge text or number to display */
  badge?: string | number;
  /** Optional nested navigation items */
  children?: NavigationItem[];
}

/**
 * Group of navigation items with optional title
 */
export interface NavigationGroup {
  /** Optional group title/heading */
  title?: string;
  /** Array of navigation items in this group */
  items: NavigationItem[];
}

/**
 * Navigation item used in menus
 */
export interface NavItem {
  /** Link destination */
  href: string;
  /** Icon component from react-icons */
  icon: IconType;
  /** Translation key for label */
  label: string;
  /** Optional disabled state */
  disabled?: boolean;
}

/**
 * Fast navigation link (action buttons in header/bottom bar)
 */
export interface FastNavLink {
  /** Link destination */
  href: string;
  /** Icon component from react-icons */
  icon: IconType;
  /** Translation key for label */
  label: string;
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'default';
  /** Whether to show on mobile */
  showOnMobile?: boolean;
}

/**
 * Menu group containing related navigation items
 */
export interface MenuGroup {
  /** Translation key for group label */
  label: string;
  /** Optional icon for group */
  icon?: IconType;
  /** Navigation items in this group */
  items: NavItem[];
}

/**
 * Menu display mode
 */
export type MenuDisplayMode = 'dropdown' | 'sidebar' | 'mobile-modal';

/**
 * Complete navigation configuration for a domain
 */
export interface DomainNavConfig {
  /** Domain identifier */
  domain: 'public' | 'student' | 'provider' | 'eduorg' | 'staff' | 'workspaces';
  /** Logo source path */
  logoSrc: string;
  /** App label */
  label: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Fast action links (header/bottom bar) */
  fastNavLinks: FastNavLink[];
  /** Organized menu groups */
  menuGroups: Record<string, MenuGroup>;
  /** Menu display configuration */
  menuDisplayMode: {
    desktop: MenuDisplayMode;
    mobile: MenuDisplayMode;
  };
}
