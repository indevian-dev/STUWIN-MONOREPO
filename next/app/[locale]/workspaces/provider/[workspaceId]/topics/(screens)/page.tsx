import { ProviderTopicsListWidget } from '@/app/[locale]/workspaces/provider/[workspaceId]/topics/(widgets)/ProviderTopicsListWidget';
import { withPageAuth } from "@/lib/middleware/handlers";

function ProviderTopicsListPage() {
  return (
    <div>
      <h1 className="text-3xl font-black text-left my-4 px-4">
        Mövzular (Topics)
      </h1>
      <ProviderTopicsListWidget />
    </div>
  );
}

export default withPageAuth(
  ProviderTopicsListPage,
  {
    path: '/workspaces/provider/:workspaceId/topics',
  }
);
