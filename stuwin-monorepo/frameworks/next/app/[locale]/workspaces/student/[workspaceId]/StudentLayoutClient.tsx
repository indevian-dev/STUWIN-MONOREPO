"use client";

import React, { useState, createContext, useContext, ReactNode } from "react";
import { useParams } from "next/navigation";
import {
  PiHouseLine,
  PiUserCircle,
  PiHeart,
  PiBell,
  PiStorefront,
  PiStorefrontDuotone,
  PiGameController,
  PiListBullets,
  PiBookBookmarkLight,
  PiExamLight,
  PiNotebook,
  PiBrain,
  PiBuildings,
  PiMagnifyingGlass,
  PiScroll,
} from "react-icons/pi";
import { GlobalHeaderWidget } from "@/app/[locale]/(global)/(widgets)/GlobalHeaderWidget";
import { GlobalFastNavigationWidget } from "@/app/[locale]/(global)/(widgets)/GlobalFastNavigationWidget";
import { GlobalFullNavigationWidget } from "@/app/[locale]/(global)/(widgets)/GlobalFullNavigationWidget";
import type { AuthData } from "@/types";
import type { DomainNavConfig } from "@/types";

// Context for auth data in student pages
export const StudentAuthContext = createContext<AuthData | null>(null);

export function useStudentAuth(): AuthData {
  const context = useContext(StudentAuthContext);
  if (!context) {
    throw new Error("useStudentAuth must be used within StudentLayoutClient");
  }
  return context;
}

interface StudentLayoutClientProps {
  children: ReactNode;
  authData: AuthData | null;
}

/**
 * Student Layout Client Component
 * Renders the student UI shell with unified navigation
 * Only rendered after server-side auth validation passes
 */
export function StudentLayoutClient({
  children,
  authData,
}: StudentLayoutClientProps) {
  const params = useParams();
  const workspaceId = (params?.workspaceId as string) || "";
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const navConfig: DomainNavConfig = {
    domain: "student",
    logoSrc: "/logo.svg",
    label: "stuwin.ai",
    subtitle: "Dashboard",
    fastNavLinks: [
      {
        href: `/workspaces/student/${workspaceId}/bookmarks`,
        icon: PiBookBookmarkLight,
        label: "bookmarks",
        variant: "default",
        showOnMobile: true,
      },
      {
        href: `/workspaces/student/${workspaceId}/quizzes`,
        icon: PiExamLight,
        label: "quizzes",
        variant: "primary",
        showOnMobile: true,
      },
    ],
    menuGroups: {
      main: {
        label: "main",
        items: [{ href: "/", icon: PiHouseLine, label: "return_to_website" }],
      },
      quizzes: {
        label: "quizzes",
        items: [
          {
            href: `/workspaces/student/${workspaceId}/quizzes/start`,
            icon: PiGameController,
            label: "start_quiz",
          },
          {
            href: `/workspaces/student/${workspaceId}/quizzes`,
            icon: PiListBullets,
            label: "quiz_history",
          },
        ],
      },
      homework: {
        label: "homework",
        items: [
          { href: `/workspaces/student/${workspaceId}/homeworks`, icon: PiNotebook, label: "homework" },
        ],
      },
      learning: {
        label: "learning",
        items: [
          {
            href: `/workspaces/student/${workspaceId}/learning/sessions`,
            icon: PiBrain,
            label: "learning_sessions",
          },
        ],
      },
      account: {
        label: "account",
        items: [
          {
            href: `/workspaces/student/${workspaceId}/accounts/me`,
            icon: PiUserCircle,
            label: "account",
          },
          {
            href: `/workspaces/student/${workspaceId}/favorites`,
            icon: PiHeart,
            label: "liked_questions",
          },
          {
            href: `/workspaces/student/${workspaceId}/notifications`,
            icon: PiBell,
            label: "notifications",
          },
        ],
      },
      providers: {
        label: 'providers',
        icon: PiBuildings,
        items: [
          { href: `/workspaces/student/${workspaceId}/providers`, icon: PiMagnifyingGlass, label: 'find_providers' },
          { href: `/workspaces/student/${workspaceId}/providers/applications`, icon: PiScroll, label: 'my_applications' }
        ]
      },
    },
    menuDisplayMode: {
      desktop: "sidebar",
      mobile: "mobile-modal",
    },
  };

  return (
    <StudentAuthContext.Provider value={authData}>
      <GlobalHeaderWidget
        config={navConfig}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      >
        <GlobalFastNavigationWidget
          config={navConfig}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
        />
      </GlobalHeaderWidget>

      <main className="layout-main-grid">
        <nav className="relative col-span-5 md:col-span-1 rounded">
          <GlobalFullNavigationWidget
            config={navConfig}
            isMenuOpen={isMenuOpen}
            setIsMenuOpen={setIsMenuOpen}
          />
        </nav>
        <div className="col-span-5 md:col-span-4 rounded">{children}</div>
      </main>
    </StudentAuthContext.Provider>
  );
}
