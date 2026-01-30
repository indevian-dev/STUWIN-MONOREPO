"use client";

import React, { useState, createContext, useContext, ReactNode } from "react";
import { useParams } from "next/navigation";
import {
  PiHouseLine,
  PiUserCircle,
  PiBell,
  PiPackage,
  PiListBullets,
  PiPlusCircle,
  PiChartLine,
  PiUsers,
  PiStorefront,
  PiTagSimple,
  PiFilePdf,
} from "react-icons/pi";
import { GlobalHeaderWidget } from "@/app/[locale]/(global)/(widgets)/GlobalHeaderWidget";
import { GlobalFastNavigationWidget } from "@/app/[locale]/(global)/(widgets)/GlobalFastNavigationWidget";
import { GlobalFullNavigationWidget } from "@/app/[locale]/(global)/(widgets)/GlobalFullNavigationWidget";
import type { AuthData } from "@/types";
import type { DomainNavConfig } from "@/types";

// Context for auth data in provider pages
export const ProviderAuthContext = createContext<AuthData | null>(null);

export function useProviderAuth(): AuthData {
  const context = useContext(ProviderAuthContext);
  if (!context) {
    throw new Error("useProviderAuth must be used within ProviderLayoutClient");
  }
  return context;
}

interface ProviderLayoutClientProps {
  children: ReactNode;
  authData: AuthData | null;
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
    label: "SHAGGUIDE",
    subtitle: "Provider",
    fastNavLinks: [
      {
        href: `/workspaces/provider/${workspaceId}/questions/create`,
        icon: PiPlusCircle,
        label: "create_question",
        variant: "primary",
        showOnMobile: true,
      },
    ],
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
          { href: `/workspaces/provider/${workspaceId}/organization`, icon: PiStorefront, label: "organization_settings" },
        ],
      },
      libraries: {
        label: "libraries",
        icon: PiListBullets,
        items: [
          { href: `/workspaces/provider/${workspaceId}/subjects`, icon: PiTagSimple, label: "subjects" },
          { href: `/workspaces/provider/${workspaceId}/questions`, icon: PiPackage, label: "questions" },
          { href: `/workspaces/provider/${workspaceId}/topics`, icon: PiListBullets, label: "topics" },
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
    </ProviderAuthContext.Provider>
  );
}
