import BlogEdit from '@/app/[locale]/workspaces/staff/[workspaceId]/blogs/(widgets)/StaffBlogEditWidget';
import { withPageAuth } from '@/lib/app-access-control/interceptors';

interface BlogEditPageProps {
  params: Promise<{ blogId: string; locale: string }>;
}

async function BlogEditPage({ params }: BlogEditPageProps) {
  return <BlogEdit params={params} />;
}

export default withPageAuth(
  BlogEditPage,
  {
    path: '/workspaces/staff/:workspaceId/blogs/:blogId',
  }
);

