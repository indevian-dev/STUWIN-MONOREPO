import { ProviderTopicDetailWidget } from "@/app/[locale]/workspaces/provider/[workspaceId]/topics/(widgets)/ProviderTopicDetailWidget";
import { withPageAuth } from "@/lib/middleware/handlers";

interface PageProps {
  params: Promise<{
    [key: string]: string;
    locale: string;
    id: string;
  }>;
}

async function ProviderTopicDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const topicId = resolvedParams.id;

  return (
    <div>
      <ProviderTopicDetailWidget topicId={topicId} />
    </div>
  );
}

export default withPageAuth(ProviderTopicDetailPage, {
  path: "/workspaces/provider/:workspaceId/topics/:id",
});
