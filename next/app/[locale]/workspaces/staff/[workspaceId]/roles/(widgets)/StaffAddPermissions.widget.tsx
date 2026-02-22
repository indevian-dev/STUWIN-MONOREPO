'use client';

import {
    useEffect,
    useState
} from 'react';
import { fetchApiUtil } from '@/lib/utils/Http.FetchApiSPA.util';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoader.tile';


export function StaffAddPermissionsWidget() {
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchRoutes = async () => {
            try {
                const response = await fetchApiUtil<any>({
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


