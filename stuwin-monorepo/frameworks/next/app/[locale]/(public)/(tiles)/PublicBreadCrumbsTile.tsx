'use client';

import { Link } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { Fragment } from 'react';

interface Category {
  id: number;
  title: string;
  slug: string;
  icon: string;
  parent_id: number | null;
}

interface Breadcrumb {
  label: string;
  href: string;
}

interface PublicBreadCrumbsTileProps {
  categories?: Category[];
  breadcrumbs?: Breadcrumb[];
}

export function PublicBreadCrumbsTile({ categories, breadcrumbs }: PublicBreadCrumbsTileProps) {

  const locale = useLocale();

  // If breadcrumbs are provided (simple array with label/href), use them directly
  if (breadcrumbs) {
    return (
      <div className="flex overflow-x-auto no-scrollbar space-x-2 items-center">
        {breadcrumbs.map((breadcrumb, index) => (
          <Fragment key={index}>
            <div>
              <Link href={breadcrumb.href} passHref locale={locale}>
                <span className="text-sm font-semibold text-dark/50 hover:underline cursor-pointer">
                  {breadcrumb.label}
                </span>
              </Link>
            </div>
            {index < breadcrumbs.length - 1 && <span>/</span>}
          </Fragment>
        ))}
      </div>
    );
  }

  // If categories are provided (hierarchical structure), build hierarchy
  if (!categories || categories.length === 0) {
    return null;
  }

  // Builds a linear hierarchy from the categories array
  const buildLinearHierarchy = (categories: Category[]) => {
    let hierarchy: Category[] = [];
    let currentCategory = categories.find(category => category.parent_id === null);

    while (currentCategory) {
      hierarchy.push(currentCategory);
      // Find the next category in the hierarchy (assuming each parent has at most one child)
      const parentId = currentCategory.id;
      currentCategory = categories.find(category => category.parent_id === parentId);
    }

    return hierarchy;
  };

  // Use the function to build the linear hierarchy from categories
  const linearHierarchy = buildLinearHierarchy(categories);

  return (
    <div className="flex overflow-x-auto no-scrollbar space-x-2 items-center">
      {linearHierarchy.map((category, index) => (
        <Fragment key={category.id}>
          <div>
            {/* Render the category with a link */}
            <div className="flex items-center space-x-1 relative rounded">
              <img src={`https://s3.tebi.io/stuwin.ai/icons/categories/${category.icon}`} alt="" className="h-4" />
              <Link href={`/${category.slug}-${category.id}c`} passHref locale={locale}>
                <span className="text-sm font-semibold text-dark/50 hover:underline cursor-pointer">
                  {category.title}
                </span>
              </Link>
            </div>
            {/* Render a divider for all but the last item */}
          </div>
          {index < linearHierarchy.length - 1 && <span>/</span>}
        </Fragment>
      ))}
    </div>
  );
}
