import { ProviderSubjectDetailWidget } from "@/app/[locale]/workspaces/provider/[workspaceId]/subjects/(widgets)/ProviderSubjectDetail.widget";
import { withPageAuth } from "@/lib/middleware/_Middleware.index";
import { WorkspacePageTitleTile } from "@/app/[locale]/workspaces/(root)/(tiles)/WorkspacePageTitle.tile";
import { PiBrain } from "react-icons/pi";

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
      <WorkspacePageTitleTile
        title="Subject Details"
        subtitle="Manage your curriculum subjects"
        icon={<PiBrain />}
        action={null}
        className="mb-4"
      />
      <ProviderSubjectDetailWidget subjectId={subjectId} />
    </div>
  );
}

export default withPageAuth(ProviderSubjectDetailPage, {
  path: "/workspaces/provider/:workspaceId/subjects/:id",
});
