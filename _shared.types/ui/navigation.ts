// Navigation Types
// Uses generic ComponentType instead of react-icons IconType for framework independence

/**
 * Single navigation item with optional icon, badge, and children
 */
export interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ComponentType<any>;
  badge?: string | number;
  children?: NavigationItem[];
}

/**
 * Group of navigation items with optional title
 */
export interface NavigationGroup {
  title?: string;
  items: NavigationItem[];
}

/**
 * Navigation item used in menus
 */
export interface NavItem {
  href: string;
  icon: React.ComponentType<any>;
  label: string;
  disabled?: boolean;
}

/**
 * Fast navigation link (action buttons in header/bottom bar)
 */
export interface FastNavLink {
  href: string;
  icon: React.ComponentType<any>;
  label: string;
  variant?: 'primary' | 'secondary' | 'default';
  showOnMobile?: boolean;
}

/**
 * Menu group containing related navigation items
 */
export interface MenuGroup {
  label: string;
  icon?: React.ComponentType<any>;
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
  domain: 'public' | 'student' | 'provider' | 'eduorg' | 'staff' | 'workspaces';
  logoSrc: string;
  label: string;
  subtitle?: string;
  fastNavLinks: FastNavLink[];
  menuGroups: Record<string, MenuGroup>;
  menuDisplayMode: {
    desktop: MenuDisplayMode;
    mobile: MenuDisplayMode;
  };
}
