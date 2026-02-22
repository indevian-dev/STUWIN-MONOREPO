"use client";

import React, { useState, createContext, useContext, ReactNode } from "react";
import { useParams } from "next/navigation";
import {
  PiHouseLine,
  PiUserCircle,
  PiHeart,
  PiBell,
  PiGameController,
  PiListBullets,
  PiBookBookmarkLight,
  PiExamLight,
  PiNotebook,
  PiBrain,
  PiBuildings,
  PiMagnifyingGlass,
  PiScroll,
  PiTarget,
  PiChartLineUp,
} from "react-icons/pi";
import { GlobalHeaderWidget } from "@/app/[locale]/(global)/(widgets)/GlobalHeader.widget";
import { GlobalFastNavigationWidget } from "@/app/[locale]/(global)/(widgets)/GlobalFastNavigation.widget";
import { GlobalFullNavigationWidget } from "@/app/[locale]/(global)/(widgets)/GlobalFullNavigation.widget";
import { Main } from "@/app/primitives/Main.primitive";
import { Container } from "@/app/primitives/Container.primitive";
import type { ClientAuthData } from "@stuwin/shared/types/auth/AuthData.types";
import type { DomainNavConfig } from "@stuwin/shared/types/ui/Navigation.types";

// Context for auth data in student pages
export const StudentAuthContext = createContext<ClientAuthData | null>(null);

export function useStudentAuth(): ClientAuthData {
  const context = useContext(StudentAuthContext);
  if (!context) {
    throw new Error("useStudentAuth must be used within StudentLayoutClient");
  }
  return context;
}

interface StudentLayoutClientProps {
  children: ReactNode;
  authData: ClientAuthData | null;
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
      activities: {
        label: "activities",
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
          {
            href: `/workspaces/student/${workspaceId}/homeworks`,
            icon: PiNotebook,
            label: "homework",
          },
          {
            href: `/workspaces/student/${workspaceId}/learning/sessions`,
            icon: PiBrain,
            label: "learning_sessions",
          },
        ],
      },
      insights: {
        label: "insights",
        items: [
          {
            href: `/workspaces/student/${workspaceId}/goals`,
            icon: PiTarget,
            label: "goals",
          },
          {
            href: `/workspaces/student/${workspaceId}/progress`,
            icon: PiChartLineUp,
            label: "progress",
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

      <Main variant="app">
        <Container variant="7xl" className="flex items-start h-full max-w-7xl mx-auto gap-4 px-4">
          <aside className="hidden lg:flex shrink-0 sticky top-[70px] min-h-[calc(100vh-70px)] overflow-hidden w-64 flex-col">
            <GlobalFullNavigationWidget
              config={navConfig}
              isMenuOpen={isMenuOpen}
              setIsMenuOpen={setIsMenuOpen}
            />
          </aside>
          <div className="flex-1 min-w-0 w-full">
            {children}
          </div>
        </Container>
      </Main>
    </StudentAuthContext.Provider>
  );
}
