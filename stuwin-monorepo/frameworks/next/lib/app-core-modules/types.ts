// Re-exporting from shared package to ensure single source of truth
// @/lib/app-core-modules/types is aliased to packages/shared/src/modules/common/index
export * from "../../../../packages/shared/src/modules/auth/types/authContext";
export * from "../../../../packages/shared/src/modules/auth/types/resources";
export * from "../../../../packages/shared/src/modules/auth/types/session";
export * from "../../../../packages/shared/src/modules/common/logger";

export interface EndpointConfig {
    method: string;
    authRequired: boolean;
    permission?: string;
    needEmailVerification?: boolean;
    needPhoneVerification?: boolean;
    twoFactorAuth?: boolean;
    twoFactorAuthType?: string;
    workspace?: 'student' | 'staff' | 'provider' | undefined;
    type: "page" | "api";
    collectActionLogs?: boolean;
    collectLogs?: boolean;
    queryDataAuthenticated?: boolean;
    [key: string]: any;
}
