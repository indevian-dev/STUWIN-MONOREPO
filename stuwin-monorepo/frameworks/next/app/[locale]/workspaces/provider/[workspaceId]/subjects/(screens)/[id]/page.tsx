import { ProviderSubjectDetailWidget } from "@/app/[locale]/workspaces/provider/[workspaceId]/subjects/(widgets)/ProviderSubjectDetailWidget";
import { withPageAuth } from "@/lib/app-access-control/interceptors";

interface PageProps {
  params: Promise<{
    [key: string]: string;
    locale: string;
    id: string;
  }>;
}

async function ProviderSubjectDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const subjectId = resolvedParams.id;

  return (
    <div>
      <ProviderSubjectDetailWidget subjectId={subjectId} />
    </div>
  );
}

export default withPageAuth(ProviderSubjectDetailPage, {
  path: "/workspaces/provider/:workspaceId/subjects/:id",
});
