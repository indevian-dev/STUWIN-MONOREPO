
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
import { getS3Url } from '@/lib/utils/s3Utility';

export interface Program {
    id: string;
    title: string;
    type: string;
    profile: {
        providerProgramDescription?: string;
        providerSubscriptionPrice?: number;
        providerSubscriptionPeriod?: string;
        logo?: string;
        location?: {
            address?: string;
            city?: string;
        };
        monthlyPrice?: number;
        yearlyPrice?: number;
        currency?: string;
    } | any;
    isActive: boolean;
    createdAt: string;
}

interface FetchProgramsOptions {
    page?: number;
    pageSize?: number;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
}

interface ProgramResponse {
    success: boolean;
    programs: Program[];
    total: number;
    page: number;
    pageSize: number;
}

/**
 * Fetch Programs list (Client-side)
 */
export async function fetchProgramsClient(options: FetchProgramsOptions = {}): Promise<ProgramResponse> {
    const {
        page = 1,
        pageSize = 24,
        search = '',
        sort = 'createdAt',
        order = 'desc'
    } = options;

    const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sort,
        order
    });

    if (search) {
        params.append('query', search);
    }

    try {
        const response = await apiCallForSpaHelper({
            method: 'GET',
            url: `/api/programs?${params.toString()}`
        });

        if (response.status === 200) {
            return response.data;
        } else {
            return {
                success: false,
                programs: [],
                total: 0,
                page,
                pageSize
            };
        }
    } catch (error) {
        ConsoleLogger.error('Error fetching Programs:', error);
        return {
            success: false,
            programs: [],
            total: 0,
            page,
            pageSize
        };
    }
}

/**
 * Get Program logo URL
 */
export function getProgramLogoUrl(program: Program): string {
    const logo = program.profile?.logo || program.profile?.providerLogo;
    if (!logo) {
        return '/stuwinlogo.png';
    }
    return getS3Url(`workspaces/${program.id}/${logo}`);
}
