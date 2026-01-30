import type { NextRequest } from "next/server";
import type { ApiRouteHandler, ApiHandlerContext } from "@/types/next";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { NextResponse } from "next/server"; // Import NextResponse
import { headers } from "next/headers"; // Import headers function
import crypto from "crypto"; // Import crypto module
export const POST: ApiRouteHandler = withApiHandler(
  async (req, { authData, params }: ApiHandlerContext) => {
    const { provider, deviceInfo } = await req.json();
    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 },
      ); // Use NextResponse
    }
    // Define provider-specific configurations
    type ProviderConfig = {
      clientId: string | undefined;
      authUrl: string;
      scope: string;
    };
    const providerConfigs: Record<string, ProviderConfig> = {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        scope: "email profile",
      },
      facebook: {
        clientId: process.env.FACEBOOK_CLIENT_ID,
        authUrl: "https://www.facebook.com/v12.0/dialog/oauth",
        scope: "email public_profile",
      },
      apple: {
        clientId: process.env.APPLE_CLIENT_ID,
        authUrl: "https://appleid.apple.com/auth/authorize",
        scope: "email name",
      },
    };
    const config: ProviderConfig | undefined = providerConfigs[provider];
    if (!config) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }
    const redirectUri = (await getBaseUrl()) + `/auth/oauth/callback`;
    const state = crypto.randomUUID(); // Generate secure random state
    const authUrl = `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${encodeURIComponent(config.scope)}&state=${state}`;
    // Return the URL as a JSON response
    return NextResponse.json({ url: authUrl }, { status: 200 }); // Use NextResponse
  },
);
// Function to dynamically build the base URL based on request
const getBaseUrl = async () => {
  const headersList = await headers();
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const host = headersList.get("host");
  return `${protocol}://${host}`;
};


