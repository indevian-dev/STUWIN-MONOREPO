"use client";

import React, { useState, createContext, useContext, ReactNode } from "react";
import { useParams } from "next/navigation";
import {
  PiHouseLine,
  PiUserCircle,
  PiChartLine,
  PiUsers,
  PiStorefront,
  PiTagSimple,
  PiFilePdf,
} from "react-icons/pi";
import { GlobalHeaderWidget } from "@/app/[locale]/(global)/(widgets)/GlobalHeader.widget";
import { GlobalFastNavigationWidget } from "@/app/[locale]/(global)/(widgets)/GlobalFastNavigation.widget";
import { GlobalFullNavigationWidget } from "@/app/[locale]/(global)/(widgets)/GlobalFullNavigation.widget";
import { Main } from "@/app/primitives/Main.primitive";
import { Container } from "@/app/primitives/Container.primitive";
import type { ClientAuthData } from "@stuwin/shared/types/auth/AuthData.types";
import type { DomainNavConfig } from "@stuwin/shared/types/ui/Navigation.types";

// Context for auth data in provider pages
export const ProviderAuthContext = createContext<ClientAuthData | null>(null);

export function useProviderAuth(): ClientAuthData {
  const context = useContext(ProviderAuthContext);
  if (!context) {
    throw new Error("useProviderAuth must be used within ProviderLayoutClient");
  }
  return context;
}

interface ProviderLayoutClientProps {
  children: ReactNode;
  authData: ClientAuthData | null;
}

/**
 * Provider Layout Client Component
 * Renders the provider UI shell with unified navigation
 * Only rendered after server-side auth validation passes
 */
export function ProviderLayoutClient({
  children,
  authData,
}: ProviderLayoutClientProps) {
  const params = useParams();
  const workspaceId = (params?.workspaceId as string) || "";
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const navConfig: DomainNavConfig = {
    domain: "provider",
    logoSrc: "/logo.svg",
    label: "stuwin.ai",
    subtitle: "Provider",
    fastNavLinks: [],
    menuGroups: {
      main: {
        label: "main",
        items: [
          { href: "/", icon: PiHouseLine, label: "return_to_website" },
          { href: `/workspaces/provider/${workspaceId}`, icon: PiChartLine, label: "dashboard" },
        ],
      },
      management: {
        label: "management",
        items: [
          { href: `/workspaces/provider/${workspaceId}/students`, icon: PiUsers, label: "students" },
          { href: `/workspaces/provider/${workspaceId}/members`, icon: PiUserCircle, label: "members" },
          { href: `/workspaces/provider/${workspaceId}/organization`, icon: PiStorefront, label: "organization_settings" },
        ],
      },
      libraries: {
        label: "libraries",
        items: [
          { href: `/workspaces/provider/${workspaceId}/subjects`, icon: PiTagSimple, label: "subjects" },
        ],
      },
      pdf_tools: {
        label: "pdf_tools",
        icon: PiFilePdf,
        items: [
          { href: "/pdf-tool", icon: PiFilePdf, label: "pdf-tools" },
        ],
      },
    },
    menuDisplayMode: {
      desktop: "sidebar",
      mobile: "mobile-modal",
    },
  };

  return (
    <ProviderAuthContext.Provider value={authData}>
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
    </ProviderAuthContext.Provider>
  );
}
