import { withPageAuth } from "@/lib/app-access-control/interceptors";
import ProviderStudentDetailPageClient from '../ProviderStudentDetailPageClient';

interface StudentDetailPageProps {
  params: Promise<{ id: string; locale: string }>;
}

async function ProviderStudentDetailPage({ params }: StudentDetailPageProps) {
  const resolvedParams = await params;
  return <ProviderStudentDetailPageClient studentId={resolvedParams.id} />;
}

export default withPageAuth(
  ProviderStudentDetailPage,
  {
    path: '/workspaces/provider/:workspaceId/students/:id',
  }
);




