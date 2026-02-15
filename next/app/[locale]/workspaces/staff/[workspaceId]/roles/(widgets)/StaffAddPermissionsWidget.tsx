'use client';

import {
    useEffect,
    useState
} from 'react';
import { apiCall } from '@/lib/utils/http/SpaApiClient';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';


export function StaffAddPermissionsWidget() {
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchRoutes = async () => {
            try {
                const response = await apiCall<any>({
                    url: '/api/workspaces/routes',
                    method: 'GET',
                });
                const data = response;
                setRoutes(data);
            } catch (error) {
                setError(error instanceof Error ? error : new Error('Failed to fetch routes'));
            } finally {
                setLoading(false);
            }
        };

        fetchRoutes();
    }, []);

    if (loading) return <GlobalLoaderTile />;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div>
            <h1>Routes</h1>
        </div>
    );
}


