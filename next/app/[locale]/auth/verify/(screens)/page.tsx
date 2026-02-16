
import { AuthVerificationWidget } from '../(widgets)/AuthVerificationWidget';
import { withPageAuth } from '@/lib/middleware/handlers';

interface AuthVerifyPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function AuthVerifyPage({ searchParams }: AuthVerifyPageProps) {
    const params = await searchParams;
    const type = (params.type === 'phone' ? 'phone' : 'email') as 'email' | 'phone';

    return <AuthVerificationWidget key={type} type={type} />;
}

export default withPageAuth(
    AuthVerifyPage,
    {
        path: '/auth/verify'
    }
);
